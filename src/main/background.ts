'use strict'
import { app, protocol } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import Launcher from './Launcher'

const isDevelopment = process.env.NODE_ENV !== 'production'
app.allowRendererProcessReuse = false

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

const beforeMainWin: (() => void) | undefined = isDevelopment
  ? () => createProtocol('app')
  : undefined

new Launcher(beforeMainWin)
