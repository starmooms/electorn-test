import winManager from '../core/WinManager'

export default function createSorting() {
  const winName = `sorting`
  const win = winManager.getWin(winName, true)
  if (win) return
  winManager.createdWin(winName, `${winName}`)
}
