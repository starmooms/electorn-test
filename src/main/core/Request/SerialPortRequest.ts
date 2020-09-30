import SerialPort from 'serialport'
import is from 'electron-is'

import agreement, { ReadResult } from '@/main/core/Agreement'
import logger, { sysLog } from '@/main/core/Logger'
import TransfromParser from '@/main/utils/transfromParser'
import NotifyUtil from '@/main/utils/notifyUtil'
import { CommuniEmitList } from '@/main/core/Request/Communi'

const SelfParser = TransfromParser

/** 窗口通讯 */
export default class SerialPortRequest {
  path: string
  port!: SerialPort
  parser!: TransfromParser

  emitList!: CommuniEmitList

  // 消息通知控制
  closeNotify = new NotifyUtil()
  errorNotify = new NotifyUtil()
  openErrNotify = new NotifyUtil()

  constructor(path: string, emitList) {
    this.path = path
    this.emitList = emitList
    this.created(this.path)
  }

  created(path: string) {
    logger.info('创建串口', path)
    const port = new SerialPort(path, {
      baudRate: is.dev() ? 115200 : 921600
    })
    const parser = new SelfParser({
      delimiter: agreement.getEnd()
    })
    port.pipe(parser)
    parser.on('data', buf => {
      logger.info('串口返回数据', buf.toString('hex'))
      this.errorNotify.notify()

      const result = agreement.readData(buf)
      if (this.emitList.has(result.sId)) {
        const fun = this.emitList.get(result.sId)
        if (fun) fun(result)
        this.emitList.delete(result.sId)
        return
      }
      logger.warn(`流水号回调${result.sId} 不存在`)
    })

    port.on('open', data => {
      logger.info('串口触发open', data)
      this.openErrNotify.notify()
      this.closeNotify.notify(`${this.path} 重连成功`)
      sysLog.log(`${this.path}链接成功`)
    })

    port.on('error', err => {
      logger.warn('串口触发error', err)
      this.errorNotify.error(`${this.path} ${err.message}`)
    })

    port.on('close', err => {
      logger.warn('串口触发close', err)
      this.closeNotify.error(`${this.path} 连接断开`)
      sysLog.log(`${this.path}链接断开`)
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
    logger.info('port is open?', this.port.isOpen)
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
  post(buf: Buffer, setError: any) {
    const status = this.port.write(buf, err => {
      if (err) {
        logger.error(err)
        setError(`Writer_Error ${err.message}`)
      }
    })
    logger.info('port write', buf.toString('hex'))
    logger.info('write Status', status)
  }
}
