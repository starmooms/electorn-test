import {
  app,
  protocol,
  BrowserWindow,
  dialog,
  powerSaveBlocker
} from 'electron'
import is from 'electron-is'
import USBManager from './core/USBManager'
import MenuManager from './core/MenuManager'
import winManager from './core/WinManager'
import ipcManage from './core/IpcManage'
import WorkStepSee from './window/WorkStepSee'
import createHistoryWin from './window/HistoryWin'
import UpdateManager from './core/UpdateManager'
import './core/ConfigManage'
import logger, { sysLognow, sysFilePath, createSysLog } from './core/Logger'
import mainDb from './core/sqlite/MainDb'
import configManage from './core/ConfigManage'
import boxManage from './core/boxManage/BoxManage'
import createSorting from './window/Sorting'

/** mainWin生成后执行 */
declare type beforeMainWin = () => void

export default class Launcher {
  win: BrowserWindow | null = null
  usbManager!: USBManager
  beforeMainWin: beforeMainWin | null = null
  updateManager = this.initUpdaterManager()

  constructor(beforeMainWin?: beforeMainWin) {
    if (beforeMainWin) {
      this.beforeMainWin = beforeMainWin
    }
    this.makeSingleInstance(() => {
      this.beforeWin()
      this.init()
    })
  }

  init() {
    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } }
    ])
    this.handleAppEvents()
    this.handleUpdaterEvents()
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
      app.on('second-instance', () => {
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
    this.win = winManager.createdWin('mainWin', undefined, undefined, true)
    this.win.on('close', event => {
      if (this.win) {
        event.preventDefault()
        dialog
          .showMessageBox({
            type: 'info',
            title: '关闭程序',
            message: '确定关闭程序',
            buttons: ['是', '否'],
            cancelId: 1
          })
          .then(({ response }) => {
            if (response === 0) {
              this.destoryWin()
            }
          })
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

  async beforeWin() {
    const menu = new MenuManager()
    menu.on('updateCheck', () => {
      if (this.updateManager) {
        this.updateManager.check()
      }
    })
    const id = powerSaveBlocker.start('prevent-app-suspension')

    createSysLog()
    ipcManage.handle('/sysLog/sysLogInfo', () => {
      return {
        start: sysLognow,
        filePath: sysFilePath
      }
    })

    ipcManage.on('/createdWin', (event, data: any) => {
      switch (data.type) {
        case 'channel':
          /** 查看通道 */
          new WorkStepSee(data.data, this.usbManager)
          break
        case 'history':
          createHistoryWin(data.data)
          break
        case 'sorting':
          createSorting()
          break
        default:
          throw new Error(`${data.type} win no defined`)
      }
    })

    // this.redisServer = RedisServer.getInstance()
    // this.redisServer.start().finally(() => {
    //   redisClient.initRedis()
    // })
    this.startRender()
  }

  afterWin() {
    // this.redisServer = RedisServer.getInstance()
    // this.redisServer.start().finally(() => {
    //   redisClient.initRedis()
    // })
  }

  async beforeWinRender() {
    try {
      const mainDbFilePath = (await mainDb.connect()) as string
      await boxManage.create()
      this.usbManager = new USBManager()
      // udpManage.start()
      return mainDbFilePath
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  startRender() {
    const handld = this.beforeWinRender()
    ipcManage.handle('/startRender', async () => {
      const mainData = await handld
      const userConfig = configManage.userConfig.store
      return {
        userConfig,
        mainData
      }
    })
  }

  async destoryWin(destroy = true) {
    try {
      this.win!.hide()
      if (this.usbManager) {
        this.usbManager.destory()
      }
      await mainDb.close()
      winManager.closeOtherWin()
    } catch (err) {
      dialog.showErrorBox('derstoryWin Error', err)
    } finally {
      if (destroy) {
        this.win!.destroy()
      }
      this.win = null
    }
  }

  initUpdaterManager() {
    if (is.mas()) {
      return
    }
    const updateManager = new UpdateManager({
      autoCheck: false,
      beforeQuit: () => {
        return this.destoryWin(false)
      }
    })
    this.handleUpdaterEvents()
    return updateManager
  }

  handleUpdaterEvents() {
    if (!this.updateManager) return

    this.updateManager.on('download-progress', (event: any) => {
      if (!this.win) return
      this.win.setProgressBar(event.percent / 100)
    })

    this.updateManager.on('update-downloaded', () => {
      if (!this.win) return
      this.win.setProgressBar(0)
    })
  }
}
