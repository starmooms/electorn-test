<template>
  <div>
    <el-dialog
      title="系统日志"
      class="center-dialog"
      custom-class="syslog-dialog"
      :close-on-click-modal="false"
      :visible.sync="sysLogDialog"
    >
      <el-alert
        :title="`系统启动时间 ${start}`"
        type="info"
        :closable="false"
      ></el-alert>
      <pre id="log-context" class="log-context" v-loading="loading">{{
        context
      }}</pre>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator'
import { getSysLogInfo } from '@/renderer/ipc/log'
import { promises as fsPromises } from 'fs'
import fs from 'fs'

@Component({
  components: {}
})
export default class SysLog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private sysLogDialog!: boolean

  filePath = ''
  start = ''
  context = ''
  loading = false
  offset = 0
  fileWatch!: null | fs.FSWatcher

  closeModal() {
    this.sysLogDialog = false
  }

  @Watch('sysLogDialog')
  changeDialog() {
    if (this.sysLogDialog) {
      this.openReadFile()
    } else {
      this.closeWatch()
      this.offset = 0
      this.context = ''
    }
  }

  // @Watch('context')
  changeContext(scrollEnd?: boolean) {
    const dom = document.querySelector('#log-context') as HTMLPreElement
    if (scrollEnd || dom.scrollHeight - dom.scrollTop - dom.offsetHeight < 40) {
      dom.scrollTo(0, dom.scrollHeight)
    }
  }

  /** 关闭文件监听 */
  closeWatch() {
    if (this.fileWatch) {
      this.fileWatch.close()
    }
  }

  async openReadFile() {
    if (this.loading) return
    try {
      this.loading = true
      const handle = await fsPromises.open(this.filePath, 'r')
      const fd = handle.fd
      let readbytes = 0
      const biteSize = 1048576
      let readNow = false

      /** 读文件 */
      const readSome = async (scrollEnd = false) => {
        readNow = true
        const stats = fs.fstatSync(fd)
        if (stats.size > readbytes) {
          return new Promise((resolve, reject) => {
            fs.read(
              fd,
              Buffer.alloc(biteSize),
              0,
              biteSize,
              readbytes,
              (err, bytesRead, buffer) => {
                if (err) {
                  readNow = false
                  this.$message.error(err.message)
                  reject(err)
                  return
                }
                readbytes += bytesRead
                this.context += buffer.toString('utf-8', 0, bytesRead)
                resolve(readSome(scrollEnd))
              }
            )
          })
        } else {
          readNow = false
          this.$nextTick(() => {
            this.changeContext(scrollEnd)
          })
        }
      }

      await readSome(true)
      this.closeWatch()
      this.fileWatch = fs.watch(this.filePath, () => {
        if (readNow !== true) {
          readSome()
        }
      })
    } catch (err) {
      console.error(err)
      // this.$message.error(err)
    } finally {
      this.loading = false
    }
  }

  async getInfo() {
    const data = await getSysLogInfo()
    if (data.status) {
      const info = data.data
      this.start = info.start
      this.filePath = info.filePath
    }
  }

  mounted() {
    this.getInfo()
  }

  beforeDestroy() {
    this.closeWatch()
  }
}
</script>

<style lang="scss" scoped>
.syslog-dialog {
  ::v-deep & {
    min-width: 800px;
    .el-dialog__body {
      padding: 10px 20px;
    }
  }

  .log-context {
    min-width: 100%;
    height: 60vh;
    overflow: auto;
  }
}
</style>
