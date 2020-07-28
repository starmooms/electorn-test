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
  createdWin(name: string, path = '', beforeLoad?: any) {
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
      const [x, y] = nowFous.getPosition()
      opts.x = x + 20
      opts.y = y + 20
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
      if (!process.env.IS_TEST) win.webContents.openDevTools()
    }

    this.winList.set(name, win)
    if (beforeLoad) beforeLoad();
    win.loadURL(`${protocolPath}${path}`)
    win.on('close', () => {
      this.winList.delete(name)
    })
    return win
  }
}

const winManager = new WinManager()

export default winManager
