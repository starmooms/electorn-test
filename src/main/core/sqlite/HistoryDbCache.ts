import HistoryDb from './HistoryDb'
import mainDb from './MainDb'
import logger from '../Logger'

interface CreateHistory {
  fileId: string
  filePath: string
  historyId: number
  params: ipcReq.WriteSteps
}
interface DataSave {
  U: null | number
  I: null | number
  time: number
}

class HistoryDbCache {
  historyDbMap = new Map<
    number,
    {
      db: HistoryDb
      filePath: string
      dataSave: DataSave
    }
  >()

  /** 添加缓存 */
  set(historyId: number, HistoryDb: HistoryDb, saveConf: ipcReq.StepsDataSave) {
    const dataSave = {
      U: null,
      I: null,
      time: 30000
    }

    for (const key in saveConf) {
      const val = saveConf[key] as ipcReq.StepDataSaveItem
      if (val.enable && val.value) {
        if (key === 'time') {
          dataSave.time = val.value * 1000
        } else {
          dataSave[key] = val.value
        }
      }
    }

    const cache = {
      db: HistoryDb,
      filePath: HistoryDb.sqlite.fileName,
      dataSave
    }
    this.historyDbMap.set(historyId, cache)
    return cache
  }

  getItem(historyId: number) {
    return this.historyDbMap.get(historyId)
  }

  closeHistoryDb(historyId: number) {
    logger.info('关闭db', historyId)
    const dbItem = this.historyDbMap.get(historyId)
    if (dbItem) {
      this.historyDbMap.delete(historyId)
    }
  }

  /** 获取缓存，不存在则根据historyId，尝试打开 */
  async getItemAsync(historyId) {
    try {
      const cache = this.getItem(historyId)
      if (cache) return cache
      const data = await mainDb.getHistory(historyId)
      const historyDb = new HistoryDb(data.fileId, data.filePath, () => {
        this.closeHistoryDb(historyId)
      })
      const stepInfo = await historyDb.open()
      logger.info('打开db', historyId)
      return this.set(historyId, historyDb, stepInfo.dataSave)
    } catch (err) {
      logger.error(`projectId:${historyId} 打开db失败`, err)
      throw err
    }
  }

  /** 工步启动时创建历史文件 */
  async createdHistory({ params, fileId, filePath, historyId }: CreateHistory) {
    const historyDb = new HistoryDb(fileId, filePath, () => {
      this.closeHistoryDb(historyId)
    })
    await historyDb.created(params, historyId)
    this.set(historyId, historyDb, params.dataSave)
  }

  async getDb(historyId: number) {
    const cache = await this.getItemAsync(historyId)
    return cache.db
  }

  /** 获取通道保存信息 */
  getSaveConf(historyId: number) {
    const cache = this.getItem(historyId)
    if (!cache) return null
    return cache.dataSave
  }

  /** 获取通道保存信息 */
  getFilePath(historyId: number) {
    const cache = this.getItem(historyId)
    if (!cache) return ''
    return cache.filePath
  }

  /** 保存采样 */
  async saveSamp(list: Db.SaveSampList[]) {
    const promiseArr = list.map(async item => {
      try {
        const db = await this.getDb(item.projectId)
        await db.saveSamp(
          item.sampList,
          item.endStatusList,
          item.changeStatusList
        )
        return true
      } catch (err) {
        logger.error('HistoryDBCache saveSamp Error', err)
        return false
      }
    })
    await Promise.all(promiseArr)
  }
}

const historyDbCache = new HistoryDbCache()

export default historyDbCache
