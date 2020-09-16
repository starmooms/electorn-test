<template>
  <title-box name="查看历史数据">
    <el-select v-model="history" placeholder="请选择">
      <el-option
        v-for="item in historyList"
        :key="item.value"
        :label="item.value"
        :value="item"
      ></el-option>
    </el-select>
  </title-box>
</template>

<script lang="ts">
import { getChannelHistory } from '@/renderer/ipc/db'
import { formatTimeStr } from '@/renderer/utils/util'
import dayjs from 'dayjs'
import { Component, Prop, Vue, Watch, Model } from 'vue-property-decorator'

@Component
export default class ChHistoryChHistory extends Vue {
  @Model('change', { type: Object }) readonly value!: any
  @Prop({ type: Object }) position!: ipcReq.Position
  @Prop({ type: Object, required: false }) channelData!: null | Port.ChannelItem

  history: any = null
  historyList: any[] = []

  @Watch('history')
  changeHistory(v, old) {
    this.$emit('change', this.history)
  }

  @Watch('value')
  changeValue() {
    this.history = this.value
  }

  /** 获取历史数据 */
  async getHistory(isRefresh = false) {
    const data = await getChannelHistory({
      masterId: this.position.masterId,
      slaverId: this.position.slaverId,
      channelId: this.position.channelId
    })
    if (data.status) {
      this.historyList = data.data.map(item => {
        const val = JSON.parse(item)
        const start = dayjs.unix(val.start).format(formatTimeStr)
        const end = val.end
          ? dayjs.unix(val.end).format(formatTimeStr)
          : '未知结束'
        val.value = `${start} - ${end}`
        return val
      })

      // 当前有进行中在工步直接显示
      if (
        this.history === null &&
        this.historyList.length > 0 &&
        this.channelData
      ) {
        const first = this.historyList[0]
        if (first.start === this.channelData.workerStart) {
          this.history = first
        }
      } else if (isRefresh && this.history) {
        const history = this.historyList.find(item => {
          return item.start === this.history!.start
        })
        this.$nextTick(() => {
          this.history = history || null
        })
      }
    }
  }

  getSampData() {
    this.$emit('getSampData')
  }
}
</script>

<style lang="scss" scoped></style>
