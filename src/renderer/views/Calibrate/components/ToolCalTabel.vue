<template>
  <div v-loading="loading">
    <div class="tool-cal-action">
      <el-button type="primary" @click="clean">清除</el-button>
      <el-button
        v-for="item in rangeList"
        :key="item"
        type="primary"
        @click="getSamp(item)"
      >
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
      <vxe-table-column :title="`采样值(${calTypeKey})`" width="90">
        <template v-slot="{ row }">{{ row.sampResult[row.point1] }}</template>
      </vxe-table-column>
      <vxe-table-column field="point2Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column :title="`采样值(${calTypeKey})`" width="90">
        <template v-slot="{ row }">{{ row.sampResult[row.point2] }}</template>
      </vxe-table-column>
      <vxe-table-column field="a" title="A" width="80">
        <template v-slot="{ row }">{{ row.abResult.a }}</template>
      </vxe-table-column>
      <vxe-table-column field="b" title="B" width="80">
        <template v-slot="{ row }">{{ row.abResult.b }}</template>
      </vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
    <div class="submit-box">
      <el-button type="primary" @click="computAb">仅计算AB</el-button>
      <el-button type="primary" @click="submit">计算并发送AB</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import { calToolRead, calToolSet } from '@/renderer/ipc/channel'
import { getVmParent } from '@/renderer/utils/util'
import { computedCalAB } from '@/shared/utils'
import { Vue, Component } from 'vue-property-decorator'
import Calibrate from '../index.vue'

@Component
export default class ToolCalTabel extends Vue {
  $parent!: Calibrate
  loading = false
  rangeList: number[] = []
  calTypeKey = ''
  /** 校准类型 */
  calType = ''
  /** 当前通道 */
  channelIds: number[] = []
  /** 采样结果对象 */
  calSampResult: CalibrateTR.ToolCalSampResult = {}
  /** 采样计算ab结果对象 */
  calAbResult: CalibrateTR.ToolCalAbResult = {}
  /** 通道结果显示 */
  resultList: CalibrateTR.ToolCalChannelList[] = []

  /** 获取工装ip */
  getToolIp() {
    const parent = getVmParent<Calibrate>(this, 'Calibrate')
    return parent.getToolIp()
  }

  /** 设置校准, 清除校准 */
  async calToolSet(params: Partial<ipcReq.SetCalOpts> & { type: number }) {
    const ip = this.getToolIp()
    if (ip === false) return
    const data = await calToolSet({
      config: {
        ip
      },
      setCal: {
        masterId: -1,
        slaverId: 0,
        channelIds: [],
        ...params
      }
    })
    return data
  }

  async clean() {
    if (this.loading) return
    try {
      this.loading = true
      if (this.channelIds.length === 0) {
        return this.$message.info('未生成校准')
      }
      const data = await this.calToolSet({
        type: 4,
        channelIds: this.channelIds,
        calType: this.calType
      })
      if (data && data.status) {
        Object.entries(this.calAbResult).forEach(([, abResult]) => {
          Object.entries(abResult).forEach(([, abResultItem]) => {
            abResultItem.a = null
            abResultItem.b = null
          })
        })
        Object.entries(this.calSampResult).forEach(([, sampResult]) => {
          for (const key in sampResult) {
            sampResult[key] = null
          }
        })
        this.$message.success('清除成功')
      }
    } finally {
      this.loading = false
    }
  }

