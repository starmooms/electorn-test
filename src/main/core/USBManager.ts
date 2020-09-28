import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import ipcManage from './IpcManage'
import { controlCode } from '@/shared/config/port'
import agreement from './Agreement'
import PortItem from './PortItem'
import configManage from './ConfigManage'
import logger, { sysLog } from './Logger'

export interface ArgeementData {
  buf: Buffer
  sId: string
}

export default class USBManager {
  cache = new Map<string, PortItem>()
  hasEvent = false
  stepList: any[] | null = null
  protPath!: string
  portItem!: PortItem

  constructor() {
    this.init()
  }

  init() {
    this.getPortPath()
    this.changePortPath()
    this.start()
    this.setSlaverStatus()
    this.writeSteps()
    this.readSteps()
    this.getPortList()
    this.setTranslate()
    this.setCal()
    this.readCal()
    this.getChannelList()
  }

  getPortPath() {
    const lastPortPath = this.protPath
    this.protPath = configManage.userConfig.get('base.portPath')
    if (this.protPath !== lastPortPath) {
      if (this.portItem) {
        this.portItem.close()
      }
      if (this.protPath) {
        this.portItem = new PortItem(this.protPath)
      }
    }
  }

  changePortPath() {
    configManage.userConfig.onDidChange('base', () => {
      this.getPortPath()
    })
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

  getPortData() {
    if (!this.portItem) {
      sysLog.info('串口未初始化')
      throw new Error('串口未初始化')
    }
    return this.portItem
  }

  /** 写工步 */
  writeSteps() {
    ipcManage.handle('/port/writeWorkSteps', (event, data) => {
      return this.getPortData().writeSteps(data)
    })
  }

  /** 读工步 */
  readSteps() {
    ipcManage.handle('/port/readWorkSteps', (event, data) => {
      return this.getPortData().readSteps(data)
    })
  }

  /** 设置从控状态 */
  setSlaverStatus() {
    ipcManage.handle('/port/slaver/setStatus', (event, data) => {
      return this.getPortData().setStatus(data)
    })
  }

  /** 开始/关闭读从控采样 */
  setTranslate() {
    ipcManage.handle(
      '/port/sampSetReadStatus',
      (event, data: ipcReq.SampReadStatus) => {
        const portItem = this.getPortData()
        if (data.status === true) {
          portItem.readSamp()
        } else {
          portItem.stopSamp()
        }
      }
    )
  }

  /** 设置校准 */
  setCal() {
    ipcManage.handle('/port/cal/set', async (event, data) => {
      return this.getPortData().setCal(data)
    })
  }

  /** 读校准 */
  readCal() {
    ipcManage.handle('/port/cal/read', async (event, data) => {
      return this.getPortData().readCal(data)
    })
  }

  /** 获取列表 */
  getChannelList() {
    ipcManage.handle('/port/channelList', async () => {
      logger.info(this.protPath)
      if (this.portItem) {
        return this.getPortData().getChannelList()
      } else {
        return []
      }
    })
  }
}
