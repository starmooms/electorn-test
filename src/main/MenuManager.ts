import Electron, { app, Menu } from 'electron'
import Update from './Update'
const APP_VERSON = app.getVersion()

export default class MenuManager {
  update: Update

  constructor(update: Update) {
    this.update = update
    this.init()
  }

  init() {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: '帮助',
        submenu: [
          {
            label: '更新',
            accelerator: 'CmdOrCtrl+U',
            click: () => {
              this.update.checkUpdate()
            }
          },
          {
            type: 'separator'
          },
          {
            label: `当前版本${APP_VERSON}`,
            click: () => {
              this.update.checkUpdate()
            }
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
}
