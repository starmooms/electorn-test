import { EventEmitter } from 'events'
import Electron, { app, Menu, shell } from 'electron'
import { logPath } from '@/main/core/Logger'
import createCalibrate from './window/Calibrate'

const APP_VERSON = app.getVersion()

export default class MenuManager extends EventEmitter {
  constructor() {
    super()
    this.init()
  }

  init() {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: '帮助',
        submenu: [
          {
            label: '日志',
            click: () => {
              shell.showItemInFolder(logPath)
            }
          },
          {
            label: '更新',
            accelerator: 'CmdOrCtrl+U',
            click: () => {
              this.updateCheck()
            }
          },
          {
            type: 'separator'
          },
          {
            label: '通道校准',
            click: () => {
              createCalibrate()
            }
          },
          {
            type: 'separator'
          },
          {
            label: `当前版本${APP_VERSON}`
          }
        ]
      }
    ]

    // 对于 OSX 而言，应用菜单的第一个菜单项是应用程序的名字
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          {
            label: '退出',
            accelerator: 'CmdOrCtrl+Q',
            click() {
              app.quit()
            }
          }
        ]
      })
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  updateCheck() {
    this.emit('updateCheck')
  }
}
