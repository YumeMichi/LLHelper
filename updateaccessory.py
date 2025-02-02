# -*- coding: utf-8 -*-
import argparse
from lib.JsonUtil import JsonFile
from lib.PrintLogger import PrintLogger
from lib.DbUtil import connectUnitDb, queryTableCols, queryTableColsEx
from lib.Translator import Translator

def parseArgs():
    parser = argparse.ArgumentParser('Update accessorydata')
    parser.add_argument('-d', action='store_true', help='dump strings that need translate', dest='dump_missing')
    return parser.parse_args()

def main():
    args = parseArgs()
    logger = PrintLogger()
    jsonFile = JsonFile('accessorydata.json', logger)
    translator = Translator('translate-cn.properties')
    logger.info('Updating accessory data: %s' % jsonFile)

    accessoryData = jsonFile.load()
    unitConn = connectUnitDb()
    accessoryCountInData = len(accessoryData)
    accessoryCountInDb = 0
    accessoryCountNew = 0

    accessoryTableCols = [
        'accessory_id', 'name', 'rarity', 'smile_max', 'pure_max',
        'cool_max', 'is_material', 'effect_type', 'default_max_level', 'max_level',
        'accessory_asset_id', 'trigger_type', 'trigger_effect_type'
    ]
    for accessoryRow in queryTableCols(unitConn, 'accessory_m', accessoryTableCols):
        accessoryCountInDb += 1

        accessoryId = str(accessoryRow[0])
        accessoryName = accessoryRow[1]
        curItem = None
        if accessoryId not in accessoryData:
            logger.info('New accessory %s: %s' % (accessoryId, accessoryName))
            curItem = {'id': accessoryId}
            accessoryCountNew += 1
            accessoryData[accessoryId] = curItem
        else:
            curItem = accessoryData[accessoryId]
        
        curItem['jpname'] = accessoryName
        cnname = translator.translate(accessoryName)
        if cnname is not None:
            curItem['cnname'] = cnname
        curItem['rarity'] = accessoryRow[2]
        if not accessoryRow[3]:
            curItem['smile'] = 0
        else:
            curItem['smile'] = accessoryRow[3]
        if not accessoryRow[4]:
            curItem['pure'] = 0
        else:
            curItem['pure'] = accessoryRow[4]
        if not accessoryRow[5]:
            curItem['cool'] = 0
        else:
            curItem['cool'] = accessoryRow[5]
        curItem['is_material'] = accessoryRow[6]
        curItem['effect_type'] = accessoryRow[7]
        curItem['default_max_level'] = accessoryRow[8]
        curItem['max_level'] = accessoryRow[9]
        if accessoryRow[11]:
            curItem['trigger_type'] = accessoryRow[11]
        if accessoryRow[12]:
            curItem['trigger_effect_type'] = accessoryRow[12]
        
        assetId = accessoryRow[10]
        iconAsset = unitConn.execute('SELECT accessory_asset_m.icon_asset FROM accessory_asset_m WHERE accessory_asset_m.accessory_asset_id = %s;' % assetId).fetchall()
        if len(iconAsset) > 0:
            curItem['icon_asset'] = iconAsset[0][0]

        effectTargets = queryTableColsEx(unitConn, 'accessory_effect_target_m', ['effect_target'], 'WHERE accessory_effect_target_m.accessory_id = %s' % accessoryId).fetchall()
        if len(effectTargets) > 0:
            curItem['effect_target'] = list(map(lambda x: x[0], effectTargets))

    accessoryLevelCols = [
        'accessory_id', 'level', 'effect_value', 'discharge_time', 'activation_rate',
        'smile_diff', 'pure_diff', 'cool_diff', 'trigger_value'
    ]
    for accessoryRow in queryTableColsEx(unitConn, 'accessory_level_m', accessoryLevelCols, 'ORDER BY accessory_level_m.accessory_id, accessory_level_m.level ASC'):
        accessoryId = str(accessoryRow[0])
        if accessoryId in accessoryData:
            curItem = accessoryData[accessoryId]
            if 'levels' not in curItem:
                curItem['levels'] = list()
            levels = curItem['levels'] # type: list
            rowLevel = accessoryRow[1]
            levelIndex = rowLevel - 1
            while levelIndex >= len(levels):
                levels.append({})
            curLevel = levels[levelIndex]
            curLevel['level'] = rowLevel
            curLevel['effect_value'] = accessoryRow[2]
            curLevel['time'] = accessoryRow[3]
            curLevel['rate'] = accessoryRow[4]
            if accessoryRow[8]:
                curLevel['trigger_value'] = accessoryRow[8]
            rowSmile = accessoryRow[5]
            rowPure = accessoryRow[6]
            rowCool = accessoryRow[7]
            if rowSmile > 0:
                curLevel['smile'] = curItem['smile'] - rowSmile
            if rowPure > 0:
                curLevel['pure'] = curItem['pure'] - rowPure
            if rowCool > 0:
                curLevel['cool'] = curItem['cool'] - rowCool

    for accessoryRow in unitConn.execute('''SELECT accessory_special_m.accessory_id, unit_m.unit_number \
        FROM accessory_special_m \
        LEFT JOIN unit_m ON accessory_special_m.unit_id = unit_m.unit_id;'''):
        accessoryId = str(accessoryRow[0])
        if accessoryId in accessoryData:
            curItem = accessoryData[accessoryId]
            curItem['unit_id'] = str(accessoryRow[1])

    unitConn.close()
    jsonFile.save(accessoryData)

    logger.info('Updated %s: accessory count = %s (old %s, new %s, db %s)' % (jsonFile, len(accessoryData), accessoryCountInData, accessoryCountNew, accessoryCountInDb))

    if args.dump_missing:
        missing_file = 'translate-missing.properties'
        translator.exportMissing(missing_file)
        logger.info('Updated %s' % missing_file)


if __name__ == '__main__':
    main()
