import winManager from '../core/WinManager'

export default function createSeparat() {
  const winName = `separat`
  const win = winManager.getWin(winName, true)
  if (win) return
  winManager.createdWin(winName, `${winName}`)
}
