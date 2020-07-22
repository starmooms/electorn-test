import { BrowserWindow } from 'electron'

class WinManager {
  win: BrowserWindow | null = null

  constructor() {}

  setWin(win: BrowserWindow) {
    this.win = win
  }

  getWin() {
    return this.win
  }
}

const winManager = new WinManager()

export default winManager
