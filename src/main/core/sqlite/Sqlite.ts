import sqlite3 from 'sqlite3'
const sqlite = sqlite3.verbose()

export default class Sqlite {
  db!: sqlite3.Database
  fileName: string

  constructor(fileName: string) {
    this.fileName = fileName
  }

  /** 连接数据库 */
  connect() {
    return new Promise<null>((resolve, reject) => {
      if (!this.fileName) {
        reject(`connect fileName undefined`)
        return
      }
      this.db = new sqlite.Database(this.fileName, err => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    })
  }

  /** 运行sql */
  run(sql: string, params: any) {
    return new Promise<null>((resolve, reject) => {
      this.db.run(sql, params, err => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    })
  }

  /** 运行多条sql */
  exec<T = any>(sql: string) {
    return new Promise((resolve, reject) => {
      this.db.exec<T>(sql, err => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    })
  }

  /** 查询一条数据 */
  get<T = any>(sql: string, params: any) {
    return new Promise<T>((resolve, reject) => {
      this.db.get(sql, params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  /** 关闭连接 */
  close() {
    return new Promise<null>((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          reject(err)
        } else {
          resolve(err)
        }
      })
    })
  }
}
