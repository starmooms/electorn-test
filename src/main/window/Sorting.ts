import winManager from '@/main/core/WinManager'

export default function createSorting() {
  const winName = `sorting`
  const win = winManager.getWin(winName, true)
  if (win) return
  winManager.createdWin({
    name: winName,
    pageUrl: winName
  })
}
