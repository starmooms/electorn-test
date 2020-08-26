import Redis from 'ioredis'
import RedisServer from './RedisServer'

export default class RedisClient {
  private static _instance: RedisClient | null = null
  redis = new Redis(6379, '127.0.0.21')

  public static getInstance() {
    if (RedisClient._instance === null) {
      RedisClient._instance = new RedisClient()
    }
    return RedisClient._instance
  }
}
