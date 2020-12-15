<template>
  <div v-loading="loading">
    <div class="tool-cal-action">
      <el-tooltip
        class="item"
        effect="dark"
        content="仅重置界面，不影响当前工装AB值"
        placement="top-start"
      >
        <el-button type="primary" @click="clean">
          重置
        </el-button>
      </el-tooltip>

      <el-switch
        v-model="calFormAB"
        class="tool-switch"
        inactive-text="根据AB值采样"
      />
      <div class="samp-btn-box">
        <el-button
          v-for="item in rangeList"
          :key="item"
          type="primary"
          @click="getSamp(item)"
        >
          {{ `${item}${calTypeKey}` }}获取采样
        </el-button>
      </div>
    </div>
    <vxe-grid
      ref="xTabel"
      class="tool-cal-table"
      border
      auto-resize
      show-overflow
      resizable
      size="mini"
      max-width="160px"
      height="600px"
      :cell-class-name="cellClassName"
      :data="resultList"
    >
      <!-- eslint-disable -->
      <vxe-table-column field="channelId" title="通道号" width="60">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calTypeName" title="修调类型" min-width="80"></vxe-table-column>
      <vxe-table-column field="point1Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="point1" :title="`采样值(${calTypeKey})`" width="90">
        <template v-slot="{ row }">{{ row.sampResult[row.point1].value }}</template>
      </vxe-table-column>
      <vxe-table-column field="point2Name" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="point2" :title="`采样值(${calTypeKey})`" width="90">
        <template v-slot="{ row }">{{ row.sampResult[row.point2].value }}</template>
      </vxe-table-column>
      <vxe-table-column field="a" title="A" width="80">
        <template v-slot="{ row }">{{ row.abResult.a }}</template>
      </vxe-table-column>
      <vxe-table-column field="b" title="B" width="80">
        <template v-slot="{ row }">{{ row.abResult.b }}</template>
      </vxe-table-column>
      <vxe-table-column title="操作" width="220">
        <template v-slot="{ row }">
          <el-button type="primary" title="清除工装AB" @click="cleanAB(row)" >清除AB</el-button>
          <el-button type="primary" @click="submitChannel(row)">计算并发送AB</el-button>
        </template>
      </vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
    <div class="submit-box">
      <el-button type="primary" @click="computAbAll">仅计算AB</el-button>
      <el-button type="primary" @click="submitAll">计算并发送AB</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import { calToolRead, calToolSet } from '@/renderer/ipc/channel'
