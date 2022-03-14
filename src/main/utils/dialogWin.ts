import winManager from '@/main/core/WinManager'
import { dialog, app } from 'electron'

const getWin = (key = 'mainWin') => winManager.getWin(key)!

export const dialogWin = {
  showMessageBox: (opts: Electron.MessageBoxOptions, key?: string) => {
    return dialog.showMessageBox(getWin(key), opts)
  },

  /** 如果app.isReady, 绑定到主窗口上 */
  showErrorBox: (...args: Parameters<typeof dialog.showErrorBox>) => {
    if (app.isReady()) {
      let opts: Electron.MessageBoxOptions
      if (args.length >= 2) {
        opts = {
          title: args[0],
          message: args[1]
        }
      } else {
        opts = {
          message: args[1]
        }
      }

      return dialog.showMessageBox(getWin(), {
        type: 'error',
        ...opts
      })
    }

    return dialog.showErrorBox(...args)
  }
}
