import { ipcMain, ipcRenderer } from 'electron'
import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import winManager from './WinManager'
import * as iconv from 'iconv-lite'
import logger from './Logger'
import ipcManage from './IpcManage'

const Delimiter = SerialPort.parsers.Delimiter

export interface PortItem {
  port: SerialPort
  parser: SerialPort.parsers.Delimiter
}

export default class USBManager {
  cache = new Map<string, PortItem>()
  hasEvent = false

  constructor() {
    this.init()
  }

  init() {
    ipcMain.on('usbDetection', (event, data) => {
      if (data) {
        this.start()
      } else {
        this.destory()
      }
    })
    this.portWrite()
  }

  /** 开始监测USB */
  start() {
    this.sendList()
    if (this.hasEvent === false) {
      this.writePort()
      this.addEventUSBChange()
      this.hasEvent = true
    }
  }

  /** 结束监测USB */
  destory() {
    if (this.hasEvent === true) {
      this.cache.clear()
      usbDetection.stopMonitoring()
      ipcMain.removeHandler('writePort')
      this.hasEvent = false
    }
  }

  /** 发送列表 */
  async sendList() {
    const win = winManager.getWin('mainWin')
    if (win) {
      try {
        const list = await SerialPort.list()
        const keys = Object.keys(this.cache)
        if (keys.length > 0) {
          keys.forEach(key => {
            const has = list.find(item => item.path === key)
            if (!has) {
              this.cache.delete(key)
            }
          })
        }
        win.webContents.send('usbData', {
          type: 'list',
          list
        })
      } catch (err) {
        ipcManage.ipcError(err)
      }
    }
  }

  /** USB端口监听 */
  addEventUSBChange() {
    usbDetection.startMonitoring()
    usbDetection.on('change', () => {
      this.sendList()
    })
  }

  writePort() {
    ipcMain.handle('writePort', async (event, { path, data }) => {
      let portData = this.cache.get(path)
      console.log(3)
      if (!portData) {
        const port = new SerialPort(path, {
          baudRate: 115200
        })
        const parser = new Delimiter({
          delimiter: '\n'
        })

        port.pipe(parser)
        parser.on('data', msg => {
          logger.info(iconv.decode(msg, 'GBK'))
        })

        portData = { port, parser }
        this.cache.set(path, portData)
      }
      const status = portData.port.write(data, (s, d) => {
        console.log(s)
        console.log(d)
      })
      return status
    })
  }

  getPortData(path: string) {
    let portData = this.cache.get(path)
    if (!portData) {
      try {
        const port = new SerialPort(path, {
          baudRate: 115200
        })
        const parser = new Delimiter({
          delimiter: '\n'
        })
        port.pipe(parser)
        parser.on('data', buf => {
          const msg = iconv.decode(buf, 'GBK')
          logger.info(msg)
          ipcManage.setSend(`portData:${path}`, msg)
        })

        portData = { port, parser }
        this.cache.set(path, portData)
      } catch (err) {
        ipcManage.ipcError(err)
      }
    }
    return portData
  }

  portWrite() {
    ipcManage.setEmit('portWrite', (path: string, data: string) => {
      const portData = this.getPortData(path)
      if (portData) {
        portData.port.write(data)
      }
    })
  }
}
