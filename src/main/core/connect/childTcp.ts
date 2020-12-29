import cp from 'child_process'
// import OS from 'os'
import path from 'path'
import logger from '../Logger'
import { app } from 'electron'
import is from 'electron-is'

// const numCPUs = OS.cpus().length

if (is.dev()) {
  app.whenReady().then(() => {
    for (let i = 0; i < 1; i++) {
      logger.info('创建子进程 TcpServer')
      const child = cp.fork(path.join(__dirname, 'child.js'))
      child.on('disconnect', () => {
        logger.info('断开 disconnect')
      })
      child.on('close', () => {
        logger.info('退出 close')
      })
      child.on('exit', () => {
        logger.info('退出 exit')
      })
      child.on('error', err => {
        logger.info('子进程错误', err)
      })
      child.on('message', m => {
        logger.info('父进程收到消息', m)
      })
    }
  })
}
