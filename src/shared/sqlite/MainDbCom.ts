import Sqlite from '@/shared/sqlite/index'

export default class MainDbCom {
  sqlite: Sqlite
  tables = {
    channelStatus: 'channel_status',
    channelHistory: 'channel_history',
    errorData: 'error_data'
  }
  filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
    this.sqlite = new Sqlite(this.filePath)
  }

  async connect() {
    await this.sqlite.connect()
    return this.sqlite.fileName
  }

  close() {
    return this.sqlite.close()
  }
}
