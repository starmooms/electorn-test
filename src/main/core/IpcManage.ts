import winManager from './WinManager'
import { dialog, ipcMain } from 'electron'

declare type EmitCb = (...args: any[]) => any

class IpcManage {
  emitList: any = {}

  constructor() {
    this.init()
  }

  init() {
    ipcMain.on('ipcManage:emit', (event, emitName, ...args) => {
      try {
        const cb = this.emitList[emitName]
        if (!cb) {
          throw `${emitName} NOT FIND`
        }
        cb(...args)
      } catch (err) {
        this.ipcError(err)
      }
    })
  }

  setEmit(emitName: string, cb: EmitCb) {
    this.emitList[emitName] = cb
  }

  removeEmit(emitName: string) {
    if (this.emitList[emitName]) {
      delete this.emitList[emitName]
    }
  }

  setSend(sendName: string, ...args: any[]) {
    const win = winManager.getWin('mainWin')
    if (win) {
      win.webContents.send('ipcManage:send', sendName, ...args)
    }
  }

  setHandle(name: string, listener: (...args) => any) {
    ipcMain.handle(name, (event, ...args) => {
      return listener(...args).then(data => {
        return {
          status: true,
          data
        }
      })
    })
  }

  ipcError(err: any) {
    const win = winManager.getWin('mainWin')
    const msg =
      typeof err === 'object'
        ? JSON.stringify({
            message: err.message,
            stask: err.stack
          })
        : err
    if (win) {
      win.webContents.send('errorMsg', msg)
    } else {
      dialog.showErrorBox('IPC Error', msg)
    }
  }
}

const ipcManage = new IpcManage()
export default ipcManage
