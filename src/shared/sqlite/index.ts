import sqlite3 from 'sqlite3'
import logger from '@/main/core/Logger'
import is from 'electron-is'
import { remote } from 'electron'
const sqlite = sqlite3.verbose()

export default class Sqlite {
  db!: sqlite3.Database
  fileName: string
  isConnect = false

  constructor(fileName: string) {
    this.fileName = fileName
  }

  /** 连接数据库 */
  connect() {
    return new Promise<null>((resolve, reject) => {
      if (this.isConnect) return
      logger.info('sql connect', this.fileName)
      if (!this.fileName) {
        reject(`connect fileName undefined`)
        return
      }
      this.db = new sqlite.Database(this.fileName, err => {
        // logger.info('创建连接')
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
      this.isConnect = true
    }).catch(err => {
      return this.handleError<null>(err)
    })
  }

  /** 运行sql */
  run(sql: string, params?: any) {
    return new Promise<null>((resolve, reject) => {
      this.db.run(sql, params, err => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    }).catch(err => {
      return this.handleError<null>(err)
    })
  }

  /** 运行多条sql */
  exec(sql: string) {
    return new Promise<null>((resolve, reject) => {
      this.db.exec(sql, err => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    }).catch(err => {
      return this.handleError<null>(err)
    })
  }

  /** 查询一条数据 */
  get<T = any>(sql: string, params?: any) {
    return new Promise<T>((resolve, reject) => {
      this.db.get(sql, params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    }).catch(err => {
      return this.handleError<T>(err)
    })
  }

  /** 查询多条数据 */
  all<T = any[]>(sql: string, params?: any) {
    return new Promise<T>((resolve, reject) => {
      this.db.all(sql, params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve((data as unknown) as T)
        }
      })
    }).catch(err => {
      return this.handleError<T>(err)
    })
  }

  /** 关闭连接 */
  close() {
    return new Promise<null>((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          reject(err)
        } else {
          this.isConnect = false
          logger.info(`关闭连接 ${this.fileName}`)
          resolve(err)
        }
      })
    }).catch(err => {
      return this.handleError<null>(err)
    })
  }

  handleError<T>(err: any): T {
    if (is.renderer()) {
      remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'error',
        title: 'sqlite Error',
        message: err.message
      })
    }
    throw err
  }

  /** 将sql最后一个‘,’，替换掉 */
  static replaceSql(sql: string, end = '') {
    return sql.replace(/,$/, end)
  }

  /** 获取分页数据 */
  async getPageSql<T = any>({
    limit,
    page,
    tableName,
    order,
    where
  }: Db.PageUtilParams) {
    if (!page || page < 1) {
      page = 1
    }
    const whereSql = where ? ` WHERE ${where}` : ''
    const orderSql = order ? ` ORDER BY ${order}` : ''

    const list = await this.all<T[]>(
      `SELECT * FROM ${tableName}${whereSql}${orderSql} LIMIT ${limit} OFFSET ${limit *
        (page - 1)};`
    )
    const countKey = `COUNT(*)`
    const count = await this.get(
      `SELECT ${countKey} FROM ${tableName}${whereSql};`
    )
    return {
      limit,
      page,
      total: count[countKey],
      list
    }
  }
}
