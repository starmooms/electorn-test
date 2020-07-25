import { app, protocol, BrowserWindow, ipcMain, BrowserView } from 'electron'
import is from 'electron-is'
import USBManager from './core/USBManager'
import Update from './Update'
import MenuManager from './MenuManager'
import winManager from './core/WinManager'
import PortWindow from './window/portWindow'
import createWindow from './core/createdWinow'

/** 页面链接加载方法 */
declare type loadFun = (win: BrowserWindow) => void

export default class Launcher {
  win: BrowserWindow | null = null
  update: Update | null = null
  usbManager: USBManager | null = null

  constructor() {
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
    // this.win = new BrowserWindow({
    //   width: 800,
    //   height: 600,
    //   webPreferences: {
    //     nodeIntegration: (process.env
    //       .ELECTRON_NODE_INTEGRATION as unknown) as boolean
    //   }
    // })
    // if (this.loadFun) {
    //   this.loadFun(this.win)
    // }
    // this.afterWin()
    // this.win.on('closed', () => {
    //   this.win = null
    // })
  }

  /** 设置app开启相关回调并创建窗口 */
  handelAppReady() {
    app.on('ready', () => {
      // if (isDevelopment && !process.env.IS_TEST) {
      //   // 下载Vue调试工具
      //   try {
      //     // await installExtension(VUEJS_DEVTOOLS);
      //   } catch (e) {
      //     console.error('Vue Devtools failed to install:', e.toString())
      //   }
      // }
      this.win = createWindow()
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
      winManager.setWin(this.win)
      if (this.update) {
        this.update.setWin(this.win)
      }
      ipcMain.on('createdWin', (event, data: any) => {
        if (data && data.type) {
          if (data.type === 'portWin') {
            if (data.path) {
              new PortWindow(this.usbManager as USBManager, data.path)
            }
          }
        }
      })
    }
  }
}
