import dgram from 'dgram'
import logger, { sysLog } from '../Logger'
import os from 'os'
import TcpClient from './TcpClient'

class UdpManage {
  constructor() {
    this.init()
  }

  getIp() {
    const ifaces = os.networkInterfaces()
    let ip = ''
    const ipStart = '192.168'
    logger.log(ifaces)
    Object.entries(ifaces).forEach(data => {
      if (!ip && data[1]) {
        const hasIface = data[1].find(item => {
          if (item.family === 'IPv4' && !item.internal) {
            return true
          }
        })
        if (hasIface) {
          ip = hasIface.address
        }
      }
    })
    if (!ip) {
      throw new Error(`找不到符合${ipStart} 的ip`)
    }
    logger.info(ip)
    return ip
  }

  /** 发送广播服务 */
  postUdpServer() {
    const udpServer = dgram.createSocket('udp4')
    udpServer.on('error', err => {
      logger.error(`postUdpServer Error`, err)
    })
    udpServer.on('message', function(data, rinfo) {
      logger.error('postUdpServer data', data, rinfo)
    })
    udpServer.bind(() => {
      udpServer.setBroadcast(true)
      setInterval(() => {
        logger.info('发送广播')
        udpServer.send(Buffer.from([0x00]), 31111, '255.255.255.255')
      }, 5000)
    })
  }

  /** 接收中位机返回ip的udp服务 */
  clientUpdServer(ip: string, port: number) {
    try {
      const udpServer = dgram.createSocket('udp4')
      udpServer.on('listening', () => {
        logger.log('clientUpdServer listen', udpServer.address())
        setInterval(() => {
          udpServer.send(JSON.stringify(udpServer.address()), 2000, ip)
        }, 2000)
      })

      //接收消息
      udpServer.on('message', function(msg, rinfo) {
        const strmsg = msg.toString('hex')
        logger.info(rinfo)
        logger.info('udpserver data', strmsg, rinfo.port, rinfo.address)
      })

      //错误处理
      udpServer.on('error', function(err) {
        logger.error('clientUpdServer Error', err)
      })

      udpServer.bind(port, ip)
    } catch (err) {
      logger.info('clientUpdServer Error', err)
    }
  }

  init() {
    // this.clientUpdServer('192.168.42.13', 31111)
    this.clientUpdServer('192.168.0.201', 32222)
    this.postUdpServer()
  }

  start() {
    console.log('astart')
  }
}

const udpManage = new UdpManage()

export default udpManage
