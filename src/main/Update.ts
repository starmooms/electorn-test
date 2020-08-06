import { BrowserWindow, NetLog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import winManager from './core/WinManager'

const uploadUrl = process.env.VUE_APP_UPLOADURL

export default class Update {
  private win: BrowserWindow | null = null
  private updater: typeof autoUpdater

  constructor() {
    this.updater = autoUpdater
    this.init()
  }

  init() {
    if (uploadUrl) {
      this.updater.setFeedURL(uploadUrl)
    }

    const message = {
      error: '检查更新出错',
      checking: '正在检查更新……',
      updateAva: 'startUpdate', //'检测到新版本，正在下载……',
      updateNotAva: 'noUpdate' //'现在使用的就是最新版本，不用更新',
    }
    const sendMsg = (type: keyof typeof message) => {
      return () => {
        this.sendUpdateMessage(message[type])
      }
    }

    this.updater.on('checking-for-update', sendMsg('checking'))
    this.updater.on('update-available', sendMsg('updateAva'))
    this.updater.on('update-not-available', sendMsg('updateNotAva'))
    this.updater.on('download-progress', event => {
      this.sendUpdateMessage(event, 'downloadProgress')
    })
    this.updater.on('error', (event, error) => {
      this.sendUpdateMessage(JSON.stringify(error), 'updateError')
    })

    // 下载完成
    this.updater.on('update-downloaded', (event, info) => {
      // 重启更新
      ipcMain.on('isUpdateNow', (event, msg) => {
        if (msg === 'isUpdateNow') {
          this.sendUpdateMessage('开始重启更新')
          // //some code here to handle event
          autoUpdater.quitAndInstall()
        }
      })

      this.sendUpdateMessage(info, 'downloaded')
    })
  }

  setWin() {
    this.win = winManager.getWin('mainWin')
  }

  sendUpdateMessage(msg: string, type = 'updateMsg') {
    if (this.win) {
      log.info('', type, msg)
      this.win.webContents.send(type, msg)
    } else {
      log.info('no win')
    }
  }

  checkUpdate() {
    this.setWin()
    if (this.win) {
      this.updater.checkForUpdates()
    } else {
      console.log('no win')
    }
  }
}
