import winManager from '../core/WinManager'
import ipcManage from '../core/IpcManage'
import USBManager from '../core/USBManager'
import logger from '../core/Logger'

interface Opts {
  path: string
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
    const { path, slaverId, channelId } = this.opts
    const basePath = `${encodeURIComponent(path)}/${slaverId}/${channelId}`
    const winName = `port/WorkerSee/${basePath}`
    if (winManager.getWin(winName, true)) {
      return true
    }
    const portItem = this.usbManager.getPortData(path)
    if (!portItem) {
      return false
    }

    /** 读工步 */
    const getStepChannel = `getWorkerStep/${basePath}`
    ipcManage.handle(getStepChannel, async () => {
      const portItem = this.usbManager.getPortData(this.opts.path)
      return await portItem.readSteps({
        channelId,
        slaverId
      })
    })
    const win = winManager.createdWin(winName, winName)

    /** 读采样 */
    const closeTranslate = portItem.emitTranslate({
      masterId: 0,
      winName
    })

    win.on('closed', () => {
      ipcManage.removeHandler(getStepChannel)
      closeTranslate()
    })
  }
}
