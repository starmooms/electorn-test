import './core/connect/childTcp'
import debug from 'electron-debug'
import { app, BrowserWindow } from 'electron'
const isDevelopment = process.env.NODE_ENV !== 'production'

console.log(process.versions)

if (isDevelopment) {
  debug()

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

  ;(async () => {
    await app.whenReady()
    if (isDevelopment && !process.env.IS_TEST) {
      try {
        if (process.env.VUE_DEV_TOOL) {
          BrowserWindow.addDevToolsExtension(process.env.VUE_DEV_TOOL)
        }
        // await installExtension(VUEJS_DEVTOOLS); // 下载Vue调试工具
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }
  })()
}

require('./background')
