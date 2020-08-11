import winManager from './WinManager'
import {
  dialog,
  ipcMain,
  IpcMainEvent,
  IpcMainInvokeEvent,
  BrowserWindow
} from 'electron'

declare type EmitCb = (...args: any[]) => any
declare type onListener = (event: IpcMainEvent, ...args: any[]) => void
declare type handListener = (
  event: IpcMainInvokeEvent,
  ...args: any[]
) => Promise<void> | any

class IpcManage {
  emitList: any = {}

  constructor() {
    this.init()
  }

  init() {
    // ipcMain.on('ipcManage:emit', (event, emitName, ...args) => {
    //   try {
    //     const cb = this.emitList[emitName]
    //     if (!cb) {
    //       throw `${emitName} NOT FIND`
    //     }
    //     cb(...args)
    //   } catch (err) {
    //     this.ipcError(err)
    //   }
    // })
  }

  // setEmit(emitName: string, cb: EmitCb) {
  //   this.emitList[emitName] = cb
  // }

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
    ipcMain.handle(name, async (event, ...args) => {
      try {
        return listener(...args).then(data => {
          return {
            status: true,
            data
          }
        })
      } catch (err) {
        console.log(err)
        this.ipcError(err)
      }
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

  on(eventName: string, listener: onListener) {
    ipcMain.on(eventName, async (event, ...args: any[]) => {
      try {
        await listener(event, ...args)
      } catch (err) {
        this.ipcError(err)
      }
    })
  }

  handle(eventName: string, listener: handListener) {
    ipcMain.handle(eventName, async (event, ...args: any[]) => {
      try {
        const data = await listener(event, ...args)
        return {
          status: true,
          data: data || null
        }
      } catch (err) {
        this.ipcError(err)
      }
    })
  }

  async send(channel: string, cb: any, win?: BrowserWindow) {
    try {
      const data = await cb()
      if (!win) {
        const mainWin = winManager.getWin('mainWin')
        if (!mainWin) {
          throw new Error('Window Not Found')
        }
        win = mainWin
      }
      win.webContents.send(channel, data)
    } catch (err) {
      this.ipcError(err)
    }
  }
}

const ipcManage = new IpcManage()
export default ipcManage
