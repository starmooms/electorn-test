import winManager from '../core/WinManager'

interface Opts {
  masterId: number
  slaverId: number
  channelId: number
}

export default function createNowChannelWin({
  masterId,
  slaverId,
  channelId
}: Opts) {
  const winName = 'nowChannel'
  const hasWin = winManager.getWin(winName, true)
  if (hasWin) {
    hasWin.webContents.send('/channel/channelPosition', {
      masterId,
      slaverId,
      channelId
    })
    return
  }
  const winPath = `nowChannel/${masterId}/${slaverId}/${channelId}`
  winManager.createdWin({
    name: winName,
    pageUrl: winPath
  })
}
