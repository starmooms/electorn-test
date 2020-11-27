'use strict'
import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import Launcher from './Launcher'
import './core/connect/childTcp'
import logger from './core/Logger'

const isDevelopment = process.env.NODE_ENV !== 'production'
app.allowRendererProcessReuse = false

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let beforeMainWin: (() => void) | undefined = () => {
  createProtocol('app')
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  // tcpServe()

  logger.info(process.versions)

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

  beforeMainWin = void 0
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
