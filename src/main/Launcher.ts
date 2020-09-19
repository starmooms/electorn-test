import {
  app,
  protocol,
  BrowserWindow,
  dialog,
  powerSaveBlocker
} from 'electron'
import is from 'electron-is'
import USBManager from './core/USBManager'
import Update from './Update'
import MenuManager from './MenuManager'
import winManager from './core/WinManager'
import ipcManage from './core/IpcManage'
import WorkStepSee from './window/WorkStepSee'
import createHistoryWin from './window/HistoryWin'
import UpdateManager from './core/UpdateManager'
import SlaverTrend from './window/SlaverTrend'
import './core/ConfigManage'
import RedisServer from './core/redis/RedisServer'
import redisClient, { RedisClient } from './core/redis/RedisClient'
import logger from './core/Logger'
import mainDb from './core/sqlite/MainDb'

/** mainWin生成后执行 */
declare type beforeMainWin = () => void

export default class Launcher {
  win: BrowserWindow | null = null
  update: Update | null = null
  usbManager = this.initUSBManager()
  beforeMainWin: beforeMainWin | null = null
  updateManager = this.initUpdaterManager()
  redisServer!: RedisServer
  redisClient!: RedisClient

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
    this.win.on('close', event => {
      logger.info(winManager.winList)
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
    // setInterval(() => {
    //   logger.debug('powerSaveBlocker', powerSaveBlocker.isStarted(id), id)
    // }, 1000)
    // powerSaveBlocker.stop(id)
    await mainDb.connect()
    ipcManage.on('/createdWin', (event, data: any) => {
      switch (data.type) {
        case 'channel':
          /** 查看通道 */
          new WorkStepSee(data.data, this.usbManager)
          break
        case 'slaverTrend':
          new SlaverTrend(data.data, this.usbManager)
          break
        case 'history':
          createHistoryWin(data.data)
          break
        default:
          throw new Error(`${data.type} win no defined`)
      }
    })

    this.redisServer = RedisServer.getInstance()
    this.redisServer.start().finally(() => {
      redisClient.initRedis()
    })
  }

  afterWin() {
    // this.redisServer = RedisServer.getInstance()
    // this.redisServer.start().finally(() => {
    //   redisClient.initRedis()
    // })
  }

  async destoryWin(destroy = true) {
    try {
      this.win!.hide()
      if (this.usbManager) {
        this.usbManager.destory()
      }
      await redisClient.close()
      if (this.redisServer) {
        await this.redisServer.stop()
      }
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

  initUSBManager() {
    const usbManager = new USBManager()
    return usbManager
  }

  initUpdaterManager() {
    if (is.mas()) {
      return
    }

    // const enabled = this.configManager.getUserConfig('auto-check-update')
    // const lastTime = this.configManager.getUserConfig('last-check-update-time')
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
    // this.updateManager.on('checking', event => {
    //   this.menuManager.updateMenuItemEnabledState(
    //     'app.check-for-updates',
    //     false
    //   )
    //   this.trayManager.updateMenuItemEnabledState(
    //     'app.check-for-updates',
    //     false
    //   )
    //   this.configManager.setUserConfig('last-check-update-time', Date.now())
    // })

    this.updateManager.on('download-progress', (event: any) => {
      if (!this.win) return
      this.win.setProgressBar(event.percent / 100)
    })

    // this.updateManager.on('update-not-available', event => {
    //   // this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
    //   // this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
    // })

    this.updateManager.on('update-downloaded', () => {
      // this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      // this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
      if (!this.win) return
      this.win.setProgressBar(0)
    })

    // this.updateManager.on('will-updated', event => {
    //   // this.windowManager.setWillQuit(true)
    // })

    // this.updateManager.on('update-error', event => {
    //   this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
    //   this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
    // })
  }
}
