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