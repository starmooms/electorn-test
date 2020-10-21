import TcpClient from './TcpClient'
import { CommuniClass } from './Communi'
import logger from '../Logger'

/** Tcp通讯 */
export default class TcpRequest {
  ipList: TcpRequestT.IpItem[] = [{ ip: '192.168.0.200', masterId: 0 }]
  tcpMap = new Map<number, TcpClient>()
  tcpIpMap = new Map<string, TcpClient>()
  parent: CommuniClass

  constructor(comuni: CommuniClass) {
    this.parent = comuni
  }

  createTcpClient(ip: string, masterId: number) {
    if (this.tcpMap.has(masterId)) {
      logger.debug('masterId:${masterId} Duplicate link')
      throw new Error(`masterId:${masterId} Duplicate link`)
    }
    const clientItem = new TcpClient({
      ip,
      masterId,
      port: 31111
    })
    clientItem.tcpClient.on('data', buf => {
      this.parent.onEmit(buf)
    })
    this.tcpIpMap.set(ip, clientItem)
    this.tcpMap.set(masterId, clientItem)
    return clientItem
  }

  created() {
    this.ipList.forEach(item => {
      const ip = item.ip
      this.createTcpClient(ip, item.masterId)

      // const tcpItem = this.tcpMap.get(item.masterId)
      // if (tcpItem && tcpItem.tcpClient.connecting) {
      //   return
      // }

      // const tcpClient = createTcpClient(item, {
      //   onData: buf => {
      //     this.parent.onEmit(buf)
      //   }
      // })
      // this.tcpMap.set(
      //   item.masterId,
      //   createTcpClient(item, {
      //     onData: buf => {
      //       this.parent.onEmit(buf)
      //     }
      //   })
      // )
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

  /** 测试链接 */
  // testConnect() {}

  /** 获取ip列表 */
  getIpList() {
    // const list: IpConfigT.IpTcpItem[] = [
    // ]
    // this.tcpMap.forEach(item => {
    // })
  }

  // /** 获取ip的主控信息 */
  // getMasterInfo(ip: string) {
  //   let clientItem = this.tcpIpMap.get(ip)
  //   if (!clientItem) {
  //     clientItem = this.createTcpClient(ip)
  //   }
  // }
}
