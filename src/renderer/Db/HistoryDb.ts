import Sqlite from '@/shared/sqlite/index'
import path from 'path'

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

  constructor(filePath: string) {
    this.sqlite = new Sqlite(path.resolve(filePath))
  }

  async connect() {
    if (this.sqlite.isConnect) return
    await this.sqlite.connect()
    const data = await this.sqlite.all<TableName[]>(
      `SELECT name FROM sqlite_master`
    )
    console.log(data)
  }

  async close() {
    await this.sqlite.close()
  }

  async getSampData(params) {
    const { sampData } = this.tables
    return this.sqlite.all(
      `SELECT * FROM ${sampData} WHERE masterId=$masterId and slaverId=$slaverId and channelId=$channelId`,
      params
    )
  }
}
