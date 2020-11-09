import TcpClient from './TcpClient'
import { CommuniClass } from './Communi'
import logger from '../Logger'
import configManage from '../ConfigManage'
import { CALTOOL_ID } from '@/shared/config/calibrate'

/** Tcp通讯 */
export default class TcpRequest {
  ipList: TcpRequestT.IpItem[] = []
  tcpMap = new Map<number, TcpClient>()
  tcpIpMap = new Map<string, TcpClient>()
  parent: CommuniClass
  calToolClient: TcpClient | null = null

  constructor(comuni: CommuniClass) {
    this.parent = comuni
  }

  /** 创建Tcp链接 */
  private createClient(ip: string, masterId: number) {
    const clientItem = new TcpClient({
      ip,
      masterId,
      port: 31111
    })
    clientItem.on('data', buf => {
      this.parent.onEmit(buf)
    })
    return clientItem
  }

  /** 创建机柜Tcp */
  private createMasterClient(ip: string, masterId: number) {
    if (this.tcpMap.has(masterId)) {
      logger.debug('masterId:${masterId} Duplicate link')
      throw new Error(`masterId:${masterId} Duplicate link`)
    }
    const clientItem = this.createClient(ip, masterId)
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
            const newTcpItem = this.createMasterClient(item.ip, item.masterId)
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
  }

  /** 关闭中位机通讯 */
  close() {
    this.tcpMap.forEach(item => {
      this.closeTcpItem(item.masterId)
    })
  }

  /** 中位机通讯 */
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

  /** 创建校准Tcp链接 */
  async createCalTool(ip: string) {
    if (this.calToolClient) {
      if (this.calToolClient.isConnect && this.calToolClient.ip === ip) return
      await this.calToolClose()
    }
    this.calToolClient = this.createClient(ip, CALTOOL_ID)
    await this.calToolClient.waitConnect()
    return
  }

  /** 校准工装通讯 */
  calToolPost(buf: Buffer, setError: any) {
    const tcpItem = this.calToolClient
    if (tcpItem) {
      tcpItem.tcpClient.write(buf, err => {
        if (err) {
          setError(err)
        }
      })
    } else {
      setError(new Error(`工装 未初始化链接`))
    }
  }

  /** 校准工装关闭链接 */
  async calToolClose() {
    if (this.calToolClient) {
      const oldClient = this.calToolClient
      this.calToolClient = null
      await oldClient.close()
    }
  }
}
