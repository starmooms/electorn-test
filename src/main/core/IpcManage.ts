import winManager from './WinManager'
import {
  dialog,
  ipcMain,
  IpcMainEvent,
  IpcMainInvokeEvent,
  BrowserWindow
} from 'electron'
import logger from './Logger'

declare type SendCb = () => any
declare type onListener = (event: IpcMainEvent, ...args: any[]) => void
declare type handListener = (
  event: IpcMainInvokeEvent,
  ...args: any[]
) => Promise<void> | any

class IpcManage {
  emitList: any = {}

  // constructor() {}

  ipcError(err: any, win?: BrowserWindow) {
    if (!win) {
      const mainWin = winManager.getWin('mainWin')
      if (mainWin) {
        win = mainWin
      }
    }
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

  handle(channel: string, listener: handListener) {
    ipcMain.handle(channel, async (event, ...args: any[]) => {
      try {
        const data = await listener(event, ...args)
        return {
          status: true,
          data: data || null
        }
      } catch (err) {
        logger.warn('handle错误', err)
        return {
          status: false,
          error: err
        }
      }
    })
  }

  removeHandler(channel: string) {
    ipcMain.removeHandler(channel)
  }

  async send(channel: string, cb: SendCb, win?: BrowserWindow) {
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
      this.ipcError(err, win)
    }
  }

  commonMsg(channel: string, ...args: any[]) {
    winManager.winList.forEach(win => {
      win.webContents.send('commomMsg', channel, ...args)
    })
  }
}

const ipcManage = new IpcManage()
export default ipcManage
