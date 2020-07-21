import { ipcMain } from "electron"
import SerialPort from "serialport"
import usbDetection from "usb-detection"
import winManager from "./WinManager"
import { stat } from 'fs'

const ByteLength = SerialPort.parsers.ByteLength
console.log("ByteLength", ByteLength)

interface portItem {
  port: SerialPort
  parser: SerialPort.parsers.ByteLength
}

export default class USBManager {

  cache: any = {}
  hasEvent = false

  constructor() {
    this.init()
  }

  init() {
    ipcMain.on("usbDetection", (event, data) => {
      console.log("usbDetection", data, this.hasEvent)
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
    ipcMain.removeHandler("writePort")
    this.cache = {}
    this.hasEvent = false
  }

  /** 发送列表 */
  async sendList() {
    const win = winManager.getWin()
    if (win) {
      const list = await SerialPort.list()
      win.webContents.send("usbData", {
        type: "list",
        list
      })
    }
  }

  /** USB端口监听 */
  addEventUSBChange() {
    usbDetection.startMonitoring();
    usbDetection.on('change', (device) => {
      console.log("触发 change")
      this.sendList()
    });
  }

  writePort() {
    ipcMain.handle("writePort", async (event, { path, data }) => {
      let portData = this.cache[path]
      if (!portData) {
        const port = new SerialPort(path, {
          baudRate: 115200
        })
        const parser = new ByteLength({ length: 16 })
        port.pipe(parser)
        parser.on('data', (msg) => {
          // console.log(msg)
          console.log("======>")
          console.log(msg.toString())
          console.log(" end ======>")
        })
        portData = { port, parser }
        this.cache[path] = portData
      }
      const status = (portData as portItem).port.write(data)
      return status
    })
  }


}