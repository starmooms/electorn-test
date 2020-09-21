import winManager from '../core/WinManager'
import ipcManage from '../core/IpcManage'
import USBManager from '../core/USBManager'

interface Opts {
  path: string
  masterId: number
  slaverId: number
  channelId: number
}

export default class WorkStepSee {
  opts: Opts
  usbManager: USBManager

  constructor(opts: Opts, usbManager: USBManager) {
    this.opts = opts
    this.usbManager = usbManager
    this.createdWin()
  }

  createdWin() {
    const { path, slaverId, masterId, channelId } = this.opts
    const basePath = `${encodeURIComponent(path)}/${masterId}/${slaverId}`
    const winName = 'nowChannel'
    const winPath = `nowChannel/0/0/0`
    winManager.createdWin(winName, winPath)
    // const winName = `port/WorkerSee/${basePath}`
    // if (winManager.getWin(winName, true)) {
    //   return true
    // }
    // const portItem = this.usbManager.getPortData(path)
    // if (!portItem) {
    //   return false
    // }

    // const win = winManager.createdWin(winName, `${winName}/${channelId}`)

    // /** 读采样 */
    // const closeTranslate = portItem.emitTranslate({
    //   masterId,
    //   slaverId,
    //   winName
    // })

    // win.on('closed', () => {
    //   closeTranslate()
    // })
  }
}
