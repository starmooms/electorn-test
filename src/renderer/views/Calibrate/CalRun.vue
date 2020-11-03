<template>
  <div class="cal-run">
    <div class="cal-action-box">
      <div>
        <el-checkbox-group class="type-select" v-model="calType" size="mini">
          <el-checkbox
            v-for="item in calTypeList"
            :key="item.type"
            :label="item.type"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="action-btn-box">
        <el-button type="primary" @click="start">修调</el-button>
        <el-button type="primary" @click="stop">停止</el-button>
        <el-button type="primary">导出</el-button>
        <el-button type="primary">清除</el-button>
      </div>
    </div>

    <vxe-grid
      border
      auto-resize
      show-overflow
      resizable
      ref="xTabel"
      :data="calResultList"
      size="mini"
      max-width="160px"
      height="240px"
    >
      <!-- eslint-disable -->
      <vxe-table-column field="time" title="修调时间" min-width="140"></vxe-table-column>
      <vxe-table-column field="masterId" title="机柜号" width="80">
        <template v-slot="{ row }">{{ row.masterId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="slaverId" title="从控号" width="80">
        <template v-slot="{ row }">{{ row.slaverId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="channelId" title="通道号" width="80">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calTypeName" title="修调类型" min-width="80"></vxe-table-column>
      <vxe-table-column field="point1Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="point1Result.actual" title="实际值" width="80"></vxe-table-column>
      <vxe-table-column field="point1Result.samp" title="采样值" width="80"></vxe-table-column>
      <vxe-table-column field="point2Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="point2Result.actual" title="实际值" width="80"></vxe-table-column>
      <vxe-table-column field="point2Result.samp" title="采样值" width="80"></vxe-table-column>
      <vxe-table-column field="a" title="A" width="80"></vxe-table-column>
      <vxe-table-column field="b" title="B" width="80"></vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
  </div>
</template>
<script lang="ts">
import { CALIBRATE_TYPE } from '@/shared/config/calibrate'
import { deepClone } from '@/shared/utils'
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class CalRight extends Vue {
  @Prop({ type: Array, required: true }) calResultList!: any[]

  calType: string[] = []
  calTypeList = deepClone(CALIBRATE_TYPE)

  /** 开始修调 */
  start() {
    if (this.calType.length <= 0) {
      return this.$message.info('请先选择修调类型')
    }
    this.$emit('start', {
      calType: this.calType
    })
  }

  /** 停止修调 */
  stop() {
    this.$emit('stop')
  }
}
</script>

<style lang="scss" scoped>
.cal-run {
  .type-select {
    width: 200px;
    display: flex;
    flex-flow: row wrap;
    margin-right: 20px;
    .el-checkbox {
      flex: 0 0 50%;
      margin-right: 0;
      margin-bottom: 10px;
      &:nth-of-type(2n) {
        margin-right: 0;
      }
    }
  }
}
</style>
