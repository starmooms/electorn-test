import winManager from '../core/WinManager'
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
    const { slaverId, masterId, channelId } = this.opts
    const winName = 'nowChannel'
    const winPath = `nowChannel/${masterId}/${slaverId}/${channelId}`
    const hasWin = winManager.getWin(winName, true)
    if (hasWin) {
      hasWin.webContents.send('/channel/channelPosition', {
        masterId,
        slaverId,
        channelId
      })
      return
    }
    winManager.createdWin({
      name: winName,
      pageUrl: winPath
    })
  }
}
