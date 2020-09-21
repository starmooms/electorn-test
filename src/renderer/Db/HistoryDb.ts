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
  }

  async close() {
    await this.sqlite.close()
  }

  async getSampData(params) {
    const { sampData } = this.tables
    const data = await this.sqlite.all(
      `SELECT * FROM ${sampData} WHERE masterId=$masterId and slaverId=$slaverId and channelId=$channelId`,
      params
    )
    return data
  }

  async getChannelList() {
    const { channelInfo } = this.tables
    return this.sqlite.all(`SELECT * FROM ${channelInfo}`)
  }

  async getWorkStep() {
    const { stepsInfo } = this.tables
    return this.sqlite.get(`SELECT * FROM ${stepsInfo} WHERE id=1`)
  }
}
