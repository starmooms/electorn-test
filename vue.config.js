process.env.VUE_APP_VERSION = require('./package.json').version
process.env.VUE_APP_UPLOADURL = "http://192.168.0.139:8081/"

module.exports = {
  configureWebpack: {
    devtool: 'source-map'
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        "electronDownload": {
          "mirror": "https://npm.taobao.org/mirrors/electron/"
        },
        "appId": "com.xxx.app",
        "mac": {
          "target": [
            "dmg",
            "zip"
          ]
        },
        "win": {
          "target": [
            "nsis",
            "zip"
          ]
        },
        "nsis": {
          "oneClick": false,
          "allowToChangeInstallationDirectory": true,
          "perMachine": true
        },
        // 软件更新地址
        "publish": {
          "provider": "generic",
          "url": process.env.VUE_APP_UPLOADURL,
        }
      }
    }
  }
}