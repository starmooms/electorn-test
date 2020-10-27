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
      time: 30
    }

    for (const key in saveConf) {
      const val = saveConf[key] as ipcReq.StepDataSaveItem
      if (val.enable && val.value) {
        dataSave[key] = val.value
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

  closeHistoryDb(historyId: number, status?: string) {
    logger.debug('HistoryDbCache 关闭db', historyId, status)
    const dbItem = this.historyDbMap.get(historyId)
    if (dbItem) {
      this.historyDbMap.delete(historyId)
    }
    if (status === 'isEnd') {
      mainDb.workEnd(historyId)
    }
  }

  /** 获取缓存，不存在则根据historyId，尝试打开 */
  async getItemAsync(historyId) {
    try {
      const cache = this.getItem(historyId)
      if (cache) return cache
      const data = await mainDb.getHistory(historyId)
      if (!data) {
        throw new Error('不存在相关历史记录')
      }
      const historyDb = new HistoryDb(
        data.fileId,
        data.filePath,
        (status?: string) => {
          this.closeHistoryDb(historyId, status)
        }
      )
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
    const historyDb = new HistoryDb(
      fileId,
      filePath,
      status => {
        this.closeHistoryDb(historyId, status)
      },
      false
    )
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
        await db.saveSamp(item)
        return true
      } catch (err) {
        logger.error(`HistoryDBCache saveSamp Error ${item.projectId}`, err)
        return false
      }
    })
    await Promise.all(promiseArr)
  }
}

const historyDbCache = new HistoryDbCache()

export default historyDbCache
