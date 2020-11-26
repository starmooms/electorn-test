import mainDb from '../../sqlite/MainDb'
import logger from '../../Logger'
import historyDbCache from '../../sqlite/HistoryDBCache'

interface QueueItemData {
  saveSampList: SampTB.SaveSampItem[]
  channelStatus: Port.ChannelChangeItem[]
  errorList: Port.ErrorListItem[]
}

interface QueueItem extends QueueItemData {
  addTime: number
}

/** 采样存储队列 */
export default class SampSaveQueue {
  queue: QueueItem[] = []
  isRun = false

  // constructor() {}

  /** 添加队列 */
  addQueue(queue: QueueItemData) {
    this.queue.push({
      addTime: Date.now(),
      ...queue
    })
    this.next()
  }

  /** 检查队列状态是否异常 */
  checkQueue() {
    if (this.queue.length > 10) {
      logger.warn('采样数据堆积超过10条', this.queue.length)
    }
  }

  /** 检查消费是否延迟 */
  checkDelay(queue: QueueItem) {
    if (Date.now() - queue.addTime > 3000) {
      logger.warn('采样处理延迟超过3s')
    }
  }

  /** 触发消费队列 */
  async next() {
    this.checkQueue()
    if (this.isRun) return

    const item = this.queue.shift()
    if (item) {
      this.isRun = true
      this.checkDelay(item)
      await this.runSaveSamp(item)
      this.isRun = false
      this.next()
      return
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
