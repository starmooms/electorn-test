import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  BrowserView,
  ipcRenderer
} from 'electron'
import is from 'electron-is'
import USBManager from './core/USBManager'
import Update from './Update'
import MenuManager from './MenuManager'
import winManager from './core/WinManager'
import PortWindow from './window/portWindow'
import ipcManage from './core/IpcManage'
import WorkStepSee from './window/WorkStepSee'

/** mainWin生成后执行 */
declare type beforeMainWin = () => void

export default class Launcher {
  win: BrowserWindow | null = null
  update: Update | null = null
  usbManager: USBManager | null = null
  beforeMainWin: beforeMainWin | null = null

  constructor(beforeMainWin?: beforeMainWin) {
    if (beforeMainWin) {
      this.beforeMainWin = beforeMainWin
    }
    this.beforeWin()
    this.makeSingleInstance(() => {
      this.init()
    })
  }

  init() {
    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } }
    ])
    this.handleAppEvents()
  }

  /** 绑定app的回调 */
  handleAppEvents() {
    this.handelAppReady()
    this.handelAppClose()
  }

  /** 程序锁定，避免开启多个程序 */
  makeSingleInstance(callback: () => void) {
    if (is.mas()) {
      callback && callback()
      return
    }

    const canLock = app.requestSingleInstanceLock()

    if (!canLock) {
      app.quit()
    } else {
      app.on('second-instance', (event, argv, workingDirectory) => {
        if (this.win) {
          if (this.win.isMinimized()) {
            this.win.restore()
          }
          this.win.focus()
        }
      })

      callback && callback()
    }
  }

  /** 创建窗口 */
  createWindow() {
    if (this.beforeMainWin) {
      this.beforeMainWin()
    }
    this.win = winManager.createdWin('mainWin')
    this.win.on('closed', () => {
      this.win = null
      if (this.usbManager) {
        this.usbManager.destory()
      }
    })
    return this.win
  }

  /** 设置app开启相关回调并创建窗口 */
  handelAppReady() {
    app.on('ready', () => {
      this.createWindow()
      this.afterWin()
    })

    app.on('activate', () => {
      // mac 关闭重新打开
      if (this.win === null) {
        this.createWindow()
      }
    })
  }

  /** 设置app关闭相关回调 */
  handelAppClose() {
    app.on('window-all-closed', () => {
      if (!is.macOS()) {
        app.quit()
      }
    })
  }

  beforeWin() {
    this.update = new Update()
    new MenuManager(this.update)
  }

  afterWin() {
    this.usbManager = new USBManager()
    if (this.win) {
      ipcManage.setEmit('/createdWin/port/workerSee', (data: any) => {
        new WorkStepSee(data)
      })

      ipcMain.on('createdWin', (event, data: any) => {
        if (!data || !data.type) return
        switch (data.type) {
          case 'portWin':
            if (data.path) {
              if (winManager.getWin(`portItem/${data.path}`, true)) {
                return
              }
              new PortWindow(this.usbManager as USBManager, data.path)
            }
            break
        }
      })
    }
  }
}
