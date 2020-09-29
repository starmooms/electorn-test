import net from 'net'
import logger from '../Logger'

export default class TcpClient {
  constructor() {
    this.init()
  }

  init() {
    // '192.168.0.201', 5002
    const tcpServer = net.createServer(socket => {
      logger.info('链接成功')
      socket.on('data', data => {
        logger.info('tcpserver 收到数据', data.toString('hex'))
        socket.write(Buffer.from('你好', 'utf-8'))
      })
      socket.on('end', () => {
        logger.info('关闭tcpServer')
      })
    })
    tcpServer.listen(5002, '192.168.0.201')

    let tcpClient: net.Socket | null = null
    const a = () => {
      tcpClient = net.createConnection(32222, '192.168.0.200')
      tcpClient.on('data', data => {
        logger.info('tcpClient 收到数据', data.toString('hex'))
      })
      tcpClient.on('end', () => {
        logger.info('tpc client end')
      })
      tcpClient.on('error', err => {
        logger.error('TCP Client Error', err)
      })
    }
    let i = 0
    a()
    setInterval(() => {
      i++
      if (i % 5 === 0 && tcpClient) {
        logger.info('销毁')
        tcpClient.destroy()
        tcpClient = null
      } else if (!tcpClient) {
        logger.info('重建tcp')
        a()
      } else if (tcpClient) {
        tcpClient.write(Buffer.from('你好', 'utf-8'))
      }
    }, 2000)
  }
}
