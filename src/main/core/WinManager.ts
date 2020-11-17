import { BrowserWindow } from 'electron'
import logger from './Logger'
import path from 'path'
import ipcManage from './IpcManage'

class WinManager {
  win: BrowserWindow | null = null
  winList = new Map<string, BrowserWindow>()

  constructor() {
    logger.info('init windManager')
  }

  getWin(name: string, show = false) {
    const hasWin = this.winList.get(name) || null
    if (hasWin && show) {
      hasWin.show()
    }
    return hasWin
  }

  closeOtherWin() {
    this.winList.forEach((value, key) => {
      if (key !== 'mainWin') {
        value.close()
      }
    })
  }

  // /** 关闭窗口前通知页面 */
  // beforeClose(win: BrowserWindow) {
  //   win.on('close', event => {
  //     event.preventDefault()
  //     ipcManage.send()
  //   })
  // }

  /**
   * 创建窗口
   * @param name 窗口名
   * @param pageUrl 路由
   */
  createdWin(
    name: string,
    pageUrl = '',
    opts: Electron.BrowserWindowConstructorOptions = {},
    setMenu = false
  ) {
    const hasWin = this.getWin(name, true)
    if (hasWin) return hasWin

    const devUrl = process.env.WEBPACK_DEV_SERVER_URL
    if (pageUrl) pageUrl = `#/${pageUrl}`
    if (!devUrl) pageUrl = `index.html${pageUrl}`

    const nowFous = BrowserWindow.getFocusedWindow()
    if (nowFous) {
      const [x, y] = nowFous.getPosition()
      const offset = this.winList.size * 20
      if (x > 0 && y > 0) {
        opts.x = x + offset
        opts.y = y + offset
      }
    }

    const win = new BrowserWindow({
      width: 1200 + 16,
      height: 880,
      // backgroundColor: '#2e2c29',
      webPreferences: {
        // backgroundThrottling: false,
        // preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean
      },
      ...opts
    })

    let protocolPath = `app://./`
    win.webContents.openDevTools()
    if (devUrl) {
      protocolPath = devUrl
      // if (!process.env.IS_TEST) {
      //   win.webContents.openDevTools()
      //   // https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/698
      //   // const finishLoadListener = () => {
      //   //   logger.info('reload ====>')
      //   //   win.webContents.reload()
      //   //   win.webContents.removeListener('did-finish-load', finishLoadListener)
      //   // }
      //   // win.webContents.on('did-finish-load', finishLoadListener)
      // }
    }

    if (setMenu !== true) {
      win.setMenu(null)
    }

    this.winList.set(name, win)

    win.loadURL(`${protocolPath}${pageUrl}`)
    win.on('closed', () => {
      this.winList.delete(name)
    })
    return win
  }
}

const winManager = new WinManager()

export default winManager
