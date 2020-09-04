import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import ipcManage from './IpcManage'
import { controlCode } from '@/shared/config/port'
import agreement from './Agreement'
import PortItem from './PortItem'

export interface ArgeementData {
  buf: Buffer
  sId: string
}

export default class USBManager {
  cache = new Map<string, PortItem>()
  hasEvent = false
  stepList: any[] | null = null

  constructor() {
    this.init()
  }

  init() {
    this.start()
    this.setSlaverStatus()
    this.writeSteps()
    this.readSteps()
    this.getPortList()
    this.setTranslate()
    this.setCal()
    this.readCal()
    this.getChannelList()
    this.setMasterMode()
  }

  /** 开始监测USB */
  start() {
    if (this.hasEvent === false) {
      this.addEventUSBChange()
      this.hasEvent = true
    }
  }

  /** 结束监测USB */
  destory() {
    if (this.hasEvent === true) {
      this.cache.forEach(portItem => {
        portItem.stopTranslate()
      })
      this.cache.clear()
      usbDetection.stopMonitoring()
      this.hasEvent = false
    }
  }

  /** 获取串口列表 */
  getPortList() {
    ipcManage.on('/port/getPortList', () => {
      this.sendList()
    })
  }

  /** 发送列表 */
  sendList() {
    ipcManage.send('/port/sendList', async () => {
      const list = await SerialPort.list()
      list.forEach(item => {
        item['readTranslate'] = false
      })
      const keys = Object.keys(this.cache)
      if (keys.length > 0) {
        keys.forEach(key => {
          const listItem = list.find(item => item.path === key)
          if (!listItem) {
            this.cache.delete(key)
          } else {
            const portItem = this.cache.get(key)
            if (portItem) {
              listItem['readTranslate'] = portItem.translateReadNow
            }
          }
        })
      }
      return { list }
    })
  }

  /** USB端口监听 */
  addEventUSBChange() {
    usbDetection.startMonitoring()
    usbDetection.on('change', () => {
      this.sendList()
    })
  }

  getPortData(path: string) {
    let portItem = this.cache.get(path)
    if (!portItem) {
      portItem = new PortItem(path)
      this.cache.set(path, portItem)
    }
    return portItem
  }

  /** 写工步 */
  writeSteps() {
    ipcManage.handle('/port/writeWorkSteps', (event, data: any) => {
      return this.getPortData(data.path).writeSteps(data)
    })
  }

  /** 读工步 */
  readSteps() {
    ipcManage.handle('/port/readWorkSteps', async (event, data: any) => {
      return await this.getPortData(data.path).readSteps(data)
    })
  }

  /** 设置从控状态 */
  setSlaverStatus() {
    ipcManage.handle('/port/slaver/setStatus', (event, data: any) => {
      const protItem = this.getPortData(data.path)
      return protItem.setStatus(data)
    })
  }

  /** 开始/关闭读从控采样 */
  setTranslate() {
    ipcManage.handle('/port/translateSet', (event, data) => {
      const portItem = this.getPortData(data.path)
      if (data.status === true) {
        portItem.readTranslate()
      } else {
        portItem.stopTranslate()
      }
    })
  }

  /** 设置校准 */
  setCal() {
    ipcManage.handle('/port/cal/set', async (event, data: any) => {
      const portItem = this.getPortData(data.path)
      return await portItem.setCal(data)
    })
  }

  /** 读校准 */
  readCal() {
    ipcManage.handle('/port/cal/read', async (event, data: any) => {
      const portItem = this.getPortData(data.path)
      return await portItem.readCal(data)
    })
  }

  /** 获取列表 */
  getChannelList() {
    ipcManage.handle('/port/channelList', async (event, data: any) => {
      const portItem = this.getPortData(data.path)
      return await portItem.getChannelList(data)
    })
  }

  // 主控模式
  /** 设置保护参数 */
  setMasterMode() {
    ipcManage.handle(
      '/port/masterMode',
      async (event, path: string, type: string, data: any) => {
        const portItem = this.getPortData(data.path)
        if (!portItem.masterMode[type]) {
          throw new Error(`fun ${type} undefined`)
        }
        return await portItem.masterMode[type](data)
      }
    )
  }
}
