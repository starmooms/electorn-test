import createTcpClient, { TcpItem } from './TcpClient'
import { CommuniClass } from './Communi'
import logger from '../Logger'

/** Tcp通讯 */
export default class TcpRequest {
  ipList: TcpRequestT.IpItem[] = [
    { masterId: 0, ip: '192.168.0.200', port: 31111 }
  ]
  tcpMap = new Map<number, TcpItem>()
  parent: CommuniClass

  constructor(comuni: CommuniClass) {
    this.parent = comuni
  }

  created() {
    this.ipList.forEach(item => {
      const tcpItem = this.tcpMap.get(item.masterId)
      if (tcpItem && tcpItem.tcpClient.connecting) {
        return
      }
      this.tcpMap.set(
        item.masterId,
        createTcpClient(item, buf => {
          this.parent.onEmit(buf)
        })
      )
    })
  }

  /** 关闭通讯 */
  close() {
    logger.debug('关闭')
    this.tcpMap.forEach(item => {
      item.tcpClient.destroy()
    })
  }

  /** 串口通讯 */
  post(buf: Buffer, setError: any, masterId: number) {
    const tcpItem = this.tcpMap.get(masterId)
    if (tcpItem) {
      tcpItem.tcpClient.write(buf, err => {
        if (err) {
          setError(err)
        }
      })
    } else {
      setError(new Error(`机柜${masterId} 未初始化链接`))
    }
  }
}
