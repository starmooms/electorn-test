import { app } from 'electron'
import Sqlite from '@/shared/sqlite/index'
import HistoryDbCom from '@/shared/sqlite/HistoryDbCom'
import path from 'path'
import dayjs from 'dayjs'
import logger from '../Logger'
import { TIME_FORMAT } from '@/shared/utils'
import { getFullIdData, getStaticInsert } from '@/shared/sqlite/sqlUtil'
const APP_VERSON = app.getVersion()

interface TableName {
  name: string
}

interface StepInfoItem {
  id: number
  historyId: number
  startId: number
  stepList: []
  protect: Port.Protect
  dataSave: ipcReq.StepsDataSave
  createTime: number
}

type CloseCb = (status?: string) => void

export default class HistoryDb extends HistoryDbCom {
  closeCb: CloseCb | undefined

  constructor(
    fileId: string,
    filePath: string,
    closeCb?: CloseCb,
    checkFile = true
  ) {
    super(path.resolve(filePath, `${fileId}`), checkFile)
    this.closeCb = closeCb
  }

  async connect() {
    if (this.sqlite.isConnect) return null
    const result = await super.connect()
    const data = await this.sqlite.all<TableName[]>(
      `SELECT name FROM sqlite_master`
    )
    await this.createTable(data)
    return result
  }

  async closeDb(status?: string) {
    await this.close()
    if (this.closeCb) {
      this.closeCb(status)
    }
  }

  async createTable(tables: TableName[]) {
    let sql = ''
    const {
      stepsInfo,
      channelInfo,
      sampData,
      stepStatistics,
      systemVersion
    } = this.tables
    const tableName = tables.map(item => item.name)

    // 工步信息
    if (!tableName.includes(stepsInfo)) {
      sql += `CREATE TABLE "${stepsInfo}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "historyId" INTEGER NOT NULL,
        "startId" INTEGER NOT NULL,
        "masterIds" TEXT NOT NULL ,
        "slaverIds" TEXT NOT NULL ,
        "channelIds" TEXT NOT NULL ,
        "stepList" TEXT NOT NULL,
        "protect" TEXT NOT NULL,
        "features" TEXT NOT NULL,
        "dataSave" TEXT NOT NULL,
        "createTime" DATETIME NOT NULL
      );`
    }

    // 通道信息
    if (!tableName.includes(channelInfo)) {
      sql += `CREATE TABLE "${channelInfo}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" INTEGER NOT NULL,
        "slaverId" INTEGER NOT NULL,
        "channelId" INTEGER NOT NULL,
        "fullId" TEXT NOT NULL,
        "startTime" DATETIME,
        "endTime" DATETIME,
        "createTime" DATETIME NOT NULL
      );
      CREATE INDEX "channel_info_channel_full_id" ON "${channelInfo}" ("fullId");
      CREATE INDEX "channel_info_channel_id" ON "${channelInfo}" ("masterId", "slaverId", "channelId");`
    }

    // 采样数据
    if (!tableName.includes(sampData)) {
      sql += `CREATE TABLE "${sampData}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" INTEGER NOT NULL,
        "slaverId" INTEGER NOT NULL,
        "channelId" INTEGER NOT NULL,
        "U" REAL NOT NULL,
        "I" REAL NOT NULL,
        "vol" REAL NOT NULL,
        "epower" REAL NOT NULL,
        "stepTime" REAL NOT NULL,
        "loopNum" INTEGER NOT NULL,
        "stepId" INTEGER NOT NULL,
        "workCode" TEXT NOT NULL,
        "errorCode" TEXT NOT NULL,
        "endCode" TEXT,
        "createTime" DATETIME NOT NULL
      );
      CREATE INDEX "samp_data_channel_id" ON "${sampData}" ("masterId", "slaverId", "channelId");
      CREATE INDEX "samp_data_loopNum" ON "${sampData}" ("loopNum");
      CREATE INDEX "samp_data_stepId" ON "${sampData}" ("stepId");`
    }

    // 采样工步统计表
    if (!tableName.includes(stepStatistics)) {
      sql += `CREATE TABLE "${stepStatistics}" (
        "masterId" INTEGER NOT NULL,
        "slaverId" INTEGER NOT NULL,
        "channelId" INTEGER NOT NULL,
        "fullId" TEXT NOT NULL,
        "stepId" INTEGER NOT NULL,
        "workCode" TEXT,
        "loopNum" INTEGER NOT NULL,
        "stepTime" REAL,
        "startU" REAL,
        "endU" REAL,
        "avgU" REAL,
        "endI" REAL,
        "vol" REAL,
        "epower" REAL,
        "curIRate" REAL,
        "t1" REAL, "c1" REAL,
        "t2" REAL, "c2" REAL,
        "t3" REAL, "c3" REAL,
        "t4" REAL, "c4" REAL,
        "t5" REAL, "c5" REAL,
        "endCode" TEXT,
        "startTime" DATETIME,
        "endTime" DATETIME,
        "createTime" DATETIME,
        PRIMARY KEY ("fullId", "stepId", "loopNum")
      );
      CREATE INDEX "step_statis_fullId" ON "${stepStatistics}" ("fullId");
      CREATE INDEX "step_statis_stepId" ON "${stepStatistics}" ("stepId");
      CREATE INDEX "step_statis_loopNum" ON "${stepStatistics}" ("loopNum");`
    }

    // CREATE UNIQUE INDEX "step_statis_uniqueId" ON "step_statistics" ("fullId", "loopNum", "stepId");

    // 版本号记录
    if (!tableName.includes(systemVersion)) {
      sql += `CREATE TABLE "${systemVersion}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "version" TEXT NOT NULL
      );
      INSERT INTO ${systemVersion} (version) VALUES ('${APP_VERSON}');`
    }

    sql += `PRAGMA synchronous=OFF;` // 关闭同步
    sql += `PRAGMA Journal_Mode=WAL;` // 减少锁定
    sql += `PRAGMA Cache_Size=8000;` // 加大缓存

    if (sql) {
      await this.sqlite.exec(sql)
    }
  }

