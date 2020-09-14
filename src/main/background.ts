'use strict'
import {
  app,
  protocol,
  BrowserWindow,
  powerMonitor,
  powerSaveBlocker
} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
// import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import Launcher from './Launcher'
import logger from './core/Logger'
import debug from 'debug'

// try {
//   const d = debug
//   d.log = logger.info.bind(logger)
// } catch (err) {
//   logger.error(err)
// }

// const log2 = debug('serialport/stream')
// log.log = (...args) => {
//   logger.info(...args)
// }
// log2.log = (...args) => {
//   logger.info(...args)
// }
// error.log = (...args) => {
//   logger.error(...args)
// }

const isDevelopment = process.env.NODE_ENV !== 'production'
app.allowRendererProcessReuse = true

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let beforeMainWin: any = () => {
  createProtocol('app')
}
// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }

  beforeMainWin = null
  app.whenReady().then(async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      // 下载Vue调试工具
      try {
        console.log(process.env.VUE_DEV_TOOL)
        if (process.env.VUE_DEV_TOOL) {
          BrowserWindow.addDevToolsExtension(process.env.VUE_DEV_TOOL)
        }
        // await installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }
  })
} else {
  // app.whenReady().then(() => {
  //   createProtocol('app')
  // })
}

new Launcher(beforeMainWin)
