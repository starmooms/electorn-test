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
        <el-button type="primary">修调</el-button>
        <el-button type="primary">停止</el-button>
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
      :data="calDataList"
      size="mini"
      max-width="160px"
      height="240px"
    >
      <!-- eslint-disable -->
      <vxe-table-column field="time" title="修调时间" width="160"></vxe-table-column>
      <vxe-table-column field="masterId" title="机柜号" width="80">
        <template v-slot="{ row }">{{ row.masterId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="slaverId" title="从控号" width="80">
        <template v-slot="{ row }">{{ row.slaverId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="channelId" title="通道号" width="80">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calModel" title="修调模块" width="80"></vxe-table-column>
      <vxe-table-column field="calType" title="修调类型" min-width="80"></vxe-table-column>
      <vxe-table-column field="pointOne" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="pointOneActual" title="实际值" width="80"></vxe-table-column>
      <vxe-table-column field="pointOneSamp" title="采样值" width="80"></vxe-table-column>
      <vxe-table-column field="pointTwo" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="pointTwoActual" title="实际值" width="80"></vxe-table-column>
      <vxe-table-column field="pointTwoSamp" title="采样值" width="80"></vxe-table-column>
      <vxe-table-column field="a" title="A" width="80"></vxe-table-column>
      <vxe-table-column field="b" title="B" width="80"></vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
  </div>
</template>
<script lang="ts">
import { CALIBRATE_TYPE } from '@/shared/config/calibrate'
import { deepClone } from '@/shared/utils'
import { Vue, Component } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class CalRight extends Vue {
  calType = []
  calTypeList = deepClone(CALIBRATE_TYPE)
  calDataList = []

  reCheckForm = {
    IStep: null,
    IStart: null,
    IEnd: null,
    UStep: null,
    UStart: null,
    UEnd: null
  }
  IStepOpts = [200]
  UStepOpts = [200]
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
