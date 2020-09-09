import Redis from 'ioredis'
import dayjs from 'dayjs'
import logger from '../Logger'
import ipcManage from '../IpcManage'
import _merge from 'lodash/merge'
import configManage from '../ConfigManage'
import { setDeep, TIME_FORMAT } from '@/shared/utils'
import { resolve } from 'bluebird'
import { pipeline } from 'serialport'

interface SetTranslateOpts {
  masterId: number
  slaverId: number
}

interface ChannelStatusList {
  [key: string]: {
    [key: string]: {
      [key: string]: {
        start: number | null
        end: number | null
      }
    }
  }
}

export class RedisClient {
  private static _instance: RedisClient | null = null
  redis!: Redis.Redis
  errorIsSend = false
  channelList: any = {}
  waitRedisRes: any
  redisIsReady = false

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
    ipcManage.handle('/db/history', async (event, path: string, data: any) => {
      return await this.channelGetStartList(path, data)
    })
    ipcManage.handle('/db/errorLog', async (event, data: any) => {
      return await this.getErrorLog()
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
      this.redisIsReady = true
      if (this.waitRedisRes) {
        this.waitRedisRes()
      }
    })
    // this.redis.on('close', err => {
    //   logger.info('RedisClient Close', err)
    //   this.errorIsSend = false
    // })
  }

  async waitRedisInit() {
    if (this.redisIsReady) {
      return true
    }
    return new Promise((resolve, reject) => {
      this.waitRedisRes = resolve
    })
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

  async getChannelList(path: string): Promise<ChannelStatusList> {
    await this.waitRedisInit()
    let channelList = this.channelList[path]
    if (!channelList) {
      const data = await this.redis.get(`${path}_channel_status`)
      if (!data) {
        this.channelList[path] = {}
      } else {
        this.channelList[path] = JSON.parse(data)
      }
      channelList = this.channelList[path]
    }
    return channelList
  }

  async setChannelList(path: string, newList: any) {
    try {
      const channelList = await this.getChannelList(path)
      this.channelList[path] = _merge(channelList, newList)
      await this.redis.set(
        `${path}_channel_status`,
        JSON.stringify(this.channelList[path])
      )
    } catch (err) {
      logger.error('RedisClint 通道记录当前启动时刻失败', err)
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

  async channelSetStart(portPath: string, channelStartList: any[]) {
    const pipeline = this.redis.pipeline()
    const newChannelList = {}
    channelStartList.forEach(item => {
      const { masterId, slaverId, channelId } = item
      const time = {
        start: item.start,
        end: item.end || null
      }

      if (time.start && time.end) {
        const startTime = {
          start: item.start,
          end: null
        }
        pipeline.lrem(
          `${portPath}_status_${masterId}_${slaverId}_${channelId}`,
          1,
          JSON.stringify(startTime)
        )
      }

      pipeline.lpush(
        `${portPath}_status_${masterId}_${slaverId}_${channelId}`,
        JSON.stringify(time)
      )
      setDeep(time, [masterId, slaverId, channelId], newChannelList)
    })

    const [result, setNewChannel] = await Promise.all([
      pipeline.exec(),
      this.setChannelList(portPath, newChannelList)
    ])

    result.forEach(([err]) => {
      if (err) {
        throw err
      }
    })
  }

  async channelGetStartList(portPath: string, params: any) {
    const { masterId, slaverId, channelId } = params
    const data = await this.redis.lrange(
      `${portPath}_status_${masterId}_${slaverId}_${channelId}`,
      0,
      -1
    )
    return data
  }

  /** 存储错误 */
  async saveError(errData: Port.SaveError) {
    try {
      const value = errData.map(item => JSON.stringify(item))
      await this.redis.lpush(`error_log`, value)
    } catch (err) {
      logger.warn('redis存储错误失败', errData)
    }
  }

  async getErrorLog() {
    const data = await this.redis.lrange(`error_log`, 0, -1)
    let list: any[] = []
    if (data) {
      list = data.map(item => {
        const val = JSON.parse(item)
        val.createTimeStr = dayjs().format(TIME_FORMAT)
        return val
      })
    }
    return list
  }
}

const redisClient = RedisClient.getInstance()
export default redisClient
