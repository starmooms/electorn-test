import mainDb from '../../sqlite/MainDb'
import logger from '../../Logger'
import historyDbCache from '../../sqlite/HistoryDBCache'

interface QueueItem {
  saveSampList: Port.SaveSampItem[]
  channelStatus: Port.ChannelChangeItem[]
  errorList: Port.ErrorListItem[]
}

/** 采样存储队列 */
export default class SampSaveQueue {
  queue: QueueItem[] = []
  isRun = false

  // constructor() {}

  addQueue(queue: QueueItem) {
    this.queue.push(queue)
    this.next()
  }

  async next() {
    if (this.isRun) return
    if (this.queue.length > 10) {
      logger.warn('采样数据堆积超过10条', this.queue.length)
    }
    const item = this.queue.shift()
    if (item) {
      this.isRun = true
      await this.runSaveSamp(item)
      this.isRun = false
      this.next()
    }
  }

  /** 消费掉队列 */
  async runSaveSamp(queue: QueueItem) {
    try {
      logger.info('开始存储采样')
      await Promise.all([
        historyDbCache.saveSamp(queue.saveSampList),
        this.mainSaveChannelStatus(queue.channelStatus),
        this.mainSaveError(queue.errorList)
      ])
      logger.info('采样存储结束')
    } catch (err) {
      logger.error('runSaveSamp Error', err)
    }
  }

  /** 主数据库记录通道状态 */
  async mainSaveChannelStatus(channelStatus: Port.ChannelChangeItem[]) {
    try {
      if (channelStatus.length > 0) {
        await mainDb.saveChannelStatus(channelStatus)
      }
    } catch (err) {
      logger.error('mainSaveChannelStatus Error:', err)
    }
  }

  /** 主数据库记录错误列表 */
  async mainSaveError(errorList: Port.ErrorListItem[]) {
    try {
      if (errorList.length > 0) {
        await mainDb.saveErrorList(errorList)
      }
    } catch (err) {
      logger.error('mainSaveError Error:', err)
    }
  }
}
