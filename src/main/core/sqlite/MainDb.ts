import Sqlite from '@/main/core/sqlite/sqlite'
import { app } from 'electron'
import * as path from 'path'
import logger from '../Logger'
import ipcManage from '../IpcManage'
import dayjs from 'dayjs'
import historyDbCache from './HistoryDBCache'
import { channelList } from '@/shared/config/port'

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
    channelHistory: 'channel_history',
    errorData: 'error_data'
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
      return this.sqlite.fileName
    } catch (err) {
      ipcManage.ipcNotify({
        type: 'error',
        message: `mainDB Error:${err.message}`
      })
      logger.error('mainDB Error', err)
    }
  }

  async close() {
    if (this.sqlite) {
      this.sqlite.close()
    }
  }

  async createTable(tables: TableName[]) {
    let sql = ''
    const tableName = tables.map(item => item.name)

    const { channelStatus, channelHistory, errorData } = this.tables

    // 通道状态记录
    if (!tableName.includes(channelStatus)) {
      sql += `CREATE TABLE "${channelStatus}" (
        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" integer NOT NULL,
        "slaverId" integer NOT NULL,
        "channelId" integer NOT NULL,
        "fullId" text NOT NULL,
        "status" text DEFAULT NULL
      );
      CREATE INDEX "channel_status_fullId_index" ON "${channelStatus}" ("fullId");
      CREATE INDEX "channel_status_channel_index"
      ON "${channelStatus}" (
        "masterId",
        "slaverId",
        "channelId"
      );`
      let insertChannel = `INSERT INTO ${channelStatus} (masterId, slaverId, channelId, fullId) VALUES`
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 32; j++) {
          for (let k = 0; k < 8; k++) {
            insertChannel += `(${i},${j},${k},'${i}_${j}_${k}'),`
          }
        }
      }
      sql += insertChannel.replace(/,$/, ';')
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

    // 错误历史 type 1: 通讯错误 2：实时数据错误列表
    if (!tableName.includes(errorData)) {
      sql += `CREATE TABLE "${errorData}" (
        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        "masterId" text NOT NULL,
        "slaverIds" text NOT NULL,
        "channelIds" text NOT NULL,
        "type" integer NOT NULL,
        "action" text NOT NULL,
        "errCode" text NOT NULL,
        "params1" text DEFAULT NULL,
        "params2" text DEFAULT NULL,
        "createdTime" datetime NOT NULL DEFAULT(datetime('now', 'localtime'))
      );
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

  /** 记录通道状态 */
  async saveChannelStatus(list: Port.ChannelChangeItem[]) {
    const runStatus: string[] = []
    const endStatus: string[] = []
    list.forEach(item => {
      const sql = `(masterId=${item.masterId} AND slaverId=${item.slaverId} AND channelId=${item.channelId})`
      if (item.status === 'RUN') {
        runStatus.push(sql)
      } else if (item.status === 'END') {
        endStatus.push(sql)
      }
    })

    let updateSql = ''
    const { channelStatus } = this.tables
    if (runStatus.length > 0) {
      updateSql += `UPDATE ${channelStatus} SET status='RUN' WHERE ${runStatus.join(
        'OR'
      )};`
    }
    if (endStatus.length > 0) {
      updateSql += `UPDATE ${channelStatus} SET status='END' WHERE ${endStatus.join(
        'OR'
      )};`
    }
    if (updateSql) {
      await this.sqlite.exec(updateSql)
    }
    return
  }

  /** 获取通道记录 */
  async getChannelStatus() {
    const { channelStatus } = this.tables
    const row = await this.sqlite.all(
      `SELECT * FROM ${channelStatus} WHERE status='RUN'`
    )
    return row
  }

  /** 记录错误数据 */
  async saveErrorList(errorList: Port.ErrorList) {
    const { errorData } = this.tables
    let sql = ''
    errorList.forEach(item => {
      sql += `(
        '${item.masterId}',
        '${item.slaverIds}',
        '${item.channelIds}',
        ${item.type},
        '${item.action}',
        '${item.errCode}',
        ${item.params1 ? `'${item.params1}'` : 'NULL'},
        ${item.params2 ? `'${item.params2}'` : 'NULL'}),`
    })
    if (sql) {
      sql =
        `INSERT INTO ${errorData} (masterId, slaverIds, channelIds, type, action, errCode, params1, params2) VALUES` +
        Sqlite.replaceSql(sql, ';')
      await this.sqlite.run(sql)
    }
  }
}

const mainDb = new MainDb()
export default mainDb
