import Sqlite from '@/shared/sqlite/index'
import path from 'path'

export default class HistoryDbCom {
  sqlite: Sqlite
  tables = {
    stepsInfo: 'steps_info',
    channelInfo: 'channel_info',
    sampData: 'samp_data'
  }

  constructor(filePath: string) {
    this.sqlite = new Sqlite(filePath)
  }

  connect() {
    return this.sqlite.connect()
  }

  close() {
    return this.sqlite.close()
  }
}
