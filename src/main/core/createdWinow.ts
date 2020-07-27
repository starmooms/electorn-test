import { BrowserWindow, BrowserView } from 'electron'

let mainWin: BrowserWindow | null = null
export default function createWindow(path = '') {
  if (path) {
    path = `#${path}`
  }
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: (process.env
        .ELECTRON_NODE_INTEGRATION as unknown) as boolean
    }
  })
  mainWin = win
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    console.log(process.env.WEBPACK_DEV_SERVER_URL + path)

    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + path)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    if (!path) {
      path = 'index.html'
    }
    win.loadURL(`app://./${path}`)
  }
  return win
}

export function createWin(path: string) {
  if (mainWin && path) {
    const view = new BrowserView()
    path += `#${path}`
    mainWin.setBrowserView(view)
    view.setBounds({ x: 20, y: 20, width: 300, height: 300 })
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      console.log(process.env.WEBPACK_DEV_SERVER_URL + path)
      view.webContents.loadURL(process.env.WEBPACK_DEV_SERVER_URL + path)
    } else {
      view.webContents.loadURL(`app://./${path}`)
    }
  }
}
