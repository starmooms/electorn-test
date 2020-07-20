const { app, BrowserWindow, ipcMain } = require('electron')
const SerialPort = require('serialport')

require('./serialPortMock')

// app.allowRendererProcessReuse = true

function createSerialPort(win) {

  const getList = () => {
    SerialPort.list().then((ports) => {
      win.webContents.send("serialPort", {
        type: 'list',
        ports
      })
      ports.forEach((port) => {
        console.log(port.path);
      });
    }).catch(err => {
      console.error(err)
    })
  }

  ipcMain.on("serialPort", (event, msg) => {
    if (msg === 'getList') {
      getList()
    }
  })


  var usbDetect = require('usb-detection');
  usbDetect.startMonitoring();
  usbDetect.on('change', function (device) {
    console.log('c')
    getList()
  });

  // //开启串口，并发送到渲染线程中
  // const port = new SerialPort('COM16');
  // port.on('data', function (data) {
  //   let strData = data + ''
  //   let nValue = strData.replace('0 MW', '').replace('mm', '').trim()
  //   win.webContents.send("marh-data", parseFloat(nValue))
  // });
}

function createWindow() {

  // 创建浏览器窗口
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.webContents.openDevTools()


  // 加载index.html文件
  win.loadFile('index.html')
  createSerialPort(win)
}

app.whenReady().then(() => {
  createWindow()
})
