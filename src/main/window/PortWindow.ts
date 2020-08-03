import { BrowserWindow, ipcMain } from 'electron'
import USBManager, { PortItem } from '../core/USBManager'
import iconv from 'iconv-lite'
import winManager from '../core/WinManager'

export default class PortWindow {
  usbManager: USBManager
  path: string
  win?: BrowserWindow
  portItem?: PortItem

  constructor(usbManager: USBManager, path: string) {
    this.usbManager = usbManager
    this.path = path
    this.portItem = this.getPortItem()
    this.win = this.initWin()
  }

  getPortItem() {
    return this.usbManager.getPortData(this.path)
  }

  initWin() {
    if (this.portItem) {
      const portPath = this.portItem.port.path
      const writeEvent = `write:${portPath}`
      const getPortEvent = `getPort:${portPath}`
      const portDataEvent = `portData:${portPath}`
      ipcMain.on(writeEvent, (event, data: string) => {
        if (this.portItem) {
          this.portItem.port.write(data)
        }
      })
      ipcMain.handle(getPortEvent, () => {
        if (this.portItem) {
          const prot = this.portItem.port
          return {
            path: prot.path
          }
        }
      })

      const win = winManager.createdWin(
        `portItem/${portPath}`,
        `portItem/${encodeURIComponent(portPath)}`
      )
      this.portItem.parser.on('data', buf => {
        console.log(iconv.decode(buf, 'GBK'))
        win.webContents.send(portDataEvent, iconv.decode(buf, 'GBK'))
      })
      win.on('close', () => {
        ipcMain.removeHandler(getPortEvent)
        ipcMain.removeAllListeners(writeEvent)
      })
      return win
    }
  }
}
