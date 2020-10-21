import logger from '../Logger'
import net from 'net'

// interface TcpClientParams {
//   ip: string
//   port: number
//   onData: (buf: Buffer) => any
//   onEnd?: () => any
//   onError?: (err: Error) => any
// }

// declare type TcpClientParamsP = Partial<Pick<TcpClient>>
declare type TcpClientParams = Pick<TcpClient, 'ip' | 'port' | 'masterId'> // & TcpClientParamsP

export default class TcpClient {
  ip: string
  port: number
  masterId: number
  tcpClient: net.Socket

  constructor({ ip, port, masterId }: TcpClientParams) {
    this.masterId = masterId
    this.ip = ip
    this.port = port
    this.tcpClient = this.createTcpClient()
  }

  createTcpClient() {
    const tcpClient = net.createConnection(this.port, this.ip)
    const info = `TcpClient ${this.ip}:${this.port}`
    tcpClient.on('data', data => {
      logger.debug(`${info} Data`, data.toString('hex'))
      // if (this.onData) {
      //   this.onData(data)
      // }
    })
    tcpClient.on('end', data => {
      logger.debug(`${info} End`, data.toString('hex'))
    })
    tcpClient.on('error', err => {
      logger.error(`${info} Error`, err)
    })
    tcpClient.on('connect', () => {
      logger.debug(`${info} 链接成功`)
    })
    tcpClient.on('close', () => {
      logger.debug(`${info} 断开链接`)
    })
    return tcpClient
  }
}

export declare type TcpItem = ReturnType<TcpClient['createTcpClient']>
