import TcpClient from './TcpClient'
import { CommuniClass } from './Communi'
import logger from '../Logger'
import configManage from '../ConfigManage'

/** Tcp通讯 */
export default class TcpRequest {
  ipList: TcpRequestT.IpItem[] = []
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
    clientItem.on('data', buf => {
      this.parent.onEmit(buf)
    })
    // this.tcpIpMap.set(ip, clientItem)
    this.tcpMap.set(masterId, clientItem)
    return clientItem
  }

  /** 关闭tcp，删除map对象 */
  async closeTcpItem(masterId: number) {
    const tcpItem = this.tcpMap.get(masterId)
    if (tcpItem) {
      await tcpItem.close()
      this.tcpMap.delete(masterId)
    }
    return tcpItem
  }

  /** 根据ipList，创建连接 */
  async createdConnect() {
    this.ipList = configManage.userConfig.get('ipList')
    const promiseArr: Promise<any>[] = []
    const masterList = this.ipList.map(item => {
      const tcpItem = this.tcpMap.get(item.masterId)
      if (!tcpItem || tcpItem.ip !== item.ip || !tcpItem.isConnect) {
        promiseArr.push(
          (async () => {
            await this.closeTcpItem(item.masterId)
            const newTcpItem = this.createTcpClient(item.ip, item.masterId)
            try {
              await newTcpItem.waitConnect()
            } catch (err) {
              logger.error('createdConnect Error', err)
            }
          })()
        )
      }
      return item.masterId
    })
    this.tcpMap.forEach((value, masterId) => {
      if (!masterList.includes(masterId)) {
        promiseArr.push(this.closeTcpItem(masterId))
      }
    })
    await Promise.all(promiseArr)
    // this.ipList.forEach(item => {
    //   const ip = item.ip
    //   this.createTcpClient(ip, item.masterId)

    //   // const tcpItem = this.tcpMap.get(item.masterId)
    //   // if (tcpItem && tcpItem.tcpClient.connecting) {
    //   //   return
    //   // }

    //   // const tcpClient = createTcpClient(item, {
    //   //   onData: buf => {
    //   //     this.parent.onEmit(buf)
    //   //   }
    //   // })
    //   // this.tcpMap.set(
    //   //   item.masterId,
    //   //   createTcpClient(item, {
    //   //     onData: buf => {
    //   //       this.parent.onEmit(buf)
    //   //     }
    //   //   })
    //   // )
    // })
  }

  /** 关闭通讯 */
  close() {
    this.tcpMap.forEach(item => {
      this.closeTcpItem(item.masterId)
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

  /** 获取连接状态 */
  getClientStatus(masterId: number): IpConfigT.MasterInfo['status'] {
    let status = 1
    const tcpClient = this.tcpMap.get(masterId)
    if (tcpClient) {
      status = tcpClient.isConnect ? 2 : 3
    }
    return status
  }

  getClient(masterId: number) {
    return this.tcpMap.get(masterId)
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
