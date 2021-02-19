import SerialPort from 'serialport'
import is from 'electron-is'

import agreement from '@/main/core/Agreement'
import logger, { sysLog } from '@/main/core/Logger'
import TransfromParser from '@/main/utils/transfromParser'
import NotifyUtil from '@/main/utils/notifyUtil'
import { CommuniClass } from '@/main/core/Request/Communi'

/** 串口通讯 */
export default class SerialPortRequest {
  path: string
  port!: SerialPort
  parser!: TransfromParser

  communi!: CommuniClass

  // 消息通知控制
  closeNotify = new NotifyUtil()
  errorNotify = new NotifyUtil()
  openErrNotify = new NotifyUtil()

  constructor(path: string, communi: CommuniClass) {
    this.path = path
    this.communi = communi
    this.created(this.path)
  }

  created(path: string) {
    logger.debug('创建串口', path)

    const port = new SerialPort(path, {
      baudRate: is.dev() ? 115200 : 921600
    })

    const parser = new TransfromParser({
      delimiter: agreement.getEnd()
    })
    port.pipe(parser)
    parser.on('data', buf => {
      this.errorNotify.notify()
      this.communi.onEmit(buf)
    })

    port.on('open', data => {
      logger.debug('串口触发open', data)
      this.openErrNotify.notify()
      this.closeNotify.notify(`${this.path} 重连成功`)
      sysLog.log(`${this.path} 链接成功`)
    })

    port.on('drain', data => {
      logger.warn('串口触发drain', data)
    })

    port.on('error', err => {
      logger.error('串口触发error', err)
      this.errorNotify.error(`${this.path} ${err.message}`)
    })

    port.on('close', err => {
      logger.warn('串口触发close', err)
      this.closeNotify.error(`${this.path} 连接断开`)
      sysLog.log(`${this.path} 链接断开`)
    })
    this.port = port
    this.parser = parser
    return
  }

  close() {
    if (this.port) {
      this.port.close()
    }
  }

  checkOpen() {
    logger.debug('port is open?', this.port.isOpen)
    if (!this.port.isOpen) {
      const path = this.port.path
      logger.warn(`串口${this.port.path}未开启，尝试开启`)
      this.port.open(err => {
        if (err) {
          logger.error(`${path} open Error`, err)
          this.openErrNotify.error(`${this.path}重连失败${err.message}`)
        }
      })
    }
  }

  /** 串口通讯 */
  post(buf: Buffer) {
    return new Promise((resolve, reject) => {
      this.port.write(buf, err => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  handleError() {
    this.checkOpen()
  }
}
