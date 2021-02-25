import { resolve } from 'path'
import { EventEmitter } from 'events'
import is from 'electron-is'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import logger from './Logger'
import { dialogWin } from '@/main/utils'

if (is.dev()) {
  autoUpdater.updateConfigPath = resolve(__dirname, 'latest.yml')
}

// const uploadUrl = process.env.VUE_APP_UPLOADURL
// if (uploadUrl) {
//   autoUpdater.setFeedURL(uploadUrl)
// }

interface Options {
  autoCheck?: boolean
  beforeQuit?: () => any
}

export default class UpdateManager extends EventEmitter {
  updater = autoUpdater
  autoCheckData = {
    checkEnable: false,
    userCheck: false
  }
  beforeQuit!: Options['beforeQuit']

  constructor(options: Options = {}) {
    super()
    this.updater.autoDownload = false
    this.updater.logger = logger
    this.beforeQuit = options.beforeQuit
    this.autoCheckData.checkEnable = options.autoCheck || false
    this.init()
  }

  init() {
    this.updater.on('checking-for-update', this.checkingForUpdate.bind(this))
    this.updater.on('update-available', this.updateAvailable.bind(this))
    this.updater.on('update-not-available', this.updateNotAvailable.bind(this))
    this.updater.on('download-progress', this.updateDownloadProgress.bind(this))
    this.updater.on('update-downloaded', this.updateDownloaded.bind(this))
    this.updater.on('error', this.updateError.bind(this))

    if (this.autoCheckData.checkEnable) {
      this.autoCheckData.userCheck = false
      this.updater.checkForUpdates()
    }
  }

  check() {
    this.autoCheckData.userCheck = true
    this.updater.checkForUpdates()
  }

  checkingForUpdate() {
    this.emit('checking')
  }

  async updateAvailable(event: Event, info: UpdateInfo) {
    this.emit('update-available', info)
    const { response } = await dialogWin.showMessageBox({
      type: 'info',
      title: '检查更新',
      message: '发现新版本，是否现在更新？',
      buttons: ['是', '否'],
      cancelId: 1
    })
    if (response === 0) {
      this.updater.downloadUpdate()
    }
  }

  updateNotAvailable(event: Event, info: UpdateInfo) {
    this.emit('update-not-available', info)
    if (this.autoCheckData.userCheck) {
      dialogWin.showMessageBox({
        title: '检查更新',
        message: '已是最新版'
      })
    }
  }

  updateDownloadProgress(event: any) {
    this.emit('download-progress', event)
  }

  async updateDownloaded(event, info) {
    this.emit('update-downloaded', info)
    this.updater.logger!.info(`Update Downloaded: ${info}`)

    await dialogWin.showMessageBox({
      title: '检查更新',
      message: '更新下载完成，应用程序将退出并开始更新'
    })

    this.emit('will-updated')
    setImmediate(async () => {
      if (this.beforeQuit) {
        await this.beforeQuit()
      }
      this.updater.quitAndInstall()
    })
  }

  updateError(event, error) {
    this.emit('update-error', error)
    const msg =
      error == null ? '检查更新失败' : (error.stack || error).toString()
    this.updater.logger!.warn(`update-error: ${msg}`)
    dialogWin.showErrorBox('检查更新错误', msg)
  }
}
