import Sqlite from './sqlite'
import path from 'path'
import dayjs from 'dayjs'
import logger from '../Logger'

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

export default class HistoryDb {
  sqlite: Sqlite
  tables = {
    stepsInfo: 'steps_info',
    channelInfo: 'channel_info',
    sampData: 'samp_data'
  }

  constructor(fileId: string, filePath: string) {
    this.sqlite = new Sqlite(path.resolve(filePath, `${fileId}`))
  }

  async connect() {
    if (this.sqlite.isConnect) return
    await this.sqlite.connect()
    const data = await this.sqlite.all<TableName[]>(
      `SELECT name FROM sqlite_master`
    )
    await this.createTable(data)
  }

  async createTable(tables: TableName[]) {
    let sql = ''
    const { stepsInfo, channelInfo, sampData } = this.tables
    const tableName = tables.map(item => item.name)

    // 工步信息
    if (!tableName.includes(stepsInfo)) {
      sql += `CREATE TABLE "${stepsInfo}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "historyId" INTEGER NOT NULL,
        "startId" INTEGER NOT NULL,
        "stepList" TEXT NOT NULL,
        "protect" TEXT NOT NULL,
        "dataSave" TEXT NOT NULL,
        "createTime" INTEGER NOT NULL
      );`
    }

    // 通道信息
    if (!tableName.includes(channelInfo)) {
      sql += `CREATE TABLE "${channelInfo}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" INTEGER NOT NULL,
        "slaverId" INTEGER NOT NULL,
        "channelId" INTEGER NOT NULL,
        "startTime" INTEGER,
        "endTime" INTEGER,
        "createTime" INTEGER NOT NULL
      );
      CREATE INDEX "channel_info_channel_id"
      ON "${channelInfo}" (
        "masterId",
        "slaverId",
        "channelId"
      );`
    }

    // 采样数据
    if (!tableName.includes(sampData)) {
      sql += `CREATE TABLE "${sampData}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" INTEGER NOT NULL,
        "slaverId" INTEGER NOT NULL,
        "channelId" INTEGER NOT NULL,
        "U" INTEGER NOT NULL,
        "I" REAL NOT NULL,
        "stepId" INTEGER NOT NULL,
        "workCode" TEXT NOT NULL,
        "errorCode" TEXT NOT NULL,
        "endCode" TEXT NOT NULL,
        "createTime" INTEGER NOT NULL
      );
      CREATE INDEX "samp_data_channel_id"
      ON "${sampData}" (
        "masterId",
        "slaverId",
        "channelId"
      );`
    }

    if (sql) {
      await this.sqlite.exec(sql)
    }
  }

  /** 创建 */
  async created(
    {
      stepsList,
      protect,
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
    const now = dayjs().valueOf()

    // 写入模板
    const insertTeplSql = `INSERT INTO ${stepsInfo} (historyId, startId, stepList, protect, dataSave, createTime)
    VALUES (
      ${historyId},
      ${startId},
      $stepsList,
      $protect,
      $dataSave,
      ${now}
    );`
    await this.sqlite.run(insertTeplSql, {
      $stepsList: JSON.stringify(stepsList),
      $protect: JSON.stringify(protect),
      $dataSave: JSON.stringify(dataSave)
    })

    // 创建列表
    let insertChannelInfo = `INSERT INTO ${channelInfo} (masterId, slaverId, channelId, createTime) VALUES`
    masterIds.forEach(masterId => {
      slaverIds.forEach(slaverId => {
        channelIds.forEach(channelId => {
          insertChannelInfo += `(${masterId}, ${slaverId}, ${channelId}, ${now}),`
        })
      })
    })
    insertChannelInfo = insertChannelInfo.replace(/,$/, ';')
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
    data.dataSave = JSON.parse(data.dataSave)
    data.stepList = JSON.parse(data.stepList)
    data.protect = JSON.parse(data.protect)
    return data as StepInfoItem
  }

  /** 保存采样 */
  async saveSamp(sampList: Db.sampList) {
    const { sampData } = this.tables
    let insertSql = `INSERT INTO ${sampData} (masterId, slaverId, channelId, U, I, stepId, workCode, errorCode, endCode, createTime) VALUES`
    sampList.forEach(item => {
      insertSql += `(
          ${item.masterId},
          ${item.slaverId},
          ${item.channelId},
          ${item.U},
          ${item.I},
          ${item.workerId},
          '${item.workerCode}',
          '${item.errorCode}',
          '${item.endCode}',
          ${item.createTime}
        ),`
    })
    insertSql = insertSql.replace(/,$/, ';')
    await this.sqlite.run(insertSql)
  }
}
