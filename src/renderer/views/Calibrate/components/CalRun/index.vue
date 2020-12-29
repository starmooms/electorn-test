<template>
  <div class="cal-run">
    <div class="cal-action-box">
      <div>
        <CalTypeSelect v-model="calType" />
      </div>
      <div class="action-btn-box">
        <el-button type="primary" @click="start">修调</el-button>
        <el-button type="primary" @click="stop">停止</el-button>
        <el-button type="primary">导出</el-button>
        <el-button type="primary" @click="clean">清除</el-button>
      </div>
    </div>

    <vxe-grid
      ref="xTabel"
      border
      auto-resize
      show-overflow
      resizable
      :data="calResultList"
      size="mini"
      max-width="160px"
      height="240px"
    >
      <!-- eslint-disable -->
      <vxe-table-column field="time" title="修调时间" width="135"></vxe-table-column>
      <vxe-table-column field="masterId" title="机柜号" width="60">
        <template v-slot="{ row }">{{ row.masterId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="slaverId" title="从控号" width="60">
        <template v-slot="{ row }">{{ row.slaverId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="channelId" title="通道号" width="60">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calTypeName" title="修调类型" min-width="80"></vxe-table-column>
      <vxe-table-column field="point1Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="point1Result.actual" title="实际值" width="90"></vxe-table-column>
      <vxe-table-column field="point1Result.samp" title="采样值" width="90"></vxe-table-column>
      <vxe-table-column field="point2Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="point2Result.actual" title="实际值" width="90"></vxe-table-column>
      <vxe-table-column field="point2Result.samp" title="采样值" width="90"></vxe-table-column>
      <vxe-table-column field="a" title="A" width="80"></vxe-table-column>
      <vxe-table-column field="b" title="B" width="80"></vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import CalTypeSelect from './CalTypeSelect.vue'

@Component({
  components: {
    CalTypeSelect
  }
})
export default class CalRun extends Vue {
  @Prop({ type: Array, required: true })
  calResultList!: CalibrateT.CalRunResultItem[]

  calType: string[] = []

  getCalType() {
    if (this.calType.length <= 0) {
      this.$message.info('请先选择修调类型')
      return false
    }
    return this.calType
  }

  /** 开始修调 */
  start() {
    const calType = this.getCalType()
    if (calType === false) return
    this.$emit('start', {
      calType: this.calType
    })
  }

  /** 停止修调 */
  stop() {
    this.$emit('stop')
  }

  clean() {
    this.$emit('clean')
  }
}
</script>
