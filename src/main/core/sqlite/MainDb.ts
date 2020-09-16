import Sqlite from '@/main/core/sqlite/Sqlite'
import { app } from 'electron'

class MainDb {
  sqlite: Sqlite

  constructor() {
    const path = app.getPath('userData')
    this.sqlite = new Sqlite(`${path}/local_db/main.db`)
  }

  connect() {
    return this.sqlite.connect()
  }
}