  createCal({
    selectType,
    selectRange,
    channelIds
  }: CalibrateTR.ToolCalCreateCal) {
    const { label: calTypeName, rangeType: unit, type } = selectType
    const rangeList = selectRange.value
    this.calType = type
    this.calTypeKey = unit

    const resultList: CalibrateTR.ToolCalChannelList[] = []
    const calSampResult: CalibrateTR.ToolCalSampResult = {}
    const calAbResult: CalibrateTR.ToolCalAbResult = {}

    channelIds.forEach(channelId => {
      const sampResult: CalibrateTR.ToolCalSampResultItem = {}
      const abResult: CalibrateTR.ToolCalAbResultChItem = {}
      let lastPoint = 0

      rangeList.forEach((point, index) => {
        sampResult[point] = null
        if (index > 0) {
          const pointIndex = index
          const abResultItem = {
            pointIndex,
            point1: lastPoint,
            point2: point,
            a: null,
            b: null
          }
          abResult[pointIndex] = abResultItem
          resultList.push({
            channelId,
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

      calSampResult[channelId] = sampResult
      calAbResult[channelId] = abResult
    })

    this.resultList = resultList
    this.calSampResult = calSampResult
    this.calAbResult = calAbResult
    this.rangeList = rangeList
    this.channelIds = channelIds
  }

  /** 计算ab */
  computAb() {
    const nullPoint: any = {}
    const abList: CalibrateTB.AbListItem[] = []
    let computedError: null | Error = null

    this.channelIds.forEach(channelId => {
      const abResult = this.calAbResult[channelId]
      const sampResult = this.calSampResult[channelId]
      let lastPoint: number | null = null

      // 循环修调点计算ab
      this.rangeList.forEach((point, pointIndex) => {
        if (pointIndex > 0 && lastPoint !== null) {
          const point1Samp = sampResult[lastPoint]
          const point2Samp = sampResult[point]
          const abResultItem = abResult[pointIndex]
          if (point1Samp !== null && point2Samp !== null) {
            const { a, b, err } = computedCalAB(
              point1Samp,
              lastPoint,
              point2Samp,
              point,
              true
            )

            if (err) {
              computedError = err
            }
            abResultItem.a = a
            abResultItem.b = b
            abList.push({
              channelId,
              a,
              b,
              pointIndex,
              calType: this.calType
            })
          } else {
            abResultItem.a = null
            abResultItem.b = null
            if (point1Samp === null) nullPoint[lastPoint] = true
            if (point2Samp === null) nullPoint[point] = true
          }
        }
        lastPoint = point
      })
    })

    const errorPoint = Object.keys(nullPoint)
      .map(Number)
      .sort((a, b) => a - b)

    computedError = computedError as null | Error
    return {
      status: errorPoint.length === 0 && !computedError,
      errorPoint,
      abList,
      computedError: computedError
    }
  }

  /** 提交AB 值 */
  async submit() {
    if (this.loading) return
    try {
      this.loading = true
      const computerRestul = this.computAb()
      if (!computerRestul.status) {
        const { computedError, errorPoint } = computerRestul
        if (computedError) {
          return this.$message.error(computedError.message)
        }
        const msg = errorPoint.map(item => `${item}${this.calTypeKey}`)
        return this.$message.error(`${msg.join('、')} 未采样`)
      }

      const abList = computerRestul.abList
      if (abList.length === 0) {
        return this.$message.info('暂无数据')
      }

      const data = await this.calToolSet({
        type: 2,
        calType: this.calType,
        abList
      })
      if (data && data.status) {
        this.$message.success('工装校准成功')
      }
    } finally {
      this.loading = false
    }
  }

  /** 获取采样 */
  async getSamp(rangeNum: number) {
    if (this.loading === true) return
    try {
      this.loading = true
      const parent = getVmParent<Calibrate>(this, 'Calibrate')
      const ip = parent.getToolIp()
      if (ip === false) return
      const result = await calToolRead({
        config: {
          ip
        },
        readCal: {
          masterId: 0,
          slaverId: 0,
          channelIds: this.channelIds,
          type: 1,
          calType: this.calType
        }
      })
      if (result.status) {
        const data = result.data
        Object.keys(data).forEach(channelId => {
          this.calSampResult[channelId][rangeNum] = data[channelId].samp
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }
}
</script>
<style lang="scss" scoped>
.tool-cal-action {
  margin: 20px 0;
  .el-button {
    padding: 7px 6px;
  }
}
.submit-box {
  display: flex;
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
