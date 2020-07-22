const isDev = process.env.NODE_ENV === 'development'
module.exports = {
  lintOnSave: isDev,
  configureWebpack: {
    devtool: isDev ? 'source-map' : 'none'
  },
  chainWebpack: config => {
    config
      .entry('app')
      .clear()
      .add('./src/renderer/main.ts')
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      mainProcessFile: 'src/main/background.ts',
      mainProcessWatch: ['src/main'],
      externals: ['serialport', 'usb-detection'],
      builderOptions: {
        electronDownload: {
          mirror: 'https://npm.taobao.org/mirrors/electron/'
        },
        appId: 'com.xxx.app',
        mac: {
          target: ['dmg', 'zip']
        },
        win: {
          target: ['nsis', 'zip']
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          perMachine: true
        },
        // 软件更新地址
        publish: {
          provider: 'generic',
          url: process.env.VUE_APP_UPLOADURL
        }
      }
    }
  }
}
