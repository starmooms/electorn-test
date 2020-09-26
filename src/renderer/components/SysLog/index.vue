<template>
  <div>
    <el-dialog
      title="系统日志"
      custom-class="syslog-dialog"
      :close-on-click-modal="false"
      :visible.sync="sysLogDialog"
    >
      <el-alert
        :title="`系统启动时间 ${start}`"
        type="success"
        :closable="false"
      ></el-alert>
      <pre class="log-context" v-loading="loading">{{ context }}</pre>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator'
import { getSysLogInfo } from '@/renderer/ipc/log'
import * as fs from 'fs'

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

  closeModal() {
    this.sysLogDialog = false
  }

  @Watch('sysLogDialog')
  changeDialog() {
    if (this.sysLogDialog) {
      this.readFile()
    }
  }

  async readFile() {
    try {
      this.loading = true
      const data = await fs.promises.readFile(this.filePath, 'utf-8')
      this.context = data
    } catch (err) {
      this.$message.error(err)
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
}
</script>

<style lang="scss" scoped>
.syslog-dialog {
  ::v-deep & {
    min-width: 800px;
  }
  .el-dialog__body {
    padding: 10px 20px;
  }
  .log-context {
    min-width: 100%;
    max-height: 60vh;
    overflow: auto;
  }
}
</style>
