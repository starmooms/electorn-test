/* eslint-disable */
const path = require('path')
/* eslint-enable */

const isDev = process.env.NODE_ENV === 'development'

function resolve(dir) {
  return path.join(__dirname, './', dir)
}

module.exports = {
  lintOnSave: isDev,
  configureWebpack: {
    devtool: isDev ? 'source-map' : 'none'
  },
  css: {
    loaderOptions: {
      scss: {
        // @/ 是 src/ 的别名
        // 所以这里假设你有 `src/variables.sass` 这个文件
        // 注意：在 sass-loader v8 中，这个选项名是 "prependData"
        additionalData: `@import "@/renderer/style/variables.scss";`
      }
    }
  },
  chainWebpack: config => {
    config.module
      .rule('svg')
      .exclude.add(resolve('src/renderer/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/renderer/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
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
        }
        // // 软件更新地址
        // publish: {
        //   provider: 'generic',
        //   url: process.env.VUE_APP_UPLOADURL
        // }
      }
    }
  }
}
