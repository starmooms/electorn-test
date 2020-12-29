import winManager from './WinManager'
import {
  dialog,
  ipcMain,
  IpcMainEvent,
  IpcMainInvokeEvent,
  BrowserWindow
} from 'electron'
import logger from './Logger'
import { ErrorEnum } from '@/shared/config/handleError'

declare type SendCb = () => any
declare type onListener = (event: IpcMainEvent, ...args: any[]) => void
declare type handListener = (
  event: IpcMainInvokeEvent,
  ...args: any[]
) => Promise<void> | any

class IpcManage {
  emitList: any = {}

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
      win.webContents.send('errorMsg', 'msg', msg)
    } else {
      dialog.showErrorBox('IPC Error', msg)
    }
  }

  ipcNotify(opts: any, win?: BrowserWindow) {
    if (!win) {
      const mainWin = winManager.getWin('mainWin')
      if (mainWin) {
        win = mainWin
      }
    }
    if (win) {
      win.webContents.send('errorMsg', 'notify', opts)
    } else {
      dialog.showErrorBox('IPC Error', opts.message)
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
        let msg = typeof err === 'string' ? err : ''
        if (!msg) {
          switch (err.nameInfo) {
            case ErrorEnum.TipsError:
              msg = err.message
              break
            case ErrorEnum.TcpError:
              msg = err.message
              logger.error(err)
              break
            default:
              logger.error('handle 未知错误', err)
              msg = err.message // 未知错误
              break
          }
        }
        return {
          status: false,
          error: msg
        }
      }
    })
  }

  removeHandler(channel: string) {
    ipcMain.removeHandler(channel)
  }

  send(channel: string, data: any, win?: BrowserWindow) {
    try {
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
    winManager.winList.forEach(winItem => {
      winItem.win.webContents.send('commomMsg', channel, ...args)
    })
  }
}

const ipcManage = new IpcManage()
export default ipcManage
