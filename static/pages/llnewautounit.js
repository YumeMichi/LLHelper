var mezame = 0;
var kizuna = new Array();
kizuna["N"] = [25, 50]
kizuna["R"] = [100, 200]
kizuna["SR"] = [250, 500]
kizuna["SSR"] = [375, 750]
kizuna["UR"] = [500, 1000]


var data_mapnote = 0;
var comp_skill = 0;
var comp_cardselector = 0;
var comp_songselector = 0;
var comp_gemselector = 0;
var comp_accessory_selector = 0;
var comp_cardavatar = 0;
var comp_gemstock = 0;
var comp_submember = 0;
var comp_swapper = 0;
var comp_distribution_chart = 0;
var comp_distribution_param = 0;
/** @type {LLH.Layout.Team.LLTeamComponent} */
var comp_team = undefined;
var comp_cskill_team = 0;
var comp_cskill_friend = 0;
var comp_result = 0;
var comp_language = 0;

function toMezame(){
    mezame = 1-mezame
    LLUnit.applycarddata();
}

function clearall(){
    setCookie("mezame"+"unit", mezame, -1)
    localStorage.removeItem('llnewautounit_gemstock');
    localStorage.removeItem('llnewautounit_submember');
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageLanguageKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageCardSelectKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageSongSelectKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageLLNewAutoUnitTeamKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageAccessorySelectKey);
    window.location.href="/llnewautounit"
}

function makeSaveData() {
    return new LLSaveData({'version': 104, 'team': comp_team.getMembers(), 'gemstock': comp_gemstock.saveData(), 'submember': comp_submember.saveData()});
}

function handleLoadTeamMember(teamMember) {
    comp_team.setMembers(teamMember);
    precalcu();
}

function handleLoadSubMember(subMember) {
    var requests = [];
    for (var i = 0; i < subMember.length; i++) {
        (function(index){
            // data has: 'cardid','mezame','skilllevel','maxcost'
            var cur = subMember[index];
            if ((!cur.maxcost) || (!cur.main)) {
                requests.push(LLCardData.getDetailedData(cur.cardid).then(function (card) {
                    if (!cur.maxcost) cur.maxcost = card.minslot;
                    if (!cur.main) {
                        var intMezame = parseInt(cur.mezame);
                        cur.main = card.attribute;
                        cur.smile = (intMezame ? card.smile2 : card.smile);
                        cur.pure = (intMezame ? card.pure2 : card.pure);
                        cur.cool = (intMezame ? card.cool2 : card.cool);
                        cur[cur.main] += kizuna[card.rarity][intMezame];
                        cur.hp = (intMezame ? card.hp+1 : card.hp);
                    }
                }));
            }
        })(i);
    }
    LoadingUtil.start(requests).then(function () {
        comp_submember.loadData(subMember);
    }, defaultHandleFailedRequest);
}

function loadSaveData(data, loadTeam, loadGemStock, loadSubMember) {
    var saveData = new LLSaveData(data);
    if (loadTeam) {
        handleLoadTeamMember(saveData.teamMember);
    }
    if (loadGemStock) {
        if (saveData.hasGemStock) {
            comp_gemstock.loadData(saveData.gemStock);
        }
    }
    if (loadSubMember) {
        handleLoadSubMember(saveData.subMember);
    }
}

function savesis(){
    var saveData = makeSaveData();
    var unitjson = saveData.serializeV104(true, false, true);
    window.location.href="/llsavesis/"+unitjson;
}
function saveunit(){
    var saveData = makeSaveData();
    var unitjson = saveData.serializeV104();
    window.location.href="/llsaveunit/"+unitjson;
}
function savesubmembers(){
    var saveData = makeSaveData();
    var submembersjson = saveData.serializeV104(true, true, false);
    window.location.href="/llsavesubmembers/"+submembersjson;
}
function saveallmembers(){
    var saveData = makeSaveData();
    saveData.subMember = saveData.subMember.concat(saveData.teamMember);
    var submembersjson = saveData.serializeV104(true, true, false);
    window.location.href="/llsaveallmembers/"+submembersjson;
}
function handleLoadSis(sis) {
    loadSaveData(sis, 0, 1, 0);
}
function handleLoadUnit(unit) {
    loadSaveData(unit, 1, 1, 0);
}
function handleLoadSubmembersData(data) {
    loadSaveData(data, 0, 0, 1);
}

