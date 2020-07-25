'use strict'

import { app, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
// import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import Launcher from './Launcher'

const isDevelopment = process.env.NODE_ENV !== 'production'
app.allowRendererProcessReuse = true

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

  app.whenReady().then(async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      // 下载Vue调试工具
      try {
        // await installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }
  })
} else {
  createProtocol('app')
}

new Launcher()
