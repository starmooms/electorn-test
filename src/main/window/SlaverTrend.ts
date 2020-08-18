import winManager from '../core/WinManager'
import ipcManage from '../core/IpcManage'
import USBManager from '../core/USBManager'

interface Opts {
  path: string
  slaverId: number
  masterId: number
}

export default class SlaverTrend {
  opts: Opts
  usbManager: USBManager

  constructor(opts: Opts, usbManager: USBManager) {
    this.opts = opts
    this.usbManager = usbManager
    this.createdWin()
  }

  createdWin() {
    const { path, slaverId, masterId } = this.opts
    const basePath = `${encodeURIComponent(path)}/${masterId}/${slaverId}`
    const winName = `port/SlaverTrend/${basePath}`
    const portItem = this.usbManager.getPortData(path)

    if (winManager.getWin(winName, true)) {
      return true
    }

    if (!portItem) {
      throw new Error(`串口 ${path} 不存在`)
    }
    const win = winManager.createdWin(winName, winName)

    /** 读采样 */
    const closeTranslate = portItem.emitTranslate({
      masterId,
      winName
    })

    win.on('closed', () => {
      closeTranslate()
    })
  }
}