function loadunit(){
    document.getElementById("unitform").action = '/llload/parent.handleLoadUnit'
    document.getElementById("unitform").target = 'if'
}
function precalcu(){
    document.getElementById("unitform").action = ''
    document.getElementById("unitform").target = ''
}
function loadsis(){
    document.getElementById("unitform").action = '/llloadex/filesis/parent.handleLoadSis'
    document.getElementById("unitform").target = 'if'
}
function loadsubmembers(){
    document.getElementById("unitform").action = '/llloadex/filesub/parent.handleLoadSubmembersData'
    document.getElementById("unitform").target = 'if'
}

function saveToCookie(){
    setCookie("mezame"+"unit", mezame, 1)
}
//////////
function addselectsub(){
    var cardid=comp_cardselector.getCardId();
    var subunit={}
    if ((cardid != 0) && (cardid != "") && (cardid != "0")){
        subunit["main"]=document.getElementById("main").value
        subunit["smile"]=parseInt(document.getElementById("smile").value)
        subunit["pure"]=parseInt(document.getElementById("pure").value)
        subunit["cool"]=parseInt(document.getElementById("cool").value)
        subunit[subunit["main"]]+=parseInt(document.getElementById("kizuna").value)
        subunit["skilllevel"]=comp_skill.skillLevel+1;
        subunit["mezame"]=parseInt(mezame)
        subunit["cardid"]=cardid;
        subunit["maxcost"]=comp_cardselector.cards[cardid].minslot;
        subunit.hp = parseInt(document.getElementById("hp").value);
        comp_submember.add(subunit);
    }
}
function autoarm(){
    if(document.getElementById('autoarm0').checked){
        document.getElementById("sisreserves").style.display = '';
    }
    else{
        document.getElementById("sisreserves").style.display = 'none';
    }
}

function fillunit(){
    if (comp_submember.empty()) return;
    var i;
    var emptypos = [];
    for (i = 0; i < 9; i++) {
        if (i == 4) continue;
        var cardid = comp_team.getCardId(i);
        if ((!cardid) || cardid == '0') emptypos.push(i);
    }
    if (emptypos.length == 0) return;
    var submembers = comp_submember.saveData();
    for (i = 0; i < emptypos.length && i < submembers.length; i++) {
        comp_team.setMember(emptypos[i], submembers[i]);
    }
    comp_submember.remove(0, i);
}

function check(){
    if (!comp_songselector.getSelectedSongSetting()) {
        comp_result.showError('请选择谱面');
        return;
    }
    if (!comp_team.isAllMembersPresent()) {
        comp_result.showError('队伍中仍有空位');
        return;
    }
    comp_result.hideError();
    saveToCookie();
    localStorage.setItem('llnewautounit_gemstock', comp_gemstock.saveJson());
    localStorage.setItem('llnewautounit_submember', comp_submember.saveJson());
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageLanguageKey, comp_language.serialize());
    comp_cardselector.saveLocalStorage(LLHelperLocalStorage.localStorageCardSelectKey);
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageSongSelectKey, comp_songselector.saveJson());
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageAccessorySelectKey, comp_accessory_selector.saveJson());
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageDistParamKey, comp_distribution_param.saveJson());
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageLLNewAutoUnitTeamKey, comp_team.saveJson());
    /////////////
    var cardids = comp_team.getCardIds();
    var subMembers = comp_submember.saveData();
    for (var i = 0; i < subMembers.length; i++) {
        cardids.push(subMembers[i].cardid);
    }
    var distParam = comp_distribution_param.saveData();
    if (distParam.type == 'sim') {
        LLUnit.calculate(docalculate, cardids, comp_team.getAccessoryIds(), [data_mapnote.getMapNoteData(comp_songselector.getSelectedSong(), comp_songselector.getSelectedSongSetting())]);
    } else {
        LLUnit.calculate(docalculate, cardids, comp_team.getAccessoryIds());
    }
    return true;
}

