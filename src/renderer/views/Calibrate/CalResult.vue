<template>
  <div class="cal-result">
    <div class="cal-action-box">
      <p class="title">检测结果</p>
      <div class="action-box">
        <el-button type="primary">清空</el-button>
      </div>
    </div>
    <vxe-grid
      border
      auto-resize
      show-overflow
      resizable
      ref="xTabel"
      :data="reCheckList"
      size="mini"
      max-width="160px"
      height="240px"
    >
      <!-- eslint-disable -->
    <vxe-table-column field="masterId" title="机柜号" width="80">
      <template v-slot="{ row }">{{ row.masterId+1 }}</template>
    </vxe-table-column>
    <vxe-table-column field="slaverId" title="从控号" width="80">
      <template v-slot="{ row }">{{ row.slaverId+1 }}</template>
    </vxe-table-column>
    <vxe-table-column field="channelId" title="通道号" width="80">
      <template v-slot="{ row }">{{ row.channelId+1 }}</template>
    </vxe-table-column>
    <vxe-table-column field="iCharge" title="充电电流" width="80"></vxe-table-column>
    <vxe-table-column field="uCharge" title="充电电压" width="80"></vxe-table-column>
    <vxe-table-column field="iDisCharge" title="放电电流" width="80"></vxe-table-column>
    <vxe-table-column field="time" title="测试时间" min-width="80"></vxe-table-column>
    <!-- eslint-enable -->
    </vxe-grid>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class CalResult extends Vue {
  reCheckList = [
    {
      masterId: 0,
      slaverId: 0,
      channelId: 0,
      iCharge: 0,
      uCharge: 0,
      iDisCharge: 0,
      time: '01:01:01'
    }
  ]
}
</script>

<style lang="scss" scoped></style>
