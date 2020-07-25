import { BrowserWindow } from 'electron'

export default function createWindow(path = '') {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: (process.env
        .ELECTRON_NODE_INTEGRATION as unknown) as boolean
    }
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    console.log(process.env.WEBPACK_DEV_SERVER_URL)

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
