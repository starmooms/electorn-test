import Sqlite from '@/main/core/sqlite/sqlite'
import { app } from 'electron'
import * as path from 'path'
import logger from '../Logger'
import ipcManage from '../IpcManage'
import dayjs from 'dayjs'
import HistoryDb from './HistoryDb'
import historyDbCache from './HistoryDBCache'

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

  async createTable(tables: TableName[]) {
    let sql = ''
    const tableName = tables.map(item => item.name)

    const { channelStatus, channelHistory } = this.tables

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
        "masterIds" text NOT NULL,
        "slaverIds" text NOT NULL,
        "channelIds" text NOT NULL,
        "fileId" text NOT NULL UNIQUE,
        "filePath" text NOT NULL,
        "startTime" integer NOT NULL,
        "endTime" integer DEFAULT NULL
      );
      CREATE INDEX "channel_history_start_time" ON "${channelStatus}" ("startTime");
      `
    }

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

  // async initChannelData() {
  //   const { channelStatus, channelHistory } = this.tables
  //   const statusList = await this.sqlite.all(`SELECT * FROM ${channelStatus}`)
  //   const projectId = await this.sqlite.get(
  //     `SELECT projectId FROM ${channelHistory} WHERE startTime DESC LIMT 1`
  //   )
  // }

  /** 工步开始时，创建添加历史列表和生成历史文件，返回历史列表id */
  async workStart(params: ipcReq.WriteSteps) {
    const { channelHistory } = this.tables
    const { masterIds, slaverIds, channelIds, filePath } = params
    const now = dayjs()
    const startTime = now.valueOf()
    const fileId = now.format('YYYYMMDDHHmmssSSS')

    // 创建历史列表
    await this.sqlite.run(
      `INSERT INTO ${channelHistory} (masterIds, slaverIds, channelIds, fileId, filePath, startTime)
      VALUES (
        '${masterIds.join(',')}',
        '${slaverIds.join(',')}',
        '${channelIds}',
        ${fileId},
        '${filePath}',
        ${startTime}
      );`
    )
    const data = await this.sqlite.get(
      `SELECT id FROM ${channelHistory} WHERE fileId=${fileId};`
    )
    const historyId = data.id as number

    // 创建历史文件
    await historyDbCache.createdHistory({
      fileId,
      filePath,
      historyId,
      params
    })

    return historyId

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

  /** 根据id获取单条历史记录 */
  async getHistory(historyId: number) {
    const { channelHistory } = this.tables
    return this.sqlite.get<any>(
      `SELECT * FROM ${channelHistory} WHERE id=${historyId}`
    )
  }
}

const mainDb = new MainDb()
export default mainDb
