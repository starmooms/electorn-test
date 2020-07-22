import { ipcMain } from 'electron'
import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import winManager from './WinManager'
import { Port } from '@/types/Port'

const Readline = SerialPort.parsers.Readline

// interface PortItem {
//   port: SerialPort
//   parser: typeof Readline
// }

export default class USBManager {
  cache = new Map<string, Port.Item>()
  hasEvent = false

  constructor() {
    this.init()
  }

  init() {
    ipcMain.on('usbDetection', (event, data) => {
      console.log('usbDetection', data, this.hasEvent)
      if (data === this.hasEvent) {
        if (this.hasEvent === true) {
          this.sendList()
        }
        return
      }
      if (data) {
        this.start()
      } else {
        this.destory()
      }
    })
  }

  /** 开始监测USB */
  start() {
    this.hasEvent = true
    this.addEventUSBChange()
    this.writePort()
    this.sendList()
  }

  /** 结束监测USB */
  destory() {
    usbDetection.stopMonitoring()
    ipcMain.removeHandler('writePort')
    this.cache.clear()
    this.hasEvent = false
  }

  /** 发送列表 */
  async sendList() {
    const win = winManager.getWin()
    if (win) {
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
      if (!portData) {
        const port = new SerialPort(path, {
          baudRate: 115200
        })
        const parser = new Readline({ delimiter: '\n' })
        port.pipe(parser)
        parser.on('data', msg => {
          console.log(msg.toString())
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
}
