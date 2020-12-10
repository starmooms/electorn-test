<template>
  <div>
    <el-dialog
      class="batch-dialog"
      title="机柜批量操作"
      :visible.sync="diolog"
      width="800px"
    >
      <SelectChannel
        ref="SelectChannel"
        is-checkbox-master
        :master-id.sync="masterIdList"
        :slaver-id.sync="slaverId"
        :channel-id.sync="channelId"
      />

      <div slot="footer">
        <el-button @click="diolog = false">取消</el-button>
        <el-button
          v-for="item in statusList"
          :key="item.action"
          type="primary"
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
import SelectChannel from '@/renderer/components/SelectChannel.vue'

@Component({
  components: {
    SelectChannel
  }
})
export default class BatchModal extends Vue {
  @PropSync('show', { type: Boolean, required: true }) diolog!: boolean
  type = ''

  $refs!: {
    SelectChannel: SelectChannel
  }

  masterIdList: number[] = []
  slaverId: number[] = []
  channelId: number[] = []

  get statusList() {
    return ChannelStatus.statusList
  }

  close() {
    this.diolog = false
  }

  async setStatus(status: string) {
    let msg = ''
    if (this.masterIdList.length === 0) {
      msg = '请先选择机柜'
    } else if (this.slaverId.length === 0) {
      msg = '请先选择从控'
    } else if (this.channelId.length === 0) {
      msg = '请先选择通道'
    }
    if (msg) {
      return this.$message.warning(msg)
    }
    this.$emit('setChannelStatus', {
      params: {
        masterIdList: this.masterIdList,
        slaverIdList: this.slaverId,
        channelIdList: this.channelId,
        status
      }
    })
    this.close()
  }

  @Watch('diolog')
  changeShow(v) {
    if (v === true && this.$refs.SelectChannel) {
      this.$refs.SelectChannel.reset()
    }
  }
}
</script>

<style lang="scss" scoped>
.batch-dialog {
  .batch-transfer {
    display: flex;
    align-items: center;
    justify-content: space-between;

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
