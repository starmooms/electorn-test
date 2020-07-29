import winManager from './WinManager'
import { dialog, ipcMain } from 'electron'

class IpcManage {
  emitList: any = {}

  constructor() {
    this.init()
  }

  init() {
    ipcMain.on('ipcManage:emit', (event, emitName, ...args) => {
      const cb = this.emitList[emitName]
      if (cb) {
        cb(...args)
      } else {
        this.ipcError(`${emitName} NOT FIND`)
      }
    })
  }

  setEmit(emitName: string, cb: any) {
    this.emitList[emitName] = cb
  }

  setSend(sendName: string, ...args: any[]) {
    const win = winManager.getWin('mainWin')
    if (win) {
      win.webContents.send('ipcManage:send', sendName, ...args)
    }
  }

  ipcError(err: any) {
    const win = winManager.getWin('mainWin')
    const msg = typeof err === 'object' ? JSON.stringify(err) : err
    if (win) {
      win.webContents.send('errorMsg', msg)
    } else {
      dialog.showErrorBox('IPC Error', msg)
    }
  }
}

const ipcManage = new IpcManage()
export default ipcManage
