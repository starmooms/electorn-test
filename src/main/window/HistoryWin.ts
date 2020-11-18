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
  winManager.createdWin({
    name: winName,
    pageUrl: `${winName}/${encodeURIComponent(opts.filePath)}`
  })
}
