import winManager from '../core/WinManager'

interface Opts {
  filePath: string
}

export default function createHistoryWin(opts: Opts) {
  const winName = `history`
  const win = winManager.getWin(winName, true)
  if (win) {
    win.webContents.send('/history/changeFile', opts)
    return true
  }
  winManager.createdWin(
    winName,
    `${winName}/historyFile/${encodeURIComponent(opts.filePath)}`
  )
}

// export default class SlaverTrend {
//   constructor(opts: Opts) {
//     this.createdWin(opts)
//   }

//   createdWin(opts: Opts) {
//     // const { path, slaverId, masterId } = this.opts
//     // const basePath = `${encodeURIComponent(path)}/${masterId}/${slaverId}`
//     // const winName = `port/SlaverTrend/${basePath}`
//     // const portItem = this.usbManager.getPortData(path)
//     const winName = `history`
//     if (winManager.getWin(winName, true)) {
//       return true
//     }

//     // if (!portItem) {
//     //   throw new Error(`串口 ${path} 不存在`)
//     // }
//     winManager.createdWin('historyWin', `history`)
//   }
// }
