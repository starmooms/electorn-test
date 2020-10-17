import HistoryDbCom from '@/shared/sqlite/HistoryDbCom'
import path from 'path'

export default class HistoryDb extends HistoryDbCom {
  constructor(filePath: string) {
    super(path.resolve(filePath))
  }

  /** 获取采样内容 */
  async getSampData(params) {
    const { sampData } = this.tables
    const data = await this.sqlite.all(
      `SELECT * FROM ${sampData} WHERE masterId=$masterId and slaverId=$slaverId and channelId=$channelId ORDER BY loopNum, stepId ASC`,
      params
    )
    return data
  }

  /** 获取通道列表 */
  async getChannelList() {
    const { channelInfo } = this.tables
    return this.sqlite.all(`SELECT * FROM ${channelInfo}`)
  }

  /** 获取工步信息 */
  async getWorkStep() {
    const { stepsInfo } = this.tables
    return this.sqlite.get(`SELECT * FROM ${stepsInfo} WHERE id=1`)
  }

  /** 获取分选信息 */
  async getSorting({ setpId, loopNum }: Db.GetStoring) {
    const { stepStatistics } = this.tables
    return this.sqlite.all(
      `SELECT * FROM ${stepStatistics} WHERE stepId=${setpId} AND loopNum=${loopNum}`
    )
  }
}
