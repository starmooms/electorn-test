import logger from '../Logger'
import net from 'net'

export default function createTcpClient(
  ipItem: TcpRequestT.IpItem,
  onData: (buf: Buffer) => any
) {
  const tcpClient = net.createConnection(ipItem.port, ipItem.ip)
  const info = `TcpClient 机柜${ipItem.masterId} ${ipItem.ip}:${ipItem.port}`
  tcpClient.on('data', data => {
    logger.debug(`${info} Data`, data.toString('hex'))
    onData(data)
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
  return {
    ...ipItem,
    tcpClient
  }
}

export declare type TcpItem = ReturnType<typeof createTcpClient>
