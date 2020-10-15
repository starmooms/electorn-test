import MainDbCom from '@/shared/sqlite/MainDbCom'
import path from 'path'
import { SettingStatus } from '../store/modules/Setting'

export default class MainDb extends MainDbCom {
  constructor() {
    const filePath = SettingStatus.mainDbPath
    super(path.resolve(filePath))
  }

  async getErrorList({ limit, page }: Db.ListQuery) {
    const { errorData } = this.tables
    if (!page || page < 1) {
      page = 1
    }
    const list = await this.sqlite.all<Db.ErrorItem[]>(
      `SELECT * FROM ${errorData} ORDER BY createdTime DESC LIMIT ${limit} OFFSET ${limit *
        (page - 1)};`
    )
    const countKey = `COUNT(*)`
    const count = await this.sqlite.get(`SELECT ${countKey} FROM ${errorData};`)
    return {
      limit,
      page,
      total: count[countKey],
      list
    }
  }

  async getHistoryList({ limit, page }: Db.ListQuery) {
    const { channelHistory } = this.tables
    return this.sqlite.getPageSql({
      order: 'ORDER BY startTime DESC',
      tableName: channelHistory,
      limit,
      page
    })
  }
}
