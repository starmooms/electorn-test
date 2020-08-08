import winManager from '../core/WinManager'

interface Opts {
  path: string
  slaverId: number
  channelId: number
}

export default class WorkStepSee {
  opts: Opts

  constructor(opts: Opts) {
    this.opts = opts
    this.createdWin()
  }

  createdWin() {
    const winName = `port/WorkerSee/${encodeURIComponent(this.opts.path)}/${
      this.opts.slaverId
    }/${this.opts.channelId}`
    if (winManager.getWin(winName, true)) {
      return true
    }
    winManager.createdWin(winName, winName)
  }
}
