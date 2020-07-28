<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class App extends Vue {
  dialogVisible = false
  tips = ''
  downloadPercent = 0

  mounted() {
    ipcRenderer.on('updateMsg', (event, text) => {
      if (text === 'startUpdate') {
        this.dialogVisible = true
        this.tips = '检测到新版本，正在下载……'
      } else if (text === 'noUpdate') {
        this.$message('现在使用的就是最新版本')
      } else {
        this.tips = text
      }
    })

    ipcRenderer.on('updateError', (event, msg) => {
      this.$message.error(msg)
    })

    ipcRenderer.on('downloadProgress', (event, progressObj) => {
      this.downloadPercent = progressObj.percent || 0
    })

    ipcRenderer.on('downloaded', () => {
      ipcRenderer.send('isUpdateNow', 'isUpdateNow')
    })
  }

  destroy() {
    ;['message', 'downloadProgress', 'isUpdateNow'].forEach(item => {
      ipcRenderer.removeAllListeners(item)
    })
  }
}
</script>

<style lang="scss">
/* #app {
  background: $cl1;
} */
</style>
