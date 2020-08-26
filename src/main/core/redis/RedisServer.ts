import { app } from 'electron'
import { resolve, join } from 'path'
import fs from 'fs'
import is from 'electron-is'
import logger from '@/main/core/Logger'
import forever from 'forever-monitor'

export default class RedisServer {
  private static _instance: RedisServer | null = null
  monitor: forever.Monitor | null = null

  cachePath = `../../__local/redis/`

  public static getInstance() {
    if (RedisServer._instance === null) {
      RedisServer._instance = new RedisServer()
    }
    return RedisServer._instance
  }

  getStartSh() {
    const { platform } = process
    let basePath = resolve(app.getAppPath(), '../redis')

    if (is.dev()) {
      basePath = resolve(__dirname, `../extra/${platform}/redis`)
    }
    const binName = platform === 'win32' ? 'redis-server.exe' : 'redis-server'

    const binPath = join(basePath, `/${binName}`)
    const binIsExist = fs.existsSync(binPath)
    if (!binIsExist) {
      logger.error('redis bin is not exist:', binPath)
      throw new Error('redis')
    }

    const cachePath = resolve(basePath, this.cachePath)
    const cacheIsExist = fs.existsSync(cachePath)
    if (!cacheIsExist) {
      fs.mkdirSync(cachePath, {
        recursive: true
      })
    }

    const confPath = join(basePath, '/redis.windows.conf')
    return {
      sh: [binPath, confPath],
      cwd: basePath
    }
  }

  start() {
    // console.log(forever)
    if (this.monitor === null) {
      const { sh, cwd } = this.getStartSh()
      logger.info('redis start sh:', sh)
      this.monitor = forever.start(sh, {
        max: 1,
        cwd,
        // spawnWith: {
        //   shell: true // Windows only - makes forever spawn in a shell
        // },
        parser: function(command, args) {
          return {
            command: command,
            args: args
          }
        },
        silent: !is.dev()
      })

      // const { child } = this.monitor
      // logger.info('Redis pid:', child.pid)

      this.monitor.on('error', err => {
        logger.info(`Redis error: ${err}`)
      })

      this.monitor.on('start', () => {
        logger.info('Redis started')
      })

      this.monitor.on('stop', () => {
        logger.info('Redis stop')
      })
    }
  }

  stop() {
    if (this.monitor) {
      try {
        logger.info('[Motrix] Engine stopping')
        this.monitor.stop()
      } catch (err) {
        logger.error('[Motrix] Engine stop fail:', err.message)
        alert('redis close error')
      } finally {
        this.monitor.removeAllListeners('start')
        this.monitor.removeAllListeners('error')
        this.monitor.removeAllListeners('stop')
      }
    }
  }
}
