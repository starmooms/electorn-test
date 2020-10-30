import winManager from '../core/WinManager'

export default function createCalibrate() {
  const winName = `calibrate`
  const win = winManager.getWin(winName, true)
  if (win) return
  winManager.createdWin(winName, `${winName}`, {
    // frame: false
  })
}