function docalculate(cards, accessoryDetails, extraData) {
    var member = comp_team.getMembers();
    var llmembers = [];

    var mainatt = comp_songselector.getSongAttribute();

    for (var i = 0; i < 9; i++) {
        member[i].card = cards[member[i].cardid];
        if (member[i].accessory) {
            member[i].accessoryData = accessoryDetails[member[i].accessory.id];
        }
        llmembers.push(new LLMember(member[i], mainatt));
    }

    var distParam = comp_distribution_param.saveData();
    var llmap = comp_songselector.getMap(comp_team.getWeights());

    var llteam = new LLTeam(llmembers);
    if (distParam.type == 'sim') {
        llmap.setDistParam(distParam);
    }
    var llmapSaveData = llmap.saveData();
    if (document.getElementById('autoarm0').checked){
        // autounit
        var saveData = makeSaveData();
        var subMembers = [];
        for (var i = 0; i < saveData.subMember.length; i++) {
            var member = saveData.subMember[i];
            member.card = cards[member.cardid];
            member.gems = [];
            subMembers.push(new LLMember(member));
        }
        var resultSubMembers = llteam.autoUnit(llmapSaveData, saveData.gemStock, subMembers);
        for (var i = 0; i < 9; i++) {
            comp_team.setMember(i, llteam.members[i].raw);
            comp_team.setMemberGem(i, llteam.members[i].gems);
        }
        comp_submember.loadData(resultSubMembers.map(x => x.raw));
    }
    llteam.calculateAttributeStrength(llmapSaveData);
    llteam.calculateSkillStrength(llmapSaveData);

    comp_team.setStrengthDebuffs(llteam.attrDebuff);

    if (distParam.type != 'no'){
        var t0 = window.performance.now();

        var percentiles = [1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99];
        var err;
        if (distParam.type == 'v1') {
            err = llteam.calculateScoreDistribution();
            if (!err) {
                llteam.calculatePercentileNaive();
            }
        } else if (distParam.type == 'sim') {
            err = llteam.simulateScoreDistribution(llmapSaveData, extraData[0], parseInt(distParam.count));
        } else {
            err = '未知的得分分布';
        }
        if (err) {
            comp_result.showError(err);
        } else {
            comp_result.hideError();
        }
        var t1 = window.performance.now();
        console.debug(llteam);

        console.debug('Elapesd time (ms): ' + (t1 - t0).toFixed(3));
        var calResult = llteam.getResults();
        for (var i in percentiles){
            document.getElementById('simresult'+(100-percentiles[i]).toString()).innerHTML = calResult.naivePercentile[percentiles[i]];
        }
        document.getElementById('maxscoreprobability').innerHTML = '(' + (calResult.probabilityForMaxScore * 100) + ')%';
        document.getElementById('minscoreprobability').innerHTML = '(' + (calResult.probabilityForMinScore * 100) + ')%';
        document.getElementById('simresult0').innerHTML = calResult.maxScore;
        document.getElementById('simresult100').innerHTML = calResult.minScore;
        document.getElementById('distributionresult').style.display = '';
        if (!comp_distribution_chart) {
            comp_distribution_chart = new LLScoreDistributionChart('score_chart', {'series': [calResult.naivePercentile], 'width': '100%', 'height': '400px'});
        } else {
            comp_distribution_chart.addSeries(calResult.naivePercentile);
        }
    } else {
        document.getElementById('distributionresult').style.display = 'none';
        comp_result.hideError();
    }

    comp_team.setResult(llteam);
    comp_result.showResult(llteam);
}

