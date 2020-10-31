import winManager from '../core/WinManager'

export default function createCalibrate() {
  const winName = `calibrate`
  const win = winManager.getWin(winName, true)
  if (win) return
  const createWin = winManager.createdWin(winName, `${winName}`, {
    parent: winManager.getWin('mainWin')!,
    modal: true
  })
  return createWin
}
