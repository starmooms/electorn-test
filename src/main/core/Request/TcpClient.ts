import logger from '../Logger'
import net from 'net'
import { TransfromModel } from '@/main/utils/transfromParser'
import { EventEmitter } from 'events'

// interface TcpClientParams {
//   ip: string
//   port: number
//   onData: (buf: Buffer) => any
//   onEnd?: () => any
//   onError?: (err: Error) => any
// }

// declare type TcpClientParamsP = Partial<Pick<TcpClient>>
declare type TcpClientParams = Pick<TcpClient, 'ip' | 'port' | 'masterId'> // & TcpClientParamsP

export default class TcpClient extends EventEmitter {
  ip: string
  port: number
  masterId: number
  tcpClient!: net.Socket
  isConnect = false
  masterInfo: any
  transfromModel = new TransfromModel(this.onData.bind(this))
  timer: NodeJS.Timeout | null = null
  clientId = 0

  constructor({ ip, port, masterId }: TcpClientParams) {
    super()
    this.masterId = masterId
    this.ip = ip
    this.port = port
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

  /** 链接成功返回Promsie */
  waitConnect() {
    return new Promise<null>((resolve, reject) => {
      if (this.isConnect) {
        resolve(null)
        return
      }
      this.tcpClient.once('connect', resolve)
      this.tcpClient.once('error', reject)
      setTimeout(() => {
        this.tcpClient.removeListener('connect', resolve)
        this.tcpClient.removeListener('connect', reject)
        reject('connect Time Out')
      }, 3000)
    })
  }

  /** 关闭连接 */
  close() {
    return new Promise<null>((resolve, reject) => {
      logger.debug(`${this.ip} is destoryed`, this.tcpClient.destroyed)
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
          reject(`TcpClient close has Error ${this.ip} ${hasError}`)
        }
        resolve(null)
      })
    })
  }
}

export declare type TcpItem = ReturnType<TcpClient['createTcpClient']>
