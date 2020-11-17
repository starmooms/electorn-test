<template>
  <history-main
    ref="historyMain"
    :position.sync="position"
    @refresh="refresh"
  />
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import HistoryMain from './HistoryMain.vue'

@Component({
  components: {
    HistoryMain
  }
})
export default class ChannelCur extends Vue {
  $refs!: {
    historyMain: HistoryMain
  }

  position = {
    masterId: 0,
    slaverId: 0,
    channelId: 0
  }

  get nowChannel() {
    return ChannelStatus.channelMap
      ? ChannelStatus.channelMap[
          `${this.position.masterId}_${this.position.slaverId}_${this.position.channelId}`
        ]
      : null
  }

  @Watch('nowChannel')
  changeChannel() {
    if (this.nowChannel) {
      this.openDb(this.nowChannel.filePath)
    }
  }

  /** 打开数据库 */
  openDb(filePath: string | null) {
    this.$refs.historyMain.openDb(filePath)
  }

  /** 获取通道数据 */
  getSampData() {
    this.$refs.historyMain.getSampData()
  }

  setPosition(data) {
    Object.keys(data).forEach(key => {
      this.position[key] = data[key]
    })
  }

  changeChannelHandle() {
    this.$command.on({
      eventName: '/channel/channelPosition',
      onEmit: (opt: any) => {
        this.setPosition(opt)
      },
      vm: this
    })
  }

  getRouter() {
    this.setPosition({
      masterId: Number(this.$route.params.masterId),
      slaverId: Number(this.$route.params.slaverId),
      channelId: Number(this.$route.params.channelId)
    })
  }

  refresh() {
    const historyMain = this.$refs.historyMain
    if (!historyMain.db || historyMain.filePath !== this.nowChannel?.filePath) {
      this.changeChannel()
    } else {
      this.getSampData()
    }
  }

  mounted() {
    this.getRouter()
    this.changeChannelHandle()
    this.changeChannel()
  }
}
</script>
<style lang="scss" scoped></style>
