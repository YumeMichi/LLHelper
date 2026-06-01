LLHelper
========

## How to Use

### Install requirements
```sh
pip install -r requirements.txt
```

### Run on Development Environment

shell:
```sh
FLASK_APP=app.py python3 -m flask run --debug
```
or
```sh
./run.sh
```

powershell:
```ps1
.\run-dev.ps1
```

### Run on Production Environment

shell:
```sh
FLASK_APP=app.py FLASK_RUN_PORT={PORT} python3 -m flask run
```
or
```sh
./run.sh {PORT}
```

### PM2 Script Example

```json
{
    "apps": [{
        "name": "skufes-llhelper",
        "script": "app.py",
        "env": {
            "LLHELPER_RUN_PORT": 8080
        },
        "interpreter": "python3",
        "watch": false,
        "cron_restart": "5 * * * *",
        "cwd": "LLHelper"
    }]
}
```

## Test
* llnewunit, llnewunitsis, llnewautounit, llnewcarddata, llcoverage
  * filter member, select member, put member
  * change skill level
  * calculate, calculate with sis, calculate with submembers
  * refresh after calculate
  * load unit, save unit
  * clear input
  * change language