/** @param {LLH.Depends.Promise<void>} loadDeferred */
function renderPage(loadDeferred) {
    LLCardData.briefKeys.push('minslot');

    /**
     * @param {LLH.API.CardDictDataType} cardData
     * @param {LLH.API.SongDictDataType} songData
     * @param {LLH.API.MetaDataType} metaData
     * @param {LLH.API.AccessoryDictDataType} accessoryData
     */
    function init(cardData, songData, metaData, accessoryData) {
        // init components
        LLConst.initMetadata(metaData);
        comp_cskill_team = new LLCSkillComponent('cskill_team');
        comp_cskill_friend = new LLCSkillComponent('cskill_friend', {'editable': true, 'title': '好友主唱技能'});
        comp_songselector = new LLSongSelectorComponent('song_filter', {'songs': songData, 'includeMapInfo': true, 'friendCSkill': comp_cskill_friend});
        data_mapnote = new LLMapNoteData();
        comp_skill = new LLSkillContainer();
        comp_cardselector = new LLCardSelectorComponent('card_filter_container', {'cards': cardData});
        comp_cardselector.onCardChange = LLUnit.applycarddata;
        comp_cardavatar = new LLImageComponent('imageselect');
        comp_distribution_param = new LLScoreDistributionParameter('distribution_param');
        comp_distribution_param.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageDistParamKey));
        comp_accessory_selector = new LLAccessorySelectorComponent('accessory_selector', {
           'accessoryData': accessoryData,
           'cardData': cardData,
           'showLevelSelect': true,
           'excludeMaterial': true
        });

        comp_result = new LLUnitResultComponent('unit_result');
        comp_gemselector = new LLGemSelectorComponent('gem_filter', {'includeNormalGemCategory': true});

        comp_songselector.onSongSettingChange = (songSettingId, songSetting) => songSetting && comp_team.setWeights(songSetting.positionweight);
        comp_songselector.onSongColorChange = (songAttribute) => comp_team.setMapAttribute(songAttribute);

        comp_language = new LLLanguageComponent('language');
        comp_language.registerLanguageChange(comp_songselector);
        comp_language.registerLanguageChange(comp_cardselector);
        comp_language.registerLanguageChange(comp_accessory_selector);

        var comp_dataversion = new LLDataVersionSelectorComponent('card_data_version', LLCardData, function (v) {
            LoadingUtil.startSingle(LLCardData.getAllBriefData().then(function (cards) {
                comp_cardselector.setCardData(cards, true);
            }));
        });
        var comp_savestorage = new LLSaveStorageComponent('unit-storage', {
            'saveData': makeSaveData,
            'loadTeamMember': handleLoadTeamMember,
            'loadGemStock': function(data) { if (comp_gemstock) comp_gemstock.loadData(data); },
            'loadSubMember': handleLoadSubMember
        });
        comp_team = new LLTeamComponent('unit-team', {
            'onPutCardClicked': function(i) {
                var curMain = document.getElementById("main").value;
                var memberData = {
                    'cardid': comp_cardselector.getCardId(),
                    'mezame': (document.getElementById("mezame").checked ? 1 : 0),
                    'hp': parseInt(document.getElementById("hp").value),
                    'smile': parseInt(document.getElementById("smile").value),
                    'pure': parseInt(document.getElementById("pure").value),
                    'cool': parseInt(document.getElementById("cool").value),
                    'skilllevel': parseInt(document.getElementById("skilllevel").innerHTML)
                };
                memberData[curMain] += parseInt(document.getElementById("kizuna").value);
                comp_team.putMember(i, memberData);
            },
            'onPutGemClicked': function (i) {
                return comp_gemselector.getGemId();
            },
            'onCenterChanged': function() {
                LoadingUtil.startSingle(LLCardData.getDetailedData(this.getCardId(4) || 0)).then(function(card) {
                    comp_cskill_team.setCSkill(card);
                }, defaultHandleFailedRequest);
            },
            'onPutAccessoryClicked': function () {
                return comp_accessory_selector.getAccessorySaveData();
            }
        });
        comp_team.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageLLNewAutoUnitTeamKey));

        mezame = getCookie("mezameunit")
        if (mezame == "") mezame = 0; else mezame = parseInt(mezame);
        document.getElementById("mezame").checked = mezame

        comp_gemstock = new LLGemStockComponent('sisreserves');

        var subMembersOperation = new LLComponentBase('submembersoperation');
        comp_submember = new LLSubMemberComponent('submembers');
        comp_swapper = new LLSwapper();
        comp_submember.setSwapper(comp_swapper);
        comp_submember.setOnCountChange(function (count) {
           if (count > 0) subMembersOperation.show();
           else subMembersOperation.hide();
        });
        comp_team.setSwapper(comp_swapper);

        // load
        comp_language.deserialize(parseInt(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageLanguageKey, 0)));
        comp_cardselector.loadLocalStorage(LLHelperLocalStorage.localStorageCardSelectKey);
        comp_songselector.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageSongSelectKey));
        comp_accessory_selector.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageAccessorySelectKey));
        comp_gemstock.loadJson(localStorage.getItem('llnewautounit_gemstock'));
        comp_submember.loadJson(localStorage.getItem('llnewautounit_submember'));
        comp_team.setMapAttribute(comp_songselector.getSongAttribute());

        // done
        document.getElementById('loadingbox').style.display = 'none';
    }

    LLDepends.whenAll(LLCardData.getAllBriefData(), LLSongData.getAllBriefData(), LLMetaData.get(), LLAccessoryData.getAllBriefData(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );
}