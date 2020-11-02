import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import ipcManage from './IpcManage'
// import PortItem from './PortItem'
import boxManage from './boxManage/BoxManage'

export interface ArgeementData {
  buf: Buffer
  sId: string
}

export default class USBManager {
  // cache = new Map<string, PortItem>()
  hasEvent = false
  stepList: any[] | null = null
  protPath!: string
  // portItem!: PortItem

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
    this.setLamp()
    this.setMasterInfo()
    this.getChannelList()
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

  /** 写工步 */
  writeSteps() {
    ipcManage.handle('/port/writeWorkSteps', (event, data) => {
      return boxManage.boxStatus.writeSteps(data)
    })
  }

  /** 读工步 */
  readSteps() {
    ipcManage.handle('/port/readWorkSteps', (event, data) => {
      return boxManage.boxStatus.readSteps(data)
    })
  }

  /** 设置从控状态 */
  setSlaverStatus() {
    ipcManage.handle('/port/slaver/setStatus', (event, data) => {
      return boxManage.boxStatus.setStatus(data)
    })
  }

  /** 开始/关闭读从控采样 */
  setTranslate() {
    ipcManage.handle(
      '/port/sampSetReadStatus',
      (event, data: ipcReq.SampReadStatus) => {
        if (data.status === true) {
          boxManage.boxSamp.sampSetRead()
        } else {
          boxManage.boxSamp.sampSetStopRead()
        }
      }
    )
  }

  /** 设置校准 */
  setCal() {
    // // 设置校准
    // ipcManage.handle('/port/cal/set', async (event, data) => {
    //   return boxManage.boxCal.setCal(data)
    // })
    // // 读校准
    // ipcManage.handle('/port/cal/read', async (event, data) => {
    //   return boxManage.boxCal.readCal(data)
    // })

    // 读校准
    ipcManage.handle('/port/cal/start', async (event, data) => {
      return boxManage.boxCal.start(data)
    })
  }

  /** 设置点灯 */
  setLamp() {
    ipcManage.handle('/port/lamp/set', async (event, data) => {
      return boxManage.boxLamp.setLamp(data)
    })
  }

  /** 获取ip列表 */
  setMasterInfo() {
    ipcManage.handle('/port/masterInfo/ipList', async () => {
      return boxManage.boxMasterInfo.getIpList()
    })
    ipcManage.handle('/port/masterInfo/delIp', async (event, data) => {
      return boxManage.boxMasterInfo.delIpItem(data)
    })
    ipcManage.handle('/port/masterInfo/refreshConnect', async () => {
      return boxManage.boxMasterInfo.refreshConnect()
    })
    ipcManage.handle('/port/masterInfo/set', async (event, data) => {
      return boxManage.boxMasterInfo.setMasterInfo(data)
    })
  }

  /** 获取列表 */
  getChannelList() {
    ipcManage.handle('/port/channelList', async () => {
      return boxManage.getChannelList()
    })
  }
}
