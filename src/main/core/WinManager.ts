import { BrowserWindow, BrowserWindowProxy } from 'electron'

class WinManager {
  win: BrowserWindow | null = null
  winList = new Map<string, BrowserWindow>()

  // constructor() {}

  getWin(name: string, show = false) {
    const hasWin = this.winList.get(name)
    if (hasWin) {
      if (show) {
        hasWin.show()
      }
      return hasWin
    }
    return null
  }

  /**
   * 创建窗口
   * @param name 窗口名
   * @param path 路由
   */
  createdWin(name: string, path = '') {
    const hasWin = this.getWin(name, true)
    if (hasWin) {
      return hasWin
    }

    const devUrl = process.env.WEBPACK_DEV_SERVER_URL
    if (path) {
      path = `#/${path}`
    }
    if (!devUrl) {
      path = `index.html${path}`
    }

    const opts: Electron.BrowserWindowConstructorOptions = {}
    const nowFous = BrowserWindow.getFocusedWindow()
    if (nowFous) {
      const offset = this.winList.size * 20
      const [x, y] = nowFous.getPosition()
      opts.x = x + offset
      opts.y = y + offset
    }

    const win = new BrowserWindow({
      width: 800,
      height: 600,
      // backgroundColor: '#2e2c29',
      webPreferences: {
        nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean
      },
      ...opts
    })

    let protocolPath = `app://./`
    if (devUrl) {
      protocolPath = devUrl
    }

    this.winList.set(name, win)
    win.loadURL(`${protocolPath}${path}`).then(() => {
      if (devUrl && !process.env.IS_TEST) {
        win.webContents.openDevTools()
      }
    })
    win.on('close', () => {
      this.winList.delete(name)
    })
    return win
  }

  
}

const winManager = new WinManager()

export default winManager