  /** 创建 */
  async created(
    {
      stepsList,
      protect,
      features,
      dataSave,
      startId,
      masterIds,
      slaverIds,
      channelIds
    }: ipcReq.WriteSteps,
    historyId: number
  ) {
    await this.connect()
    const { stepsInfo, channelInfo } = this.tables
    const now = dayjs().format(TIME_FORMAT)

    // 写入模板
    const insertTeplSql = `INSERT INTO ${stepsInfo} (historyId, startId, masterIds, slaverIds, channelIds, stepList, protect, features, dataSave, createTime)
    VALUES (
      ${historyId},
      ${startId},
      '${masterIds.join(',')}',
      '${slaverIds.join(',')}',
      '${channelIds.join(',')}',
      $stepsList,
      $protect,
      $features,
      $dataSave,
      '${now}'
    );`
    await this.sqlite.run(insertTeplSql, {
      $stepsList: JSON.stringify(stepsList),
      $protect: JSON.stringify(protect),
      $features: JSON.stringify(features),
      $dataSave: JSON.stringify(dataSave)
    })

    // 创建列表
    let insertChannelInfo = `INSERT INTO ${channelInfo} (masterId, slaverId, channelId, fullId, createTime) VALUES`
    masterIds.forEach(masterId => {
      slaverIds.forEach(slaverId => {
        channelIds.forEach(channelId => {
          insertChannelInfo += `(${masterId}, ${slaverId}, ${channelId}, '${masterId}_${slaverId}_${channelId}', '${now}'),`
        })
      })
    })
    insertChannelInfo = Sqlite.replaceSql(insertChannelInfo, ';')
    // 备用方案限制只能同时写入500条 (https://stackoverflow.com/questions/1609637/is-it-possible-to-insert-multiple-rows-at-a-time-in-an-sqlite-database/1734067#)
    // let insertChannelInfo = `INSERT INTO ${channelInfo} (masterId, slaverId, channelId, createTime) SELECT '${masterIds[0]}' AS masterId, '${slaverIds[0]}' AS slaverId, '${channelIds[0]}' AS channelId, '${now}' AS createTime`
    // masterIds.forEach(masterId => {
    //   slaverIds.forEach(slaverId => {
    //     channelIds.forEach(channelId => {
    //       insertChannelInfo += ` UNION ALL SELECT '${masterId}','${slaverId}','${channelId}','${now}'`
    //     })
    //   })
    // })
    // insertChannelInfo += ';'
    await this.sqlite.run(insertChannelInfo)
  }

