"use strict";
/** @param {LLH.Depends.Promise<void>} loadDeferred */
function renderPage(loadDeferred) {

    var createElement = LLUnit.createElement;
    var updateSubElements = LLUnit.updateSubElements;
    /*
        context = {
            renderer: <renderer>
            parsedData: [<line>, ...]
            currentLineIndex: <line index>

            versionedData: [<line>, ...]
        }
        line = {
            indent: <indent: ' '>
            headLevel: <head level: '# '> (optional)
            isUList: <non-numbered list: '* '> (optional)
            isOList: <numbered list: '1. '> (optional)
            contents: [<content>, ...] (optional)

            htmlAttributes:
            jpVersionFrom:
            jpVersionTo:
            cnVersionFrom:
            cnVersionTo:
        }
        content: {
            type: <'text'|'func'|'bold'|'code'|'url'>
            text: <plain-text> (for text, bold, code, url type)
            funcName: <function name> (only for func type)
            params: [<parameter>, ...] (only for func type)
            url: <url> (for url type)
        }
    */
    var md_parser = {
        'parse': function (str) {
            var raw_lines = str.split('\n');
            var ret = [];
            var i;
            // skip head empty lines
            for (i = 0; i < raw_lines.length && raw_lines[i] == ''; i++);
            for (; i < raw_lines.length; i++) {
                ret.push(md_parser.parseLine(raw_lines[i]));
            }
            return ret;
        },
        'parseLine': function (str) {
            var lineData = {};
            var pos = md_parser.parsePrefix(str, lineData);
            if (pos == str.length) {
                return lineData;
            }
            lineData.contents = [];
            while (pos < str.length) {
                pos = md_parser.parseContent(str, pos, lineData);
            }
            return lineData;
        },
        'parsePrefix': function (str, out) {
            var indent = 0;
            var headLevel = 0;
            var i, j;
            for (i = 0; i < str.length && str[i] == ' '; i++);
            out.indent = i;
            if (str[i] == '#') {
                for (j = i + 1; j < str.length && str[j] == '#'; j++);
                out.headLevel = j - i;
                for (; j < str.length && str[j] == ' '; j++);
                return j;
            } else if (str[i] == '*' && str[i + 1] == ' ') {
                out.isUList = true;
                return i + 2;
            } else if (j = str.substr(i).match(/\d+\. /)) {
                out.isOList = true;
                return i + j[0].length;
            }
            return i;
        },
        'parseContent': function (str, pos, out) {
            var i;
            for (i = pos; i < str.length; i++) {
                if (str[i] == '[' || str[i] == '`' || (str[i] == '*' && str[i + 1] == '*')) {
                    break;
                }
            }
            if (i > pos) {
                out.contents.push({ 'type': 'text', 'text': str.substr(pos, i - pos) });
            }
            if (i >= str.length) return i;
            if (str[i] == '[') {
                return md_parser.parseUrlOrFunc(str, i + 1, out);
            } else if (str[i] == '`') {
                return md_parser.parseCode(str, i + 1, out);
            } else {
                return md_parser.parseBold(str, i + 2, out);
            }
        },
        'parseUrlOrFunc': function (str, pos, out) {
            var isUrl = false;
            var i;
            for (i = pos; i < str.length - 1; i++) {
                if (str[i] == ']' && str[i + 1] == '(') {
                    isUrl = true;
                    break;
                }
            }
            if (isUrl) {
                var displayText = str.substr(pos, i - pos);
                var u = '';
                pos = i + 2;
                for (i = pos; i < str.length; i++) {
                    if (str[i] == ')') {
                        u = str.substr(pos, i - pos);
                        break;
                    }
                }
                out.contents.push({ 'type': 'url', 'text': displayText, 'url': u })
                return i + 1;
            } else {
                return md_parser.parseFunc(str, pos, out);
            }
        },
        'parseFunc': function (str, pos, out) {
            var funcName;
            var params = [];
            var i, begin = pos;
            for (i = pos; i < str.length; i++) {
                if (str[i] == ']' || str[i] == ':') {
                    var s = (i == begin ? '' : str.substr(begin, i - begin));
                    if (funcName === undefined) {
                        funcName = s;
                    } else {
                        params.push(s);
                    }
                    begin = i + 1;
                    if (str[i] == ']') break;
                }
            }
            out.contents.push({ 'type': 'func', 'funcName': (funcName || ''), 'params': params });
            return i + 1;
        },
        'parseCode': function (str, pos, out) {
            var i;
            for (i = pos; i < str.length && str[i] != '`'; i++);
            var s = (i == pos ? '' : str.substr(pos, i - pos));
            out.contents.push({ 'type': 'code', 'text': s });
            return i + 1;
        },
        'parseBold': function (str, pos, out) {
            var i;
            for (i = pos; i < str.length && !(str[i] == '*' && str[i + 1] == '*'); i++);
            var s = (i == pos ? '' : str.substr(pos, i - pos));
            out.contents.push({ 'type': 'bold', 'text': s });
            return i + 2;
        }
    };
    var md_func = {
        'version_selector': function (context, params) {
            // check all available versions
            var versionedDocContainer = createElement('div');
            var versions = {};
            var i;
            var FUTURE_VERSION = '999';
            var versionedData = context.parsedData.splice(context.currentLineIndex + 1, context.parsedData.length - context.currentLineIndex - 1);
            context.parsedData.push({
                'indent': 0,
                'contents': [{
                    'type': 'func',
                    'funcName': '_element',
                    'params': [versionedDocContainer]
                }]
            });
            context.versionedData = versionedData;
            for (i = 0; i < versionedData.length; i++) {
                var curLine = versionedData[i];
                var curContents = curLine.contents;
                if (!curContents) continue;
                var lastContent = curContents[curContents.length - 1];
                if (lastContent.type == 'func' && (lastContent.funcName == 'version' || lastContent.funcName == 'version_from')) {
                    var versionParams = lastContent.params;
                    versions['jp' + versionParams[0]] = 1;
                    curLine.jpVersionFrom = versionParams[0];
                    if (versionParams[1]) {
                        versions['cn' + versionParams[1]] = 1;
                        curLine.cnVersionFrom = versionParams[1];
                    } else {
                        curLine.cnVersionFrom = FUTURE_VERSION;
                    }
                    if (lastContent.funcName == 'version_from') {
                        var nextContents = versionedData[i + 1].contents;
                        var nextVersionParams = nextContents[nextContents.length - 1].params;
                        curLine.jpVersionTo = nextVersionParams[0];
                        if (nextVersionParams[1]) {
                            curLine.cnVersionTo = nextVersionParams[1];
                        } else {
                            curLine.cnVersionTo = FUTURE_VERSION;
                        }
                    }
                    curContents.pop();
                }
            }
            var versionKeys = [];
            for (i in versions) {
                versionKeys.push(i);
            }
            versionKeys.sort(function (a, b) {
                var va = a.substr(2), vb = b.substr(2);
                if (va == vb) {
                    return (a[0] == 'j' ? -1 : 1);
                }
                return parseFloat(vb) - parseFloat(va);
            });
            var copyObject = function (obj) {
                var ret = {};
                for (var i in obj) {
                    ret[i] = obj[i];
                }
                return ret;
            };
            var compareVersion = function (curVersionNumber, curVersionIsJp, compareLine) {
                var versionFrom = (curVersionIsJp ? compareLine.jpVersionFrom : compareLine.cnVersionFrom);
                var versionTo = (curVersionIsJp ? compareLine.jpVersionTo : compareLine.cnVersionTo);
                // version is earlier than line
                if (versionFrom && curVersionNumber < parseFloat(versionFrom)) return -1;
                // version is older than line
                if (versionTo && curVersionNumber >= parseFloat(versionTo)) return 1;
                // version is in line
                return 0;
            };
            var renderVersionedData = function (version, diff_version) {
                var curVersionLines = [];
                var isJpVersion = (version[0] == 'j');
                var isDiffJpVersion = (diff_version && diff_version[0] == 'j');
                var versionNumber = parseFloat(version.substr(2));
                var diffVersionNumber = (diff_version ? parseFloat(diff_version.substr(2)) : 0);
                var i;
                for (i = 0; i < versionedData.length; i++) {
                    var curLine = versionedData[i];
                    var versionComp = compareVersion(versionNumber, isJpVersion, curLine);
                    if (versionComp < 0) continue;
                    if (versionComp > 0) {
                        if (diff_version && compareVersion(diffVersionNumber, isDiffJpVersion, curLine) == 0) {
                            // add deprecated
                            var deprecatedLine = copyObject(curLine);
                            deprecatedLine.htmlAttributes = { 'className': 'll_ver_deprecated' };
                            curVersionLines.push(deprecatedLine);
                        }
                    } else {
                        if (diff_version && compareVersion(diffVersionNumber, isDiffJpVersion, curLine) < 0) {
                            // add new
                            var newLine = copyObject(curLine);
                            newLine.htmlAttributes = { 'className': 'll_ver_new' };
                            curVersionLines.push(newLine);
                        } else {
                            curVersionLines.push(curLine);
                        }
                    }
                }
                var newContext = {
                    'renderer': context.renderer,
                    'parsedData': curVersionLines,
                };
                updateSubElements(versionedDocContainer, newContext.renderer.render(newContext), true);
            };
            var options = [];
            for (i = 0; i < versionKeys.length; i++) {
                var value = versionKeys[i];
                var text = (value[0] == 'j' ? '日服' : '国服') + '版本' + value.substr(2);
                options.push({ 'value': value, 'text': text });
            }
            var options_diff = [{ 'value': '', 'text': '选择作比较的版本' }].concat(options);
            var select = createElement('select', { 'className': 'form-control' });
            var select_diff = createElement('select', { 'className': 'form-control' });
            var select_comp = new LLSelectComponent(select);
            var select_diff_comp = new LLSelectComponent(select_diff);
            select_comp.setOptions(options);
            select_diff_comp.setOptions(options_diff);
            select_comp.set(versionKeys[0]);
            select_diff_comp.set('');
            select_comp.onValueChange = function (v) {
                var ver_num = parseFloat(v.substr(2));
                select_diff_comp.filterOptions(function (opt) {
                    if (opt.value == '') return true;
                    if (opt.value == v) return false;
                    return (parseFloat(opt.value.substr(2)) <= ver_num);
                });
                renderVersionedData(v, select_diff_comp.get());
            };
            select_diff_comp.onValueChange = function (v) {
                renderVersionedData(select_comp.get(), v);
            };
            select_comp.onValueChange(versionKeys[0]);
            return createElement('span', { 'className': 'form-inline' }, [select, select_diff]);
        },
        'ref': function (context, params) {
            var targetId = params[0];
            var displayText = (params.length > 1 ? params[1] : targetId)
            return createElement('sup', undefined, [
                '[',
                createElement('a', { 'href': '#' + targetId }, [displayText]),
                ']'
            ]);
        },
        'refe': function (context, params) {
            var refereeId = params[0];
            var refereeText = (params.length > 1 ? params[1] : refereeId);
            return [createElement('sup', { 'id': refereeId }, ['↑']), refereeText + '：'];
        },
        'overheal_bonus_rate': function (context, params) {
            var table_data = [];
            var header_row = [];
            var i;
            var min_hp = 9, max_hp = 63;
            var total_column = 5;
            var total_row = Math.ceil((max_hp - min_hp + 1) / total_column - 1e-8);
            for (i = 0; i < total_column; i++) {
                if (i > 0) header_row.push('');
                header_row.push('#HP_max');
                header_row.push('#每管加成');
            }
            table_data.push(header_row);
            for (i = min_hp; i <= max_hp; i++) {
                var curRow = ((i - min_hp) % total_row) + 1;
                if (table_data.length <= curRow) table_data.push([]);
                if (table_data[curRow].length > 0) {
                    table_data[curRow].push('');
                }
                table_data[curRow].push(i);
                table_data[curRow].push((LLConst.Common.getOverHealLevelBonus(i, 1) * 100 - 100).toFixed(2) + '%');
            }
            return LLUnit.createSimpleTable(table_data);
        },
        'cf_combo_factor': function (context, params) {
            var cf_pattern = /** @type {LLH.Core.ComboFeverPattern} */ (parseInt(params[0]));
            var table_data = [];
            var header_row = [];
            var min_combo = 0, max_combo = (cf_pattern == 1 ? 300 : 220);
            var total_column = 3;
            var total_row = Math.ceil((max_combo - min_combo + 1) / 10 / total_column - 1e-8);
            var i;
            for (i = 0; i < total_column; i++) {
                if (i > 0) header_row.push('');
                header_row.push('#combo');
                header_row.push('#连击权重');
            }
            table_data.push(header_row);
            for (i = min_combo; i <= max_combo; i += 10) {
                var curRow = (((i - min_combo) / 10) % total_row) + 1;
                if (table_data.length <= curRow) table_data.push([]);
                if (table_data[curRow].length > 0) {
                    table_data[curRow].push('');
                }
                table_data[curRow].push(i + '~' + (i == max_combo ? '' : i + 9));
                table_data[curRow].push(LLConst.Live.getComboFeverBonus(i, cf_pattern).toFixed(2));
            }
            return LLUnit.createSimpleTable(table_data);
        },
        'repeat_select': function (context, params) {
            var container = createElement('div', undefined, ['载入中...']);
            $.when(LLCardData.getAllBriefData(), LLMetaData.get()).then(function (data, metaData) {
                LLConst.initMetadata(metaData);
                var needCards = {};
                var notes = {};
                var effects = [
                    LLConstValue.SKILL_EFFECT_LEVEL_UP,
                    LLConstValue.SKILL_EFFECT_POSSIBILITY_UP,
                    LLConstValue.SKILL_EFFECT_REPEAT,
                    LLConstValue.SKILL_EFFECT_SCORE,
                    LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP,
                    LLConstValue.SKILL_EFFECT_HEAL,
                    LLConstValue.SKILL_EFFECT_ACCURACY_NORMAL
                ];
                for (var i in data) {
                    var curCard = data[i];
                    if (curCard.triggertype != LLConstValue.SKILL_TRIGGER_NOTE) continue;
                    if (curCard.rarity != 'UR') continue;
                    var effect = parseInt(curCard.skilleffect);
                    var note = parseInt(curCard.triggerrequire);
                    notes[note] = 1;
                    if (!needCards[effect]) {
                        needCards[effect] = {};
                    }
                    if (!needCards[effect][note]) {
                        needCards[effect][note] = [];
                    }
                    needCards[effect][note].push(curCard);
                }
                var headerRow = ['#图标'];
                for (var j = 0; j < effects.length; j++) {
                    headerRow.push('#' + LLConst.Skill.getEffectBrief(effects[j]));
                }
                var tableData = [headerRow];
                for (var i in notes) {
                    var curRow = [i + 'N'];
                    for (var j = 0; j < effects.length; j++) {
                        var curEffect = effects[j];
                        if (needCards[curEffect] && needCards[curEffect][i]) {
                            var cardImages = [];
                            var matchedCards = needCards[curEffect][i];
                            for (var k = 0; k < matchedCards.length; k++) {
                                var curCard = matchedCards[k];
                                var avatarComp = new LLAvatarComponent({'smallAvatar': true, 'cardId': curCard.id, 'mezame': true});
                                cardImages.push(avatarComp.element);
                            }
                            curRow.push(cardImages);
                        } else {
                            curRow.push('');
                        }
                    }
                    tableData.push(curRow);
                }
                console.log(tableData);
                updateSubElements(container, [LLUnit.createSimpleTable(tableData)], true);
            }).fail(function (e) {
                container.innerHTML = '加载失败';
                console.error(e);
            });
            return container;
        },
        '_element': function (context, params) {
            return params[0];
        }
    };
    var renderer = {
        'render': function (context) {
            // return [elements]
            var parsed_data = context.parsedData;
            var ret = [];
            for (context.currentLineIndex = 0; context.currentLineIndex < parsed_data.length; context.currentLineIndex++) {
                ret.push(context.renderer.renderLine(context));
            }
            return ret;
        },
        'renderLine': function (context) {
            // return element
            var line_data = context.parsedData[context.currentLineIndex];
            if (line_data.headLevel) {
                return createElement('h' + (line_data.headLevel + 1), line_data.htmlAttributes, context.renderer.renderContents(context, line_data.contents));
            } else if (line_data.isUList || line_data.isOList) {
                return context.renderer.renderList(context);
            } else if (line_data.contents) {
                return createElement('div', line_data.htmlAttributes, context.renderer.renderContents(context, line_data.contents));
            } else {
                return createElement('br');
            }
        },
        'renderContents': function (context, contents) {
            // return elements
            if (!contents) return [''];
            var i;
            var ret = [];
            for (i = 0; i < contents.length; i++) {
                var curContent = contents[i];
                if (curContent.type == 'text') {
                    ret.push(curContent.text);
                } else if (curContent.type == 'bold') {
                    ret.push(createElement('b', undefined, [curContent.text]));
                } else if (curContent.type == 'code') {
                    ret.push(createElement('span', { 'className': 'll_code' }, [curContent.text]));
                } else if (curContent.type == 'func') {
                    if (md_func[curContent.funcName]) {
                        var func_ret = md_func[curContent.funcName](context, curContent.params);
                        if (!func_ret) continue;
                        if (func_ret.length) {
                            ret = ret.concat(func_ret);
                        } else {
                            ret.push(func_ret);
                        }
                    } else {
                        ret.push(createElement('span', { 'style': { 'color': 'red' } }, ['unknown func: ' + curContent.funcName]));
                    }
                } else if (curContent.type == 'url') {
                    ret.push(createElement('a', { 'href': curContent.url }, [curContent.text]));
                } else {
                    ret.push(createElement('span', { 'style': { 'color': 'red' } }, ['unknown type: ' + curContent.type]));
                }
            }
            return ret;
        },
        'renderList': function (context) {
            // return element
            var line_data = context.parsedData[context.currentLineIndex];
            var isUList = (line_data.isUList ? true : false);
            var tag = (isUList ? 'ul' : 'ol');
            var listItems = [];
            var indent = line_data.indent;
            listItems.push(createElement('li', line_data.htmlAttributes, context.renderer.renderContents(context, line_data.contents)));
            for (context.currentLineIndex++; context.currentLineIndex < context.parsedData.length; context.currentLineIndex++) {
                line_data = context.parsedData[context.currentLineIndex];
                if (line_data.headLevel || !line_data.contents) break;
                if (line_data.isUList || line_data.isOList) {
                    if (line_data.indent == indent) {
                        // in same list
                        listItems.push(createElement('li', line_data.htmlAttributes, context.renderer.renderContents(context, line_data.contents)));
                    } else if (line_data.indent > indent) {
                        // sub list
                        listItems.push(context.renderer.renderList(context));
                    } else {
                        // end list
                        break;
                    }
                } else {
                    listItems.push(createElement('div', line_data.htmlAttributes, context.renderer.renderContents(context, line_data.contents)));
                }
            }
            context.currentLineIndex--;
            return createElement(tag, undefined, listItems);
        }
    };
    function init() {
        var doc_raw = LLUnit.getElement('doc_raw');
        var doc_content = LLUnit.getElement('doc_content');
        var parsed_data = md_parser.parse(doc_raw.innerHTML);
        // hide title of md, as it is already set on the page
        parsed_data.shift();
        // create context and render
        var context = {
            'parsedData': parsed_data,
            'renderer': renderer
        };
        updateSubElements(doc_content, context.renderer.render(context), true);
    }

    LLDepends.whenAll(loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );
    
}
