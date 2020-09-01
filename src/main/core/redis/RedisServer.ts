import { app } from 'electron'
import { resolve, join } from 'path'
import fs from 'fs'
import is from 'electron-is'
import logger from '@/main/core/Logger'
import forever from 'forever-monitor'
import { exec } from 'child_process'
import configManage from '../ConfigManage'

export default class RedisServer {
  private static _instance: RedisServer | null = null
  monitor: forever.Monitor | null = null
  isWin = is.windows()
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
    // let basePath = app.getPath('userData')

    if (is.dev()) {
      basePath = resolve(__dirname, `../extra/${platform}/redis`)
    }
    const binName = this.isWin ? 'redis-server.exe' : 'redis-server'

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

    return {
      binPath: binPath,
      cwd: basePath
    }
  }

  exec(sh: string, cwd: string) {
    return new Promise((resolve, reject) => {
      exec(sh, { cwd }, (err, stdout, stderr) => {
        if (err) {
          logger.error(err)
          return reject(err)
        }
        logger.info(stdout, stderr)
        return resolve()
      })
    })
  }

  async start() {
    return this.isWin ? this.winServiceStart() : this.cmdStart()
  }

  async stop() {
    return this.isWin ? this.winServiceStop() : this.cmdStop()
  }

  async cmdStart() {
    return new Promise((resolve, reject) => {
      const { binPath, cwd } = this.getStartSh()
      this.monitor = forever.start([binPath, './redis.conf'], {
        max: 1,
        cwd,
        parser(command, args) {
          return {
            command: command,
            args: args
          }
        },
        silent: !is.dev()
      })
      this.monitor.on('start', () => {
        logger.info('RedisServer Start')
        resolve()
      })
      this.monitor.on('error', err => {
        logger.info('RedisServer Error', err)
        reject(err)
      })
    })
  }

  async cmdStop() {
    return new Promise((resolve, rejects) => {
      if (this.monitor) {
        this.monitor.on('exit', () => {
          logger.info('RedisServer Exit')
          resolve()
        })
        this.monitor.on('error', err => {
          logger.info('RedisServer Error', err)
          rejects(err)
        })
        this.monitor.stop()
      }
    })
  }

  async winServiceStart() {
    const { binPath, cwd } = this.getStartSh()
    await this.exec(
      `${binPath} --service-install ./redis.windows-service.conf`,
      cwd
    )
    await this.exec(`${binPath} --service-start`, cwd)
  }

  async winServiceStop() {
    const { binPath, cwd } = this.getStartSh()
    await this.exec(`${binPath} --service-stop`, cwd)
    await this.exec(`${binPath} --service-uninstall`, cwd)
  }
}
