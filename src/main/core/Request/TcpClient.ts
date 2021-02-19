import logger from '../Logger'
import net from 'net'
import { TransfromModel } from '@/main/utils/transfromParser'
import { EventEmitter } from 'events'
import { RequestStatus } from './Communi'
import handleError from '@/shared/config/handleError'

declare type TcpClientParams = Pick<TcpClient, 'ip' | 'port' | 'masterId'>

export default class TcpClient extends EventEmitter {
  ip: string
  port: number
  masterId: number
  tcpClient!: net.Socket
  isConnect = false
  masterInfo: any
  transfromModel!: TransfromModel
  timer: NodeJS.Timeout | null = null
  clientId = 0

  constructor({ ip, port, masterId }: TcpClientParams) {
    super()
    this.masterId = masterId
    this.ip = ip
    this.port = port
    this.init()
  }

  init() {
    this.transfromModel = new TransfromModel(this.onData.bind(this))
    this.createTcpClient()
  }

  /** 连接失败定时重连 */
  timeOutConnect() {
    this.timeClear()
    this.timer = setTimeout(() => {
      logger.warn(`Tcpclient ${this.ip} Reconnection`)
      this.createTcpClient()
    }, 20000)
  }

  /** 清除定时重连 */
  timeClear() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
    }
  }

  /** 触发数据返回 */
  onData(buf: Buffer) {
    this.emit('data', buf)
    return true
  }

  /** 创建连接 */
  async createTcpClient() {
    if (this.tcpClient) {
      await this.close()
    }
    const clientId = this.clientId
    const tcpClient = net.createConnection(this.port, this.ip)
    const info = `TcpClient ${this.masterId} ${this.ip}:${this.port}`
    tcpClient.on('data', data => {
      // logger.debug(`${info} Data`, data.toString('hex'))
      this.transfromModel.transform(data)
    })
    tcpClient.on('end', data => {
      logger.debug(`${info} End`, data.toString('hex'))
    })
    tcpClient.on('error', err => {
      logger.error(`${info} Error`, err)
    })
    tcpClient.on('connect', () => {
      this.isConnect = true
      // tcpClient.setKeepAlive(true, 2000)
      logger.debug(`${info} 链接成功`)
    })
    tcpClient.on('close', () => {
      this.isConnect = false
      logger.debug(`${info} 断开链接`)
      if (this.clientId === clientId) {
        this.timeOutConnect()
      }
    })
    this.tcpClient = tcpClient
    return tcpClient
  }

  /** 如果未连接，连接后发送 */
  async waitWrite(buf: Buffer, status: RequestStatus) {
    const onError = (msg: string) => {
      if (status.isWait) {
        throw new Error(msg)
      }
    }
    try {
      if (!this.isConnect) {
        if (!this.tcpClient.connecting) {
          await this.createTcpClient()
        }
        await this.waitConnect()
      }

      if (!status.isWait) return
      this.tcpClient.write(buf, err => {
        if (err) {
          onError(err.message)
        }
      })
    } catch (err) {
      onError(err.message || err)
    }
    return
  }

  /** 链接成功返回Promsie */
  waitConnect() {
    return new Promise<null>((resolve, reject) => {
      if (this.isConnect) {
        return resolve(null)
      }
      let timeOut: any = null
      let onSuccess: any = null
      const onError = (err: Error) => {
        this.tcpClient.removeListener('connect', onSuccess)
        clearTimeout(timeOut)
        reject(err)
      }
      onSuccess = () => {
        this.tcpClient.removeListener('error', onError)
        clearTimeout(timeOut)
        resolve(null)
      }

      this.tcpClient.once('connect', onSuccess)
      this.tcpClient.once('error', onError)
      timeOut = setTimeout(() => {
        this.tcpClient.removeListener('connect', onSuccess)
        this.tcpClient.removeListener('error', onError)
        reject(new handleError.TcpError(`${this.ip} connect Time Out`))
      }, 3000)
    })
  }

  /** 关闭连接 */
  close() {
    return new Promise<null>((resolve, reject) => {
      logger.debug(`${this.ip} is emit close`)
      this.clientId += 1
      this.timeClear()
      if (!this.tcpClient.destroyed) {
        this.tcpClient.destroy()
      }
      if (!this.isConnect) {
        resolve(null)
        return
      }
      this.tcpClient.once('close', hasError => {
        if (hasError) {
          reject(
            new handleError.TcpError(
              `TcpClient close has Error ${this.ip} ${hasError}`
            )
          )
        }
        resolve(null)
      })
    })
  }
}

export declare type TcpItem = ReturnType<TcpClient['createTcpClient']>
