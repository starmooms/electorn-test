<template>
  <div>
    <title-box name="操作" class="action-box">
      <el-button @click="refresh" type="primary">刷新</el-button>
      <el-button
        v-for="item in statusList"
        :key="item.name"
        @click="setStatus(item.action)"
        type="primary"
      >
        {{ item.name }}
      </el-button>
    </title-box>

    <div style="width:0;">
      <SetChannelStatus ref="setChannelStatus"></SetChannelStatus>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import SetChannelStatus from '@/renderer/components/SetChannelStatus.vue'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
@Component({
  components: {
    SetChannelStatus
  }
})
export default class ChAction extends Vue {
  @Prop({ type: Object }) position!: ipcReq.Position
  @Prop({ type: Boolean }) isRun!: boolean

  get statusList() {
    return ChannelStatus.statusList
  }

  $refs!: {
    setChannelStatus: SetChannelStatus
  }

  refresh() {
    this.$emit('refresh')
  }

  async setStatus(status: string) {
    this.$refs.setChannelStatus.changeStatus({
      params: {
        path: this.position.path,
        slaverId: this.position.slaverId,
        channelId: this.position.channelId,
        masterId: this.position.masterId,
        status
      },
      isSingle: true
    })
  }
}
</script>

<style lang="scss" scoped>
.action-box {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  .el-button {
    margin: 0;
    margin-bottom: 10px;
    // width: 40%;
    // // margin: 0;
    // margin-bottom: 10px;
    // flex: 1 1 auto;
  }
}
</style>