  /** 打开已有文件, 返回工步信息 */
  async open() {
    await this.connect()
    const { stepsInfo } = this.tables
    const data = await this.sqlite.get(`SELECT * FROM ${stepsInfo}`)
    if (!data) {
      throw new Error('缺少工步文件')
    }
    data.dataSave = JSON.parse(data.dataSave)
    data.stepList = JSON.parse(data.stepList)
    data.protect = JSON.parse(data.protect)
    return data as StepInfoItem
  }

  /** 通道起始状态改变时，分离开始和结束 */
  handleChangeChannel(list: Db.changeStatusList) {
    let startTime: null | string = null
    let endTime: null | string = null
    const startUpdate: string[] = []
    const endUpdate: string[] = []
    list.forEach(item => {
      const fullId = `'${item.masterId}_${item.slaverId}_${item.channelId}'`
      if (item.status === 'RUN') {
        if (!startTime) startTime = item.time
        startUpdate.push(fullId)
      } else if (item.status === 'END') {
        if (!endTime) endTime = item.time
        endUpdate.push(fullId)
      }
    })
    return {
      startTime,
      startUpdate,
      endTime,
      endUpdate
    } as {
      startTime: null | string
      startUpdate: string[]
      endTime: null | string
      endUpdate: string[]
    }
  }

  /** 检查是否可以关闭数据库连接 */
  async checkCanClose() {
    const { channelInfo } = this.tables
    const data = await this.sqlite.get(
      `SELECT id FROM ${channelInfo} WHERE endTime is NULL LIMIT 1;`
    )
    logger.info('有关闭状态', data)
    if (!data) {
      await this.closeDb('isEnd')
    }
  }

  /** 生成 统计表保存开始列表sql */
  saveStart(list: Db.startList) {
    let sql = ''
    if (list.length > 0) {
      const { stepStatistics } = this.tables
      const getUpdateSql = getStaticInsert(stepStatistics)
      list.forEach(item => {
        getUpdateSql.insert({
          ...getFullIdData(item),
          loopNum: item.loopNum,
          stepId: item.stepId,
          workCode: `'${item.workerCode}'`,
          startU: item.U,
          startTime: `'${item.createTime}'`,
          createTime: `'${item.createTime}'`
        })
      })
      // sql += `INSERT INTO ${stepStatistics} (masterId, slaverId, channelId, fullId, stepId, workCode, loopNum, startU, startTime, createTime) VALUES`
      // list.forEach(item => {
      //   const fullId = `${item.masterId}_${item.slaverId}_${item.channelId}`
      //   sql += `(${item.masterId}, ${item.slaverId}, ${item.channelId}, '${fullId}', ${item.stepId}, '${item.workerCode}', ${item.loopNum}, ${item.U}, '${now}', '${now}'),`
      // })
      // sql = Sqlite.replaceSql(sql, ';')
      sql = getUpdateSql.getSql()
    }

    return sql
  }

  /** 生成 统计表保存结束列表sql */
  saveEnd(list: Db.endList) {
    let sql = ''
    if (list.length > 0) {
      const { stepStatistics } = this.tables
      const getUpdateSql = getStaticInsert(stepStatistics)
      list.forEach(item => {
        const fullIdata = getFullIdData(item)
        getUpdateSql.insert({
          ...fullIdata,
          loopNum: item.loopNum,
          stepId: item.stepId,
          stepTime: item.stepTime,
          endU: item.U,
          endI: item.I,
          vol: item.vol,
          epower: item.epower,
          endCode: `'${item.endCode}'`,
          endTime: `'${item.createTime}'`,
          avgU: `(SELECT ROUND(AVG(U),2) FROM 'samp_data' WHERE masterId=${item.masterId} AND slaverID=${item.slaverId} AND channelId=${item.channelId} AND loopNum=${item.loopNum} AND stepId=${item.stepId})`
        })
        // sql += `UPDATE ${stepStatistics} avgU=(
        //   SELECT ROUND(AVG(U),2) FROM WHERE loopNum=${item.loopNum} AND stepId=${item.stepId} AND masterId=${fullIdata.masterId} AND slaverId=${fullIdata.slaverId} AND channelId=${fullIdata.channelId}
        // )
        // WHERE fullId='${fullIdata.fullId}' AND loopNum=${item.loopNum} AND stepId=${item.stepId};`
        // sql += `UPDATE ${stepStatistics} SET stepTime=${item.stepTime}, endU=${item.U}, endI=${item.I}, vol=${item.vol}, epower=${item.epower}, endCode='${item.endCode}', endTime='${now}'
        // WHERE fullId='${item.masterId}_${item.slaverId}_${item.channelId}' AND workCode='${item.workerCode}' AND loopNum=${item.loopNum};`
      })
      sql = getUpdateSql.getSql()
    }
    return sql
  }

