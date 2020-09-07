import Redis from 'ioredis'
import dayjs from 'dayjs'
import logger from '../Logger'
import ipcManage from '../IpcManage'

interface SetTranslateOpts {
  masterId: number
  slaverId: number
}

export class RedisClient {
  private static _instance: RedisClient | null = null
  redis!: Redis.Redis
  errorIsSend = false

  constructor() {
    this.init()
  }

  public static getInstance() {
    if (RedisClient._instance === null) {
      RedisClient._instance = new RedisClient()
    }
    return RedisClient._instance
  }

  init() {
    ipcManage.handle('/db/getSamp', async (event, path: string, data: any) => {
      return await this.getSamp(data)
    })
  }

  initRedis() {
    this.redis = new Redis(6379, '127.0.0.21', {
      showFriendlyErrorStack: true,
      connectTimeout: 10000,
      enableOfflineQueue: false
    })
    this.redis.on('error', err => {
      logger.warn('RedisClient ConnectError', err)
      if (!this.errorIsSend) {
        ipcManage.ipcError('redis 链接失败！')
        this.errorIsSend = true
      }
    })
    this.redis.on('ready', err => {
      logger.info('RedisClient Ready', err)
      this.errorIsSend = false
    })
    // this.redis.on('close', err => {
    //   logger.info('RedisClient Close', err)
    //   this.errorIsSend = false
    // })
  }

  async close() {
    if (this.redis) {
      try {
        await this.redis.quit()
        logger.info('RedisClient Close')
      } catch (err) {
        logger.error('RedisClient Close Error', err)
      }
    }
  }

  async setSamp(masterId: number, list: any[]) {
    try {
      const pipeline = this.redis.pipeline()
      const today = dayjs().startOf('day').unix() // eslint-disable-line
      list.forEach(item => {
        if (item.workerCode !== '00') {
          pipeline.zadd(
            `samp_${masterId}_${item.slaverId}_${item.channelId}_${today}`,
            item.createTime,
            JSON.stringify(item)
          )
        }
      })
      const data = await pipeline.exec()
      data.forEach(item => {
        if (item[0]) {
          throw item[0]
        }
      })
      // logger.info('redis存储成功')
    } catch (err) {
      logger.warn('redis存储失败', err)
    }
  }

  async getSamp({ masterId, start, end, slaverArr }: any = {}) {
    const pipeline = this.redis.pipeline()

    const today = dayjs().startOf('day').unix() // eslint-disable-line
    if (!start) start = dayjs().subtract(15, 'minute').unix() // eslint-disable-line
    if (!end) end = dayjs().unix() // eslint-disable-line
    const startOfDay = dayjs.unix(start).startOf('day').unix() // eslint-disable-line
    const endOfDay = dayjs.unix(end).startOf('day').unix() // eslint-disable-line
    const dayKeys: number[] = []
    let startKey = startOfDay
    while (endOfDay - startKey >= 0) {
      dayKeys.push(startKey)
      startKey += 86400
    }

    dayKeys.forEach(dayKey => {
      slaverArr.forEach(slaver => {
        slaver.channel.forEach(channel => {
          pipeline.zrangebyscore(
            `samp_${masterId}_${slaver.id}_${channel.id}_${dayKey}`,
            start,
            end
          )
        })
      })
    })

    const result = await pipeline.exec()
    const slaverList = {}
    result.forEach(([err, list]) => {
      if (err) {
        throw err
      }
      return list.forEach(item => {
        const samp = JSON.parse(item)
        // const sampData = {
        //   channelId: samp.channelId,
        //   U: samp.U,
        //   I: samp.I,
        //   createTime: samp.createTime
        // }
        if (!slaverList[samp.slaverId]) {
          slaverList[samp.slaverId] = {}
        }
        const channel = slaverList[samp.slaverId][samp.channelId]
        if (channel) {
          channel.push(samp)
        } else {
          slaverList[samp.slaverId][samp.channelId] = [samp]
        }
      })
    })
    return slaverList
  }

  async channelSetStart(channelStartList: any[]) {
    const pipeline = this.redis.pipeline()
    channelStartList.forEach(item => {
      pipeline.lpush(
        `status_${item.masterId}_${item.slaverId}_${item.channelId}`,
        JSON.stringify({
          start: item.start,
          end: item.end || null
        })
      )
    })
    const result = await pipeline.exec()
    result.forEach(([err]) => {
      if (err) {
        throw err
      }
    })
  }
}

const redisClient = RedisClient.getInstance()
export default redisClient
