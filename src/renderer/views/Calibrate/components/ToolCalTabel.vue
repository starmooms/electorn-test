<template>
  <div>
    <div class="tool-cal-action">
      <el-button v-for="item in rangeList" :key="item" type="primary">
        {{ `${item}${calTypeKey}` }}获取采样
      </el-button>
    </div>
    <vxe-grid
      border
      auto-resize
      show-overflow
      resizable
      ref="xTabel"
      :data="resultList"
      size="mini"
      max-width="160px"
      height="600px"
    >
      <!-- eslint-disable -->
      <vxe-table-column field="channelId" title="通道号" width="60">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calTypeName" title="修调类型" min-width="80"></vxe-table-column>
      <vxe-table-column field="point1Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column :title="`采样值(${sampUnit})`" width="90">
        <template v-slot="{ row }">
          {{ row.sampResult[row.point1] }}
        </template>
      </vxe-table-column>
      <vxe-table-column field="point2Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column :title="`采样值(${sampUnit})`" width="90">
        <template v-slot="{ row }">
          {{ row.sampResult[row.point2] }}
        </template>
      </vxe-table-column>
      <vxe-table-column field="a" title="A" width="80">
        <template v-slot="{ row }">
          {{ row.abResult.a }}
        </template>
      </vxe-table-column>
      <vxe-table-column field="b" title="B" width="80">
        <template v-slot="{ row }">
          {{ row.abResult.b }}
        </template>
      </vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
    <div class="submit-box">
      <el-button type="primary" @click="submit">计算并发送AB</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import { CHANNEL_NUM } from '@/shared/config/channel'
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class ToolCalTabel extends Vue {
  rangeList: number[] = []
  calTypeKey = 'V'
  sampUnit = 'mA'

  calSampResult: CalibrateTR.ToolCalSampResult = {}
  calAbResult: CalibrateTR.ToolCalAbResult = {}
  resultList: CalibrateTR.ToolCalChannelList[] = []

  createCal({ selectType, selectRange }: CalibrateTR.ToolCalCreateCal) {
    const { label: calTypeName, rangeType: unit } = selectType
    const sampUnit = `m${unit}`
    const rangeList = selectRange.value

    const channelNum = CHANNEL_NUM.channel.num
    const resultList: CalibrateTR.ToolCalChannelList[] = []
    const calSampResult: CalibrateTR.ToolCalSampResult = {}
    const calAbResult: CalibrateTR.ToolCalAbResult = {}

    for (let i = 0; i < channelNum; i++) {
      const sampResult: CalibrateTR.ToolCalSampResultItem = {}
      const abResult: CalibrateTR.ToolCalAbResultChItem = {}
      let lastPoint = 0

      rangeList.forEach((point, index) => {
        sampResult[point] = null
        if (index > 0) {
          const pointIndex = index
          const abResultItem = {
            pointIndex,
            a: null,
            b: null
          }
          abResult[pointIndex] = abResultItem
          resultList.push({
            channelId: i,
            calTypeName: calTypeName,
            point1: lastPoint,
            point1Name: `${lastPoint} ${unit}`,
            point2: point,
            point2Name: `${point} ${unit}`,
            sampResult,
            abResult: abResultItem
          })
        }
        lastPoint = point
      })

      calSampResult[i] = sampResult
      calAbResult[i] = abResult
    }

    this.resultList = resultList
    this.calSampResult = calSampResult
    this.calAbResult = calAbResult
    this.rangeList = rangeList
    this.sampUnit = sampUnit
  }

  submit() {
    Object.entries(this.calSampResult).forEach(([channelId, sampResult]) => {
      let lastPoint: number | null = null
      const abResult = this.calAbResult[channelId]
      Object.entries(sampResult).forEach(([pointId, val], index) => {
        const point = val
        if (index > 0) {
          const abResultItem = abResult[index]
          abResultItem.a = 3
          abResultItem.b = 54 + Number(channelId)
          // if (point !== null && lastPoint !== null) {
          //   abResultItem.a = point + 6
          //   abResultItem.b = 2
          // } else {
          //   abResultItem.a = null
          //   abResultItem.b = null
          // }
        }
        lastPoint = point
      })
    })
    // Object.keys(this.calAbResult)
  }

  // mounted() {
  //   this.createCal()
  // }
}
</script>
<style lang="scss" scoped>
.tool-cal-action {
  margin: 20px 0;
}
.submit-box {
  display: flex;
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
