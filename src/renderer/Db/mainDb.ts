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
    return this.sqlite.getPageSql({
      order: 'createdTime DESC',
      tableName: errorData,
      limit,
      page
    })
  }

  async deleteErrorLog({ startTime, endTime, id }: DbErrorT.DeleteParams) {
    let whereSql = ''
    if (startTime && endTime) {
      whereSql += `createdTime >= '${startTime}' AND createdTime < '${endTime}'`
    } else if (id !== void 0) {
      whereSql += `id=${id}`
    }
    if (!whereSql) {
      throw new Error(`DeleteParams Error`)
    }
    const { errorData } = this.tables
    await this.sqlite.run(`DELETE FROM ${errorData} WHERE ${whereSql}`)
    return
  }

  async getHistoryList({
    fileId,
    startTime,
    endTime,
    limit,
    page
  }: Db.GetHistoryParams) {
    const { channelHistory } = this.tables
    let where = ''
    if (startTime > 0 && endTime > 0) {
      where += `startTime>=${startTime} AND startTime<${endTime}`
    }
    if (fileId) {
      where += `fileId LIKE '%${fileId}%'`
    }
    return this.sqlite.getPageSql({
      order: 'startTime DESC',
      where,
      tableName: channelHistory,
      limit,
      page
    })
  }
}
