import dgram from 'dgram'
import logger, { sysLog } from '../Logger'
import os, { NetworkInterfaceInfoIPv4 } from 'os'

class UdpManage {
  constructor() {
    this.init()
  }

  init() {
    const udpServer = dgram.createSocket('udp4')
    const ifaces = os.networkInterfaces()
    logger.info(ifaces)
    let ip = ''
    const ipStart = '192.168'
    Object.entries(ifaces).forEach(data => {
      if (!ip && data[1]) {
        const hasIface = data[1].find(item => {
          if (item.family === 'IPv4' && item.address.indexOf(ipStart) >= 0) {
            return true
          }
        })
        if (hasIface) {
          ip = hasIface.address
        }
      }
    })

    if (!ip) {
      return sysLog.info(`找不到符合${ipStart} 的ip`)
    }

    // 监听端口
    udpServer.on('listening', function() {
      logger.info(`udp server linstening`, udpServer.address())
    })

    //接收消息
    udpServer.on('message', function(msg, rinfo) {
      const strmsg = msg.toString('hex')
      logger.info(strmsg, rinfo.port, rinfo.address)
    })

    //错误处理
    udpServer.on('error', function(err) {
      logger.error('udp error', err)
      // udpServer.close()
    })
    udpServer.bind(5001, ip)
  }

  start() {
    console.log('astart')
  }
}

const udpManage = new UdpManage()

export default udpManage
