import HistoryDbCom from '@/shared/sqlite/HistoryDbCom'
import path from 'path'

export default class HistoryDb extends HistoryDbCom {
  constructor(filePath: string) {
    super(path.resolve(filePath))
  }

  async getSampData(params) {
    const { sampData } = this.tables
    const data = await this.sqlite.all(
      `SELECT * FROM ${sampData} WHERE masterId=$masterId and slaverId=$slaverId and channelId=$channelId ORDER BY loopNum, stepId ASC`,
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

  // /** 获取分容所需工步 */
  // async getSeparatStep() {
  //   const { stepStatistics } = this.tables
  //   // return this.sqlite.get(`SELECT * FROM ${}`)
  // }
}
