import { BrowserWindow } from 'electron'
import logger from './Logger'
import ipcManage from './IpcManage'

/** 窗口销毁参数 */
interface DestoryOpts {
  destory?: boolean // 更新时，不主动关闭窗口
}
/** 窗口关闭回调参数 */
interface CloseOpts extends DestoryOpts {
  name: string
}
/** 窗口关闭前回调 */
declare type CloseNext = (opts?: DestoryOpts) => Promise<unknown>

/** 窗口Map设置 */
interface WinItemConf {
  win: BrowserWindow
  beforeClose?: (next: CloseNext) => any
}

/** 窗口Map */
interface WinItem extends WinItemConf {
  isSendClose: boolean
}

/** 关闭窗口回调Map */
interface CloseMapItem {
  cb: (value?: unknown) => void
  closeOpts: CloseOpts
}

interface CreateWinParams {
  name: string
  pageUrl: string
  winOpts?: Electron.BrowserWindowConstructorOptions
  setMenu?: boolean
  beforeClose?: WinItem['beforeClose']
}

class WinManager {
  win: BrowserWindow | null = null
  winList = new Map<string, WinItem>()
  closeId = 0
  closeMap = new Map<string, CloseMapItem>()

  init() {
    this.handleDestory()
  }

  getWin(name: string, show = false) {
    const hasItem = this.winList.get(name)
    const win = hasItem ? hasItem.win : null
    if (win && show) {
      win.show()
    }
    return win
  }

  /** 关闭除主窗口外所有窗口 */
  closeOtherWin() {
    this.winList.forEach((value, key) => {
      if (key !== 'mainWin') {
        value.win.close()
      }
    })
  }

  private handleCloseWin({ name, destory }: CloseOpts) {
    const winItem = this.winList.get(name)
    if (!winItem) return

    winItem.isSendClose = true
    const win = winItem.win
    if (win && destory !== false) {
      win.destroy()
    }
    this.closeMap.delete(name)
  }

  /** 监听页面发送过来的销毁事件 */
  handleDestory() {
    ipcManage.on('/win/closed', (event, { winName }) => {
      const hasClose = this.closeMap.get(winName)
      if (hasClose) {
        const { cb, closeOpts } = hasClose
        this.handleCloseWin(closeOpts)
        cb()
      }
    })
  }

  /** 关闭窗口，等待窗口关闭后返回 */
  closeWin(closeOpts: CloseOpts) {
    const winName = closeOpts.name
    const win = this.getWin(winName)
    return new Promise(resolve => {
      // if (!win) {
      //   throw new Error(`window name '${winName}' undefined`)
      // }

      if (win) {
        const hasClose = this.closeMap.get(winName)
        if (hasClose) {
          this.handleCloseWin(closeOpts)
          return resolve()
        }

        // win.hide()
        this.closeMap.set(winName, {
          cb: resolve,
          closeOpts: closeOpts
        })
        ipcManage.send('/win/close', { winName }, win)
      }
    })
  }

  /** 设置win */
  setWinList(name: string, winItem: WinItemConf) {
    const win = winItem.win

    win.on('closed', () => {
      this.winList.delete(name)
    })

    /** 设置通知页面关闭 */
    win.on('close', event => {
      const winItem = this.winList.get(name)
      if (winItem && winItem.isSendClose === false) {
        event.preventDefault()

        const next = (opts: DestoryOpts = {}) => {
          return this.closeWin({ name, ...opts })
        }

        if (winItem.beforeClose) {
          winItem.beforeClose(next)
        } else {
          next()
        }
      }
    })

    this.winList.set(name, {
      ...winItem,
      isSendClose: false
    })
  }

  /**
   * 创建窗口
   * @param name 窗口名
   * @param pageUrl 路由
   */
  createdWin(createOpts: CreateWinParams) {
    const defatulOpts = {
      setMenu: false,
      winOpts: {} as Electron.BrowserWindowConstructorOptions
    }
    const opts = {
      ...defatulOpts,
      ...createOpts
    }

    const { name, winOpts, setMenu, beforeClose } = opts
    let pageUrl = opts.pageUrl

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
        winOpts.x = x + offset
        winOpts.y = y + offset
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
      ...winOpts
    })

    let protocolPath = `app://./`
    if (devUrl) {
      protocolPath = devUrl
      // if (!process.env.IS_TEST) {
      //   win.webContents.openDevTools()
      // }
    }

    if (setMenu !== true) {
      win.setMenu(null)
    }

    win.loadURL(`${protocolPath}${pageUrl}`)
    this.setWinList(name, { win, beforeClose })
    return win
  }
}

const winManager = new WinManager()

export default winManager
