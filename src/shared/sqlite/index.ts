import sqlite3 from 'sqlite3'
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
      this.isConnect = true
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
          resolve(err)
        }
      })
    })
  }
}
