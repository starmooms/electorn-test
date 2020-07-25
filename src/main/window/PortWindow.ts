import { BrowserView, BrowserWindow, ipcMain } from 'electron'
import USBManager, { PortItem } from '../core/USBManager'
import iconv from 'iconv-lite'
import createWindow from '../core/createdWinow'

export default class PortWindow {
  usbManager: USBManager
  path: string
  win?: BrowserWindow
  portItem: PortItem

  constructor(usbManager: USBManager, path: string) {
    this.usbManager = usbManager
    this.path = path
    this.portItem = this.getPortItem()
    if (this.portItem) {
      this.win = this.initWin()
    }
  }

  getPortItem() {
    return this.usbManager.getPortData(this.path)
  }

  initWin() {
    ipcMain.on('write', (event, data: string) => {
      this.portItem.port.write(data)
    })
    ipcMain.handle('getPort', event => {
      return this.portItem.port
    })
    const win = createWindow(
      `portItem/${encodeURIComponent(this.portItem.port.path)}`
    )
    this.portItem.parser.on('data', buf => {
      win.webContents.send('data', iconv.decode(buf, 'GBK'))
    })
    win.on('close', () => {
      ipcMain.removeHandler('getPort')
    })
    return win
  }
}
