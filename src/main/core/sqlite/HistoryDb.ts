import Sqlite from './sqlite'
import path from 'path'
import dayjs from 'dayjs'
import logger from '../Logger'

interface TableName {
  name: string
}

export default class HistoryDb {
  sqlite: Sqlite
  tables = {
    stepsInfo: 'steps_info',
    channelInfo: 'channel_info',
    sampData: 'samp_data'
  }

  constructor(fileId: string, filePath: string) {
    this.sqlite = new Sqlite(path.resolve(filePath, `${fileId}.db`))
  }

  async connect() {
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
        "stepList" TEXT NOT NULL,
        "protect" TEXT NOT NULL,
        "dataSave" TEXT NOT NULL,
        "startId" INTEGER NOT NULL,
        "createTime" INTEGER NOT NULL
      );`
    }

    // 通道信息
    if (!tableName.includes(channelInfo)) {
      sql += `CREATE TABLE "${channelInfo}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" INTEGER NOT NULL,
        "channelId" INTEGER NOT NULL,
        "slaverId" INTEGER NOT NULL,
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

    if (!tableName.includes(sampData)) {
      sql += `CREATE TABLE "${sampData}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" INTEGER NOT NULL,
        "slaverId" INTEGER NOT NULL,
        "U" INTEGER NOT NULL,
        "I" REAL NOT NULL,
        "workCode" TEXT NOT NULL,
        "errorCode" TEXT NOT NULL,
        "endCode" TEXT NOT NULL,
        "stepId" INTEGER NOT NULL,
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

  setJson(data: any) {
    return JSON.stringify(data).replace(/"/g, '`')
  }

  async created({ stepsList, protect, dataSave, startId }: ipcReq.WriteSteps) {
    if (!this.sqlite.isConnect) {
      await this.connect()
    }
    const { stepsInfo } = this.tables
    let sql = ''
    const now = dayjs().valueOf()
    // \`${JSON.stringify(stepsList)}\`,
    //   \`${JSON.stringify(protect)}\`,
    //   \`${JSON.stringify(dataSave)}\`,
    sql += `INSERT INTO ${stepsInfo} (stepList, protect, dataSave, startId, createTime)
    VALUES (
      '${JSON.stringify(stepsList)}',
      '${JSON.stringify(protect)}',
      $dataSave,
      ${startId},
      ${now}
    )`
    logger.info(sql)
    await this.sqlite.run(sql, {
      // $stepsList: JSON.stringify(stepsList),
      // $protect: JSON.stringify(protect),
      $dataSave: JSON.stringify(dataSave)
    })
    // await this.sqlite.exec(sql)
  }
}
