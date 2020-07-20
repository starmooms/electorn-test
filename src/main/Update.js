import { ipcMain } from "electron"
import { autoUpdater } from 'electron-updater'
const uploadUrl = process.env.VUE_APP_UPLOADURL
let mainWindow = null

export const startCheck = () => {
  //执行自动更新检查
  try {
    mainWindow.webContents.send('startCheck')
    autoUpdater.checkForUpdates();
  } catch (err) {
    mainWindow.webContents.send(err)
  }
}

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
export function updateHandle(win) {
  mainWindow = win
  let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: 'startUpdate', //'检测到新版本，正在下载……',
    updateNotAva: 'noUpdate' //'现在使用的就是最新版本，不用更新',
  };
  const os = require('os');

  autoUpdater.setFeedURL(uploadUrl);
  autoUpdater.on('error', function (err, error) {
    console.log(err, "ggg")
    sendUpdateMessage(JSON.stringify({
      error: message.error,
      data: error
    }))
  });
  autoUpdater.on('checking-for-update', function () {
    sendUpdateMessage(message.checking)
  });
  autoUpdater.on('update-available', function (info) {
    sendUpdateMessage(message.updateAva)
  });
  autoUpdater.on('update-not-available', function (info) {
    sendUpdateMessage(message.updateNotAva)
  });

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    mainWindow.webContents.send('downloadProgress', progressObj)
  })
  autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
    ipcMain.on('isUpdateNow', (e, arg) => {
      console.log(arguments);
      console.log("开始更新");
      //some code here to handle event
      autoUpdater.quitAndInstall();
    });

    mainWindow.webContents.send('isUpdateNow')
  });

  ipcMain.on("checkForUpdate", () => {
    startCheck()
  })
}



// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(text) {
  mainWindow.webContents.send('message', text)
}