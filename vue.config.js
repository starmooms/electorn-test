/* eslint-disable */
const path = require('path')
const WorkerPlugin = require('worker-plugin')
/* eslint-enable */

const isDev = process.env.NODE_ENV === 'development'

function resolve(dir) {
  return path.join(__dirname, './', dir)
}

module.exports = {
  lintOnSave: isDev,
  configureWebpack: {
    devtool: isDev ? 'source-map' : 'none',
    plugins: [new WorkerPlugin()]
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
      externals: ['serialport', 'usb-detection', 'forever-monitor'],
      builderOptions: {
        electronDownload: {
          mirror: 'https://npm.taobao.org/mirrors/electron/'
        },
        appId: 'com.xxx.app',
        mac: {
          target: ['dmg', 'zip']
        },
        win: {
          target: ['nsis', 'zip'],
          extraResources: {
            from: './extra/win32/',
            to: './',
            filter: ['**/*']
          }
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          perMachine: true
          // oneClick: false, // 是否一键安装
          // allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          // allowToChangeInstallationDirectory: true, // 允许修改安装目录
          // installerIcon: './build/icons/aaa.ico', // 安装图标
          // uninstallerIcon: './build/icons/bbb.ico', //卸载图标
          // installerHeaderIcon: './build/icons/aaa.ico', // 安装时头部图标
          // createDesktopShortcut: true, // 创建桌面图标
          // createStartMenuShortcut: true, // 创建开始菜单图标
          // shortcutName: 'xxxx', // 图标名称
          // include: 'build/script/installer.nsh' // 包含的自定义nsis脚本 这个对于构建需求严格得安装过程相当有用。
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
