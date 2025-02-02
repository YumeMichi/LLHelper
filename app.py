# -*- coding: utf-8 -*-
from flask import Flask, render_template, request
import json
import sys
from lldata import LLData, LLDataMix

if sys.version[0] == '2':
    reload(sys)
    sys.setdefaultencoding('utf-8')

app = Flask(__name__)
app.secret_key = "hatsune miku"

# file check interval: 60 seconds (only check when a request comes in and have not checked for 1 minute)
# auto reload the data during file check when file last modify time is changed
g_llcarddata = LLData('llnewcardsdata.json', 60)
g_llsongdata = LLData('newsongsjson.json', 60)
# snapshot for older card data, should have much less chance to update
g_llcarddata_cn = LLData('newcardsjson-20181021.json', 3600)
g_llcarddata_mix = LLDataMix([g_llcarddata_cn, g_llcarddata], 'cn-mix', 60)
# metadata
g_llmetadata = LLData('metadata.json', 60)
# sisdata
g_llsisdata = LLData('sisdata.json', 60)
# accessorydata
g_llaccessorydata = LLData('accessorydata.json', 60)

def loadJsonFile(jsonFile):
    print('Loading %s ...' % jsonFile)
    with open(jsonFile, 'rb') as f:
        return json.load(f)

g_site_config = loadJsonFile('site-config.json')
if 'version' in g_site_config:
    app.config['SITE_VERSION'] = g_site_config['version']
else:
    app.config['SITE_VERSION'] = '0'
if 'page_version' in g_site_config:
    app.config['PAGE_VERSION'] = g_site_config['page_version']
print('Site version: %s' % app.config['SITE_VERSION'])

### activity ###
@app.route("/activitypt")
def activitypt():
       return render_template("activitypt.html")

@app.route("/llactivity", methods=['GET', 'POST'])
def llactivity():
    return render_template('llactivity.html')

@app.route("/llrally", methods=['GET', 'POST'])
def llrally():
    return render_template('llrally.html')

@app.route("/smmulti")
def smmulti():
       return render_template("smmulti.html")

@app.route("/llsm", methods=['GET', 'POST'])
def llsm():
    return render_template('llscorematch.html')

@app.route("/llmf", methods=['GET', 'POST'])
def llmf():
    return render_template('llmedleyfestival.html')

@app.route("/llcf", methods=['GET', 'POST'])
def llcf():
    return render_template('llchallengefestival.html')

@app.route("/llnm", methods=['GET', 'POST'])
def llnm():
    return render_template('llnakayoshi.html')

@app.route("/mfpt", methods=['GET', 'POST'])
def mfpt():
    return render_template('mfpt.html')

@app.route("/cfpt", methods=['GET', 'POST'])
def cfpt():
    return render_template('cfpt.html')

@app.route("/nmpt", methods=['GET', 'POST'])
def nmpt():
    return render_template('nmpt.html')

### data ###
@app.route("/llsongdata")
def llsongdata():
    return render_template('llsongdata.html')

@app.route("/llcoverage")
def llcoverage():
    return render_template('llcoverage.html')

@app.route("/llnewcarddata")
def llnewcarddata():
    return render_template('llnewcarddata.html')

@app.route("/llurcardrank")
def llurcardrank():
    if sys.version[0] == '2':
        cardsjson = open('llnewcardsdata.json', 'rb').read()
    else:
        cardsjson = open('llnewcardsdata.json', 'r', encoding='utf-8').read()
    return render_template('llurcardrank.html', cardsjson = cardsjson)

@app.route('/llnewsisdata')
def llnewsisdata():
    return render_template('llnewsisdata.html')

@app.route('/llnewaccessorydata')
def llnewaccessorydata():
    return render_template('llnewaccessorydata.html')

@app.route("/lldata/cardbrief", methods=['GET'])
def lldata_cardbrief():
    if request.args['version'] == 'cn':
        return json.dumps(g_llcarddata_cn.queryByKeys(request.args['keys']))
    elif request.args['version'] == 'mix':
        return json.dumps(g_llcarddata_mix.queryByKeys(request.args['keys']))
    else:
        return json.dumps(g_llcarddata.queryByKeys(request.args['keys']))

@app.route("/lldata/card/<index>", methods=['GET'])
def lldata_carddetail(index):
    if request.args['version'] == 'cn':
        return json.dumps(g_llcarddata_cn.queryByIndex(index))
    elif request.args['version'] == 'mix':
        return json.dumps(g_llcarddata_mix.queryByIndex(index))
    else:
        return json.dumps(g_llcarddata.queryByIndex(index))

@app.route("/lldata/songbrief", methods=['GET'])
def lldata_songbrief():
    return json.dumps(g_llsongdata.queryByKeys(request.args['keys']))

@app.route("/lldata/song/<index>", methods=['GET'])
def lldata_songdetail(index):
    return json.dumps(g_llsongdata.queryByIndex(index))

@app.route("/lldata/metadata", methods=['GET'])
def lldata_metadata():
    return json.dumps(g_llmetadata.queryByIndexes(request.args['keys']))

@app.route("/lldata/sisbrief", methods=['GET'])
def lldata_sisdata():
    return json.dumps(g_llsisdata.queryByKeys(request.args['keys']))

@app.route("/lldata/sis/<index>", methods=['GET'])
def lldata_sisdetail(index):
    return json.dumps(g_llsisdata.queryByIndex(index))

@app.route("/lldata/accessorybrief", methods=['GET'])
def lldata_accessorydata():
    return json.dumps(g_llaccessorydata.queryByKeys(request.args['keys']))

@app.route("/lldata/accessory/<index>", methods=['GET'])
def lldata_accessorydetail(index):
    return json.dumps(g_llaccessorydata.queryByIndex(index))

### data api ###
@app.route("/llcardapiwiki")
def llcardapi():
       return open("cardsjson.txt").read()

@app.route("/llmapapiwiki")
def llmapapi():
       return open("songsjson.txt").read()

### documents ###

def render_document(md_file, doc_title):
    if sys.version[0] == '2':
        md_content = open(md_file, 'rb').read()
    else:
        md_content = open(md_file, 'r', encoding='utf-8').read()
    return render_template('docs.html', md_content = md_content, doc_title = doc_title)

@app.route("/document/score_calculation.md", methods=['GET'])
def document_score_calculation():
    return render_document('docs/score_calculation.md', '得分计算概述')

@app.route("/document/repeat_team.md", methods=['GET'])
def document_repeat_team():
    return render_document('docs/repeat_team.md', '复读机队伍选择')

### pools ###
@app.route("/llcardpool", methods=['GET'])
def llcardpool():
    return render_template('llcardpool.html')

### species ###
@app.route("/llspecies", methods=['GET', 'POST'])
@app.route("/llurrank", methods=['GET', 'POST'])
def urrank():
    return render_template("llurrank.html")

### level up ###
@app.route("/lllvlup", methods=['GET', 'POST'])
def lllvlup():
    return render_template("lllvlup.html")

### mainpage ###
@app.route("/", methods=['GET', 'POST'])
def hello():
    return render_template('mainpage.html')

@app.route("/about")
def about():
    return render_template('about.html')

@app.route("/releasenotes")
def releasenotes():
    return render_template('releasenotes.html')

from llunit import *
from lldatamodify import *

def development_test():
    return render_template('test.html')

# require Flask >= v1.0
if app.debug == True:
    app.add_url_rule('/test', 'development_test', development_test)

if __name__ == "__main__":
    import os
    if os.environ['LLHELPER_RUN_PORT']:
        app.run(port=int(os.environ['LLHELPER_RUN_PORT']))
    else:
        app.run()