import { getVmParent } from '@/renderer/utils/util'
import { readTypeEnum } from '@/shared/config/calibrate'
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
  /** 工装是否根据ab采样 */
  calFormAB = false

  cellClassName({ row, column }: any) {
    const field = column.property
    if (field === 'point1' || field === 'point2') {
      return row.sampResult[row[field]].type !== 3 ? 'form-ab' : ''
    }
  }

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

  /** 重置 */
  async clean() {
    Object.entries(this.calAbResult).forEach(([, abResult]) => {
      Object.entries(abResult).forEach(([, abResultItem]) => {
        abResultItem.a = null
        abResultItem.b = null
      })
    })
    Object.entries(this.calSampResult).forEach(([, sampResult]) => {
      for (const key in sampResult) {
        sampResult[key] = {
          type: 3,
          value: null
        }
      }
    })
    this.$message.success('重置成功')
  }

  /** 通道清除AB */
  async cleanAB(row: CalibrateTR.ToolCalChannelList) {
    if (this.loading) return
    try {
      this.loading = true
      const channelId = row.channelId
      const pointIndex = row.abResult.pointIndex
      const abResultItem = this.calAbResult?.[channelId]?.[pointIndex]
      if (!abResultItem) {
        return this.$message.error(`A B 结果不存在`)
      }

      const data = await this.calToolSet({
        type: 4,
        channelIds: [channelId],
        calType: this.calType,
        pointIndex
      })
      if (data && data.status) {
        abResultItem.a = null
        abResultItem.b = null
        this.$message.success(`通道${channelId + 1} 清除AB成功`)
      }
    } finally {
      this.loading = false
    }
  }

  /** 创建采样 */
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
        sampResult[point] = {
          type: 3,
          value: null
        }
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

    this.calFormAB = false
    this.resultList = resultList
    this.calSampResult = calSampResult
    this.calAbResult = calAbResult
    this.rangeList = rangeList
    this.channelIds = channelIds
  }

  pointFormatList(listData: any) {
    return Object.keys(listData)
      .map(Number)
      .sort((a, b) => a - b)
  }

  /** 计算ab */
  computAb(channelIds: number[], computRange: number[]) {
    const nullPoint: any = {}
    const typeErrorPoint: any = {}
    const abList: CalibrateTB.AbListItem[] = []
    let computedError: null | Error = null

    /** 本次计算的采样范围 */
    const rangeList: { point: number; pointIndex: number }[] = []
    this.rangeList.forEach((point, pointIndex) => {
      if (computRange.includes(point)) {
        rangeList.push({
          point,
          pointIndex
        })
      }
    })

    channelIds.forEach(channelId => {
      const abResult = this.calAbResult[channelId]
      const sampResult = this.calSampResult[channelId]
      let lastPoint: number | null = null

      // 循环修调点计算ab
      rangeList.forEach(({ point, pointIndex }) => {
        if (pointIndex > 0 && lastPoint !== null) {
          const { type: point1Type, value: point1Samp } = sampResult[lastPoint]
          const { type: point2Type, value: point2Samp } = sampResult[point]
          const abResultItem = abResult[pointIndex]
          let canComput = true
          if (point1Type !== 3 || point2Type !== 3) {
            canComput = false
            if (point1Type !== 3) typeErrorPoint[lastPoint] = true
            if (point2Type !== 3) typeErrorPoint[point] = true
          } else if (point1Samp === null || point2Samp === null) {
            canComput = false
            if (point1Samp === null) nullPoint[lastPoint] = true
            if (point2Samp === null) nullPoint[point] = true
          }

          if (canComput) {
            const { a, b, err } = computedCalAB(
              point1Samp!,
              lastPoint,
              point2Samp!,
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
          }
        }
        lastPoint = point
      })
    })

    const nullPointList = this.pointFormatList(nullPoint)
    const typeErrorList = this.pointFormatList(typeErrorPoint)

    computedError = computedError as null | Error
    return {
      status:
        nullPointList.length === 0 &&
        typeErrorList.length === 0 &&
        !computedError,
      nullPointList,
      typeErrorList,
      abList,
      computedError: computedError
    }
  }

  /** 提交AB 值 */
  async submit(channelIds: number[], rangeList: number[]) {
    if (this.loading) return
    try {
      this.loading = true
      const computerRestul = this.computAb(channelIds, rangeList)
      if (!computerRestul.status) {
        const { computedError, nullPointList, typeErrorList } = computerRestul
        if (computedError) {
          return this.$message.error(computedError.message)
        } else if (typeErrorList) {
          const msg = typeErrorList.map(item => `${item}${this.calTypeKey}`)
          return this.$message.error(
            `${msg.join('、')} 的采样值为根据AB值获取，不能进行AB计算`
          )
        } else {
          const msg = nullPointList.map(item => `${item}${this.calTypeKey}`)
          return this.$message.error(`${msg.join('、')} 未采样`)
        }
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

  /** 提交全部AB */
  submitAll() {
    this.submit(this.channelIds, this.rangeList)
  }

  /** 计算所有AB */
  computAbAll() {
    this.computAb(this.channelIds, this.rangeList)
  }

  /** 通道计算提交AB */
  submitChannel(row: CalibrateTR.ToolCalChannelList) {
    this.submit([row.channelId], [row.point1, row.point2])
  }

  /** 获取采样 */
  async getSamp(rangeNum: number) {
    if (this.loading === true) return
    try {
      this.loading = true
      const parent = getVmParent<Calibrate>(this, 'Calibrate')
      const ip = parent.getToolIp()
      if (ip === false) return
      const type = this.calFormAB ? readTypeEnum.samp : readTypeEnum.trueSamp
      const result = await calToolRead({
        config: {
          ip
        },
        readCal: {
          masterId: 0,
          slaverId: 0,
          channelIds: this.channelIds,
          type,
          calType: this.calType
        }
      })
      if (result.status) {
        const data = result.data
        Object.keys(data).forEach(channelId => {
          this.calSampResult[channelId][rangeNum] = {
            type,
            value: data[channelId].samp
          }
        })
      }
    } finally {
      this.loading = false
    }
  }
}
</script>
<style lang="scss" scoped>
.tool-cal-action {
  margin: 20px 0;

  .tool-switch {
    margin-left: 20px;
  }

  .samp-btn-box {
    margin-top: 10px;
  }

  .el-button {
    padding: 7px 6px;
  }
}

.tool-cal-table {
  ::v-deep .form-ab {
    background-color: #f7f7f7;
  }
}

.submit-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
