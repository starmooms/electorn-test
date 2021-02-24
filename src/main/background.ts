import { app, protocol } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import Launcher from './Launcher'

const isDevelopment = process.env.NODE_ENV !== 'production'
app.allowRendererProcessReuse = false

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

const launch = new Launcher()

if (!isDevelopment) {
  launch.on('beforeMainWin', () => {
    createProtocol('app')
  })
}

launch.init()
