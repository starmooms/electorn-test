<template>
  <div>
    <el-dialog
      class="batch-dialog"
      title="机柜批量操作"
      :visible.sync="diolog"
      width="800px"
    >
      <SelectChannel
        isCheckboxMaster
        :masterId.sync="masterId"
        :slaverId.sync="slaverId"
        :channelId.sync="channelId"
      ></SelectChannel>

      <div slot="footer">
        <el-button
          v-for="item in statusList"
          :key="item.action"
          @click="setStatus(item.action)"
        >
          {{ item.name }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { Vue, Component, PropSync, Watch } from 'vue-property-decorator'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { changeStatus } from '@/renderer/ipc/channel'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import SelectChannel from '@/renderer/components/SelectChannel.vue'

@Component({
  components: {
    SelectChannel
  }
})
export default class BatchModal extends Vue {
  @PropSync('show', { type: Boolean, required: true }) diolog!: boolean
  type = ''

  list: any[] = []
  value: number[] = []
  batchMasterList: string[] = []
  masterId: string[] = []
  slaverId: number[] = []
  channelId: number[] = []

  get statusList() {
    return ChannelStatus.statusList
  }

  get portPath() {
    return SettingStatus.portPath
  }

  async setStatus(status: string) {
    if (this.value.length === 0) {
      return this.$message.warning('请先选择机柜')
    }
    await changeStatus({
      path: this.portPath,
      masterIdList: this.value.map(item => this.list[item].id),
      status
    })
  }

  open(type: string, data: any) {
    this.type = ''
    this.value = []
    switch (type) {
      case 'master':
        this.type = 'master'
        this.list = Object.keys(data).map(key => {
          const val = data[key]
          return {
            key: val.id,
            label: val.name
          }
        })
        break
      default:
        return false
    }
  }

  // @Watch('showSync')
  // changeShow(){

  // }
}
</script>

<style lang="scss" scoped>
.batch-dialog {
  .batch-transfer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .right-footer {
      padding: 0 10px;
    }
    ::v-deep {
      .el-transfer-panel__footer {
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
