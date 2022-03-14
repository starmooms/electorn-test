# e-ts

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

chrome://version/

### redis

```
bind 127.0.0.21
save 10 1
appendonly yes
dir ../../__local/redis/
```

```
安装redis之后
在命令行窗口中输入 redis-server redis.windows.conf 启动redis
关闭命令行窗口就是关闭 redis。

---
上面虽然启动了redis，但是只要关闭cmd窗口，redis服务就会停止。所以要把redis设置成windows下的服务。
redis作为windows服务启动方式
redis-server --service-install redis.windows.conf
启动服务：redis-server --service-start
停止服务：redis-server --service-stop
删除服务: redis-server --service-uninstall

```

```
https://github.com/apache/incubator-echarts/issues/10929
```

https://www.cnblogs.com/LLBFWH/articles/11013791.html
https://www.jianshu.com/p/b4c5480146a9
https://docs.mongodb.com/manual/reference/configuration-options/#windows-service-options


## mac
sudo ifconfig lo0 alias 127.0.0.21 netmask 0xFFFFFFFF


### 中文乱码
https://www.yht7.com/news/110534
https://blog.csdn.net/hnlgzb/article/details/81911824
https://www.zhihu.com/question/54724102/answer/380875686
https://blog.csdn.net/Assassin660/article/details/108915071
注册表查看(具体查看 HKEY_CURRENT_USER\Console )
[HKEY_CURRENT_USER\Console\%SystemRoot%_system32_cmd.exe]

```
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Console\%SystemRoot%_system32_cmd.exe]
"CodePage"=dword:0000fde9
```

``` 
# 验证
chcp
```

```electron-build
https://github.com/eyasliu/blog/issues/22
```

## vbs
```
https://www.cnblogs.com/XT-xutao/p/9912264.html
```

### 精度计算
https://www.cnblogs.com/stella1024/p/11905773.html?utm_source=tuicool


### sqlite 提高写入速度
https://libaineu2004.blog.csdn.net/article/details/108815466
https://blog.csdn.net/qq_18059143/article/details/103323840
https://blog.csdn.net/lijinqi1987/article/details/5185  2721
https://www.cnblogs.com/dongweiq/p/5486433.html


### electron 总是重新构建
https://github.com/electron-userland/electron-builder/issues/3329
https://www.cnblogs.com/qirui/p/8328015.html  // 打包速度
https://blog.csdn.net/weixin_30335575/article/details/95836259
https://npm.taobao.org/mirrors
https://www.jianshu.com/p/6615ff3cb0c1
https://blog.yasking.org/a/zh-install-electron-development-2020.html

**淘宝镜像**
https://npm.taobao.org/mirrors

**electron-rebuild查看需要镜像**
```bash
// -v 版本号
// -b 打印日志
// -d -d=http://npm.taobao.org/mirrors/atom-shell 设置下载地址（8.0.0的版本没有）
npx electron-rebuild -v 8.3.4 -d=https://npm.taobao.org/mirrors/electron -b
```

**自制镜像准备**
https://www.electronjs.org/headers/v8.3.4/node-v8.3.4-headers.tar.gz
https://www.electronjs.org/headers/v8.3.4/SHASUMS256.txt
https://www.electronjs.org/headers/v8.3.4/win-x86/node.lib
https://www.electronjs.org/headers/v8.3.4/win-x64/node.lib
https://www.electronjs.org/headers/v8.3.4/win-arm64/node.lib

**electron-builder**
electron-builder 不使用`electron-rebuild`使用[`app-builder-bin`](https://github.com/Loller79/app-builder-bin)

`app-builder-bin` 中的[`app-builder.exe`](https://github.com/develar/app-builder)

`app-builder` 使用 `prebuild-install` 或者直接 `rebuild`

```bash
`prebuild-install` 查看 node_modules/prebuild-install/util.js 设置镜像
## 缓存在 C:\Users\Administrator\AppData\Roaming\npm-cache\_prebuilds
eg:
# usb_detection
usb_detection_binary_host=https://hub.fastgit.org/MadLittleMods/node-usb-detection/releases/download
# serialport
# _serialport_bindings_binary_host=https://hub.fastgit.org/serialport/node-serialport/releases/download (错误！！前面有‘_’ npm不能识别)
cross-env DEBUG=electron-builder npm_config__serialport_bindings_binary_host=https://hub.fastgit.org/serialport/node-serialport/releases/download yarn postinstall
## prebuild-install 缓存文件名和下载路径有关，所有修改后需要一直保存，缓存才有效

`rebuild` 中间可能使用 `node-pre-gyp` 根据包名设置镜像
eg:
# 包名为node-sqlite3
node_sqlite3_binary_host_mirror=https://npm.taobao.org/mirrors
```


```bash
# 打包是打开详细信息
cross-env DEBUG=electron-builder yarn build
# 构建原生模块也可以一样
cross-env DEBUG=electron-builder yarn postinstall
```


**设置环境变量**

```bash
# .npmrc
# electron 镜像
ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
# electron-builder 打包器镜像
ELECTRON_BUILDER_BINARIES_MIRROR=https://npm.taobao.org/mirrors/electron-builder-binaries/
# sqlite3 二进制文件  镜像
node_sqlite3_binary_host_mirror=https://npm.taobao.org/mirrors
```






### 子进程
https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/898
yarn electron:build --mode development  // 打包时使用开发模式