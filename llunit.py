from app import *
from flask import make_response, Request
import json

def unescapeJsonStr(json_str):
    # TODO: prevent xss
    if not isinstance(json_str, str):
        json_str = str(json_str, encoding='utf-8')
    return json_str.replace('%7B', '{').replace('%22', '"').replace('%7D', '}').replace('%5B', '[').replace('%5D', ']')

@app.route("/llsaveunit/<content>", methods=['GET', 'POST'])
def llunitsave(content):
    '''
    int_element = ["smile", "pure", "cool", "kizuna", "skill", "require", "possibility"]
    float_element = ["score"]
    for i in range(0, 9):
        for key in int_element:
            member[i][key] = int(request.form.get(key+str(i)))
        for key in float_element:
            member[i][key] = float(request.form.get(key+str(i)))
        member[i]["main"] = request.form.get("main"+str(i))
    '''
    response = make_response(content)
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Content-Disposition'] = 'attachment; filename=unit.sd'
    return response

@app.route("/llsavesis/<content>", methods=['GET', 'POST'])
def llsavesis(content):
    response = make_response(content)
    response.headers['Content-Type']='application/octet-stream'
    response.headers['Content-Disposition']='attachment; filename=idolskills.sd'
    return response

@app.route("/llsavesubmembers/<content>", methods=['GET', 'POST'])
def llsubmemberssave(content):
    response = make_response(content)
    response.headers['Content-Type']='application/octet-stream'
    response.headers['Content-Disposition']='attachment; filename=submembers.sd'
    return response

@app.route("/llsaveallmembers/<content>", methods=['GET', 'POST'])
def llsaveallmembers(content):
    response = make_response(content)
    response.headers['Content-Type']='application/octet-stream'
    response.headers['Content-Disposition']='attachment; filename=submembers.sd'
    return response

@app.route("/llload/<callback>", methods=['GET', 'POST'])
def llload(callback):
    print(request.files, callback)
    for f in request.files['file']:
        return '<script>' + callback + '(' + unescapeJsonStr(f) + ');</script>'

@app.route("/llloadex/<formid>/<callback>", methods=['POST'])
def llloadex(formid, callback):
    print(request.files, formid, callback)
    for f in request.files[formid]:
        return '<script>' + callback + '(' + unescapeJsonStr(f) + ');</script>'

def handleLoadUnit(request):
    # type: (Request) -> str
    argv = request.args.get("unit")
    addon = ""
    if argv:
        try:
            # TODO: decouple with page
            addon = "handleLoadUnit(" + unescapeJsonStr(argv) + ");"
        except BaseException:
            pass
    return addon

@app.route("/llnewunit", methods=['GET', 'POST'])
def llnewunit():
    # 'unit' passed by external import link
    return render_template("llnewunit.html", additional_script=handleLoadUnit(request))

@app.route("/llnewunitsis", methods=['GET', 'POST'])
def llnewunitsis():
    # 'unit' passed by pll (LLProxy)
    return render_template("llnewunitsis.html", additional_script=handleLoadUnit(request))

@app.route("/llnewautounit", methods=['GET', 'POST'])
def llnewautounit():
    return render_template("llnewautounit.html")

@app.route("/llnewunitla", methods=['GET', 'POST'])
def llnewunitla():
    return render_template("llnewunitla.html", additional_script=handleLoadUnit(request))
