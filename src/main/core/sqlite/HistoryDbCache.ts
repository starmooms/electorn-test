import HistoryDb from './HistoryDb'
import mainDb from './MainDb'

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
      dataSave: DataSave
    }
  >()

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

    this.historyDbMap.set(historyId, {
      db: HistoryDb,
      dataSave
    })
  }

  async getItemAsync(historyId) {
    const item = this.historyDbMap.get(historyId)
    if (!item) {
      const data = await mainDb.getHistory(historyId)
      const historyDb = new HistoryDb(data.fileId, data.filePath)
    }
  }

  getItem(historyId: number) {
    const item = this.historyDbMap.get(historyId)
    if (!item) {
      throw new Error(`${historyId} historyDb no defined`)
    }
    return item
  }

  getDb(historyId: number) {
    return this.getItem(historyId).db
  }

  getSaveConf(historyId: number) {
    return this.getItem(historyId).dataSave
  }

  async createdHistory({ params, fileId, filePath, historyId }: CreateHistory) {
    const historyDb = new HistoryDb(fileId, filePath)
    await historyDb.created(params, historyId)
    this.set(historyId, historyDb, params.dataSave)
  }

  /** 保存采样 */
  async saveSamp(list: Db.SaveSampList[]) {
    const promiseArr = list.map(async item => {
      const db = this.getDb(item.projectId)
      return db.saveSamp(item.sampList)
    })
    await Promise.all(promiseArr)
  }
}

const historyDbCache = new HistoryDbCache()

export default historyDbCache
