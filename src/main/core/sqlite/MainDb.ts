import Sqlite from '@/main/core/sqlite/sqlite'
import { app } from 'electron'
import * as path from 'path'
import logger from '../Logger'
import ipcManage from '../IpcManage'
import dayjs from 'dayjs'
import HistoryDb from './HistoryDb'

interface TableName {
  name: string
}

// interface WorkStart {
//   projectId: number
//   masterIds: string
//   slaverIds: string
//   channelIds: string
//   filePath: string
// }

class MainDb {
  sqlite: Sqlite
  tables = {
    channelStatus: 'channel_status',
    channelHistory: 'channel_history'
  }
  projectId = 0

  constructor() {
    const basePath = app.getPath('userData')
    this.sqlite = new Sqlite(path.resolve(basePath, './main.db'))
  }

  async connect() {
    try {
      await this.sqlite.connect()
      const data = await this.sqlite.all<TableName[]>(
        `SELECT name FROM sqlite_master`
      )
      await this.createTable(data)
    } catch (err) {
      ipcManage.ipcNotify({
        type: 'error',
        message: `mainDB Error:${err.message}`
      })
      logger.error('mainDB Error', err)
    }
  }

  async getProjectId() {}

  async createTable(tables: TableName[]) {
    let sql = ''
    const tableName = tables.map(item => item.name)

    const { channelStatus, channelHistory, startHistory } = this.tables

    // 通道状态记录
    if (!tableName.includes(channelStatus)) {
      sql += `CREATE TABLE "${channelStatus}" (
        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" integer NOT NULL,
        "slaverId" integer NOT NULL,
        "channelId" integer NOT NULL,
        "workStartTime" integer DEFAULT NULL,
        "workFilePath" TEXT,
        "sampU" integer,
        "sampI" real,
        "sampTime" integer
      );
      CREATE INDEX "channel_index"
      ON "${channelStatus}" (
        "masterId",
        "slaverId",
        "channelId"
      );`
    }

    // 通道启动历史
    if (!tableName.includes(channelHistory)) {
      sql += `CREATE TABLE "${channelHistory}" (
        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        "startId" integer NOT NULL,
        "startTime" integer NOT NULL,
        "endTime" integer DEFAULT NULL,
        "masterIds" text NOT NULL,
        "slaverIds" text NOT NULL,
        "channelIds" text NOT NULL,
        "filePath" text NOT NULL,
        "projectId" integer NOT NULL
      );
      CREATE INDEX "project_id" ON "${channelStatus}" ("projectId");
      CREATE INDEX "start_time" ON "${channelStatus}" ("startTime");
      `
    } else {
      await this.getProjectId()
    }

    // // 工程id启动历史
    // if (!tableName.includes(startHistory)) {
    //   sql += `CREATE TABLE "${startHistory}" (
    //     "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    //     "projectId" integer NOT NULL,
    //     "filePath" text NOT NULL
    //   );`
    // }

    if (sql) {
      await this.sqlite.exec(sql)
    }
  }

  async getWorkFile(projectId: number) {
    const { channelHistory } = this.tables
    await this.sqlite.get(
      `SELECT filePath FROM ${channelHistory} WHERE projectId=${projectId} AND startTime DESC LIMT 1`
    )
  }

  async initChannelData() {
    const { channelStatus, channelHistory } = this.tables
    const statusList = await this.sqlite.all(`SELECT * FROM ${channelStatus}`)
    const projectId = await this.sqlite.get(
      `SELECT projectId FROM ${channelHistory} WHERE startTime DESC LIMT 1`
    )
  }

  async workStart(params: ipcReq.WriteSteps) {
    const { channelHistory } = this.tables
    const { masterIds, slaverIds, channelIds, filePath } = params
    const now = dayjs()
    const startTime = now.valueOf()
    const fileId = now.format('YYYYMMDDHHmmssSSS')
    await this.sqlite.run(
      `INSERT INTO ${channelHistory} (startId, startTime, masterIds, slaverIds, channelIds, filePath, projectId)
      VALUES (
        ${fileId},
        ${startTime},
        "${masterIds.join(',')}",
        "${slaverIds.join(',')}",
        "${channelIds}",
        "${filePath}",
        ${0}
      );`
    )
    const historyDb = new HistoryDb(fileId, filePath)
    await historyDb.created(params)
    const maxId = `MAX(id)`
    const data = await this.sqlite.get(
      `SELECT ${maxId} FROM ${channelHistory};`
    )
    logger.info(maxId)
    return data[maxId]

    // const historyLen = await this.sqlite.get<number>(
    //   `SELECT count(*) FROM ${startHistory};`
    // )
    // const maxLen = 10
    // let sql = ''

    // // 更新工程id
    // if (historyLen > maxLen) {
    //   const hId = projectId % maxLen || maxLen
    //   sql += `UPDATE ${startHistory} SET projectId=${projectId}, filePath=${filePath} WHERE id=${hId};` // eslint-disable-line
    // } else {
    //   sql += `INSERT INTO ${startHistory} (projectId,filePath) VALUES (${projectId}, ${filePath});`
    // }

    // this.sqlite.exec(sql)
  }
}

const mainDb = new MainDb()
export default mainDb
