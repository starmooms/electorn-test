<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import { SettingStatus } from './store/modules/Setting'
import { ChannelStatus } from './store/modules/Channel'

@Component
export default class App extends Vue {
  dialogVisible = false
  tips = ''
  downloadPercent = 0

  get titleBar() {
    return SettingStatus.titleBar
  }

  checkPortPath() {
    ChannelStatus.getList()
  }

  mounted() {
    this.checkPortPath()
    ipcRenderer.on('commomMsg', (event, channel, data) => {
      switch (channel) {
        case 'updateChannelList':
          // 更新通道列表
          ChannelStatus.UPDATE_CHANNELLIST(data)
          break
        case 'userConfig':
          SettingStatus.UPDATE_USERCONFIG(data)
          break
        default:
          console.error(`${channel} undefined`)
          return
      }
    })
  }

  destroy() {
    ;['commomMsg'].forEach(item => {
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
