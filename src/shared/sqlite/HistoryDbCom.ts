import Sqlite from '@/shared/sqlite/index'
import fs from 'fs'
import { tipUtil } from './sqlUtil'

export default class HistoryDbCom {
  sqlite: Sqlite
  tables = {
    stepsInfo: 'steps_info',
    channelInfo: 'channel_info',
    sampData: 'samp_data',
    stepStatistics: 'step_statistics'
  }
  checkFile = true

  constructor(filePath: string, checkFile = true) {
    this.checkFile = checkFile
    this.sqlite = new Sqlite(filePath)
  }

  async connect() {
    if (this.checkFile) {
      await this.handleCheckFile()
    }
    return this.sqlite.connect()
  }

  close() {
    if (!this.sqlite.isConnect) return
    return this.sqlite.close()
  }

  /** 检查文件是否存在 */
  async handleCheckFile() {
    try {
      await fs.promises.access(this.sqlite.fileName, fs.constants.F_OK)
      return true
    } catch (err) {
      const msg = `文件 ${this.sqlite.fileName} 不存在`
      tipUtil(msg)
      throw err
    }
  }
}