  /** 生成 统计表保存特征列表sql */
  saveFeature(list: Db.featureList) {
    let sql = ''
    if (list.length > 0) {
      const { stepStatistics } = this.tables
      const typeMap = new Map<number, any>()
      const getType = (type: number) => {
        let typeItem = typeMap.get(type)
        if (!typeItem) {
          typeItem = {
            getUpdateSql: getStaticInsert(stepStatistics),
            tKey: `t${type}`,
            cKey: `c${type}`
          }
          typeMap.set(type, typeItem)
        }
        return typeItem
      }
      list.forEach(item => {
        const typeItem = getType(item.featureType)
        typeItem.getUpdateSql.insert({
          ...getFullIdData(item),
          loopNum: item.loopNum,
          stepId: item.stepId,
          [typeItem.cKey]: item.vol,
          [typeItem.tKey]: item.stepTime
        })
        // sql += `INSERT INTO ${stepStatistics} ${updateSql};`
        // sql += `UPDATE ${stepStatistics} SET t${item.featureType}=${item.stepTime}, c${item.featureType}=${item.vol}
        // WHERE fullId='${item.masterId}_${item.slaverId}_${item.channelId}' AND workCode='${item.workerCode}' AND loopNum=${item.loopNum};`
      })
      typeMap.forEach(typeItem => {
        sql += typeItem.getUpdateSql.getSql()
      })
    }
    return sql
  }

  /** 保存采样 */
  async saveSamp({
    sampList,
    startList,
    endList,
    featureList,
    specialList,
    changeStatusList
  }: Port.SaveSampItem) {
    let sql = ''
    try {
      const { sampData, channelInfo } = this.tables
      let hasEnd = false
      const saveSampList = [
        ...startList,
        ...featureList,
        ...specialList,
        ...endList,
        ...sampList
      ]

      // 添加采样记录
      if (saveSampList.length > 0) {
        sql += `INSERT INTO ${sampData} (masterId, slaverId, channelId, U, I, vol, epower, stepTime, loopNum, stepId, workCode, errorCode, endCode, createTime) VALUES`
        saveSampList.forEach(item => {
          sql += `(${item.masterId}, ${item.slaverId}, ${item.channelId}, ${item.U}, ${item.I}, ${item.vol}, ${item.epower}, ${item.stepTime}, ${item.loopNum}, ${item.stepId}, '${item.workerCode}', '${item.errorCode}', '${item.endCode}', '${item.createTime}'),`
        })
        sql = Sqlite.replaceSql(sql, ';')
      }

      sql += this.saveStart(startList)
      sql += this.saveFeature(featureList)
      sql += this.saveEnd(endList)

      // // 添加结束状态
      // if (endStatusList.length > 0) {
      //   endStatusList.forEach(item => {
      //     sql += `UPDATE ${sampData}
      //     SET endCode='${item.endCode}'
      //     WHERE id IN (SELECT id from ${sampData} WHERE masterId=${item.masterId} AND slaverId=${item.slaverId} AND channelId=${item.channelId} AND stepId=${item.stepId} ORDER BY id DESC LIMIT 1);`
      //   })
      // }

      // 记录通道起始状态
      if (changeStatusList.length > 0) {
        const {
          startTime,
          endTime,
          startUpdate,
          endUpdate
        } = this.handleChangeChannel(changeStatusList)
        if (startTime) {
          sql += `UPDATE ${channelInfo} SET startTime='${startTime}' WHERE fullId IN (${startUpdate.join(',')}) AND startTime is NULL;` // eslint-disable-line
        }
        if (endTime) {
          hasEnd = true
          sql += `UPDATE ${channelInfo} SET endTime='${endTime}' WHERE fullId IN (${endUpdate.join(',')}) AND endTime is NULL;` // eslint-disable-line
        }
      }

      if (sql) {
        await this.sqlite.exec(sql) // exec 连续执行语句，中间错误后中断
      }
      if (hasEnd) {
        await this.checkCanClose()
      }
    } catch (err) {
      logger.error(sql)
      throw err
    }
  }

  // async saveChannelStatus(channelStatus: any[]) {
  //   const { channelInfo } = this.tables
  //   let updateSql = `UPDATE ${channelInfo} SET startTime=`
  // }
}
