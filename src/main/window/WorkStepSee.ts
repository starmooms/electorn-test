import winManager from '../core/WinManager'

export default class WorkStepSee {
  path: string

  constructor(path: string) {
    this.path = path
    this.createdWin()
  }

  createdWin() {
    const winName = `port/WorkerSee/${encodeURIComponent(this.path)}`
    if (winManager.getWin(winName, true)) {
      return true
    }
    winManager.createdWin(winName, winName)
  }
}
