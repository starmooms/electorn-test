import Sqlite from '@/shared/sqlite/index'
import path from 'path'
import { SettingStatus } from '../store/modules/Setting'

export default class MainDb {
  sqlite: Sqlite
  tables = {
    errorData: 'error_data'
  }

  constructor() {
    const filePath = SettingStatus.mainDbPath
    this.sqlite = new Sqlite(path.resolve(filePath))
  }

  async connect() {
    await this.sqlite.connect()
  }

  async close() {
    await this.sqlite.close()
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
}
