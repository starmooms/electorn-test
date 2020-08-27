import { app } from 'electron'
import { resolve, join } from 'path'
import fs from 'fs'
import is from 'electron-is'
import logger from '@/main/core/Logger'
import forever from 'forever-monitor'
import { reject } from 'bluebird'
import { exec, execSync } from 'child_process'
import { stdout, stderr } from 'process'

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

  execSync(sh: string, cwd: string) {
    const data = execSync(sh, { cwd })
    logger.info(data.toString())
  }

  async start() {
    const { binPath, cwd } = this.getStartSh()
    await this.exec(
      `${binPath} --service-install ./redis.windows-service.conf`,
      cwd
    )
    await this.exec(`${binPath} --service-start`, cwd)
  }

  async stop() {
    const { binPath, cwd } = this.getStartSh()
    await this.exec(`${binPath} --service-stop`, cwd)
    await this.exec(`${binPath} --service-uninstall`, cwd)
  }
}
