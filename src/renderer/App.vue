<template>
  <div id="app">
    <div v-if="titleBar">ddd</div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import { SettingStatus } from './store/modules/Setting'
import { ChannelStatus } from './store/modules/Channel'

@Component
export default class App extends Vue {
  dialogVisible = false
  tips = ''
  downloadPercent = 0

  get portPath() {
    return SettingStatus.portPath
  }

  get titleBar() {
    return SettingStatus.titleBar
  }

  @Watch('portPath')
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
