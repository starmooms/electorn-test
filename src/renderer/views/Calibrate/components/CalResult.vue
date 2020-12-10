<template>
  <div class="cal-result">
    <div class="cal-action-box">
      <p class="title">检测结果</p>
      <div class="action-box">
        <el-button type="primary" @click="clean">清空</el-button>
      </div>
    </div>
    <vxe-grid
      ref="xTabel"
      border
      auto-resize
      show-overflow
      resizable
      :data="resultList"
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
      <template>
        <vxe-table-column
          width="80"
          v-for="item in calTypeList"
          :key="item.type"
          :title="item.label">
          <template v-slot="{ row }">
            <svg-icon v-if="row[`calType_${item.type}`] === true" class="status-icon success" icon-class="success"></svg-icon>
            <svg-icon v-else-if="row[`calType_${item.type}`] === false" class="status-icon error" icon-class="cal-error"></svg-icon>
          </template>
        </vxe-table-column>
      </template>
      <vxe-table-column field="time" title="测试时间" min-width="80"></vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class CalResult extends Vue {
  @Prop({ type: Array, required: true }) resultList!: any[]
  @Prop({ type: Array, required: true }) calTypeList!: any[]

  clean() {
    this.$emit('clean')
  }
}
</script>
