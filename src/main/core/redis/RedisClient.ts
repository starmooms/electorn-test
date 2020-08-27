import Redis from 'ioredis'
import logger from '../Logger'
import ipcManage from '../IpcManage'

export default class RedisClient {
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
    this.redis = new Redis(6379, '127.0.0.21', {
      showFriendlyErrorStack: true,
      connectTimeout: 10000
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
    await this.redis.quit()
    logger.info('RedisClient Close')
  }
}
