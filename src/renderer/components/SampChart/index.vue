<template>
  <div class="echart-box">
    <action-box v-if="showAction"></action-box>
    <v-chart
      ref="echart"
      manual-update
      :autoresize="true"
      @zr:click="handleClick"
    ></v-chart>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/toolbox'
import 'echarts/lib/component/axisPointer'
import 'echarts/lib/component/dataZoom'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/visualMap'
import 'echarts/lib/component/graphic'
import _merge from 'lodash/merge'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { SAMPCHART_Y_MAP } from '@/renderer/utils/util'
import ActionBox from './ActionBox.vue'

interface UpdateOpts {
  time: number
  U: number
  I: number
  [key: string]: any
}

@Component({
  components: {
    'v-chart': ECharts,
    ActionBox
  }
})
export default class SampChart extends Vue {
  @Prop({ type: Number, default: null }) channelId!: number
  @Prop({ type: String, default: 'default' }) size!: string
  @Prop({ type: Boolean, default: true }) autoResize!: boolean
  @Prop({ type: Boolean, default: true }) showAction!: boolean

  public $refs!: {
    echart: ECharts
  }

  sampData: Port.SampItem[] = []

  chartSamp!: string | null
  polar!: any
  selectSamp!: Port.SampItem | null

  get sampChartConfig() {
    return SettingStatus.sampChartConfig
  }

  @Watch('channelId')
  changeChannelId() {
    this.setCharts()
  }

  @Watch('sampChartConfig', { deep: true })
  changeConfig() {
    this.refreshConfig()
  }

  checkList(list: Port.SampItem[]) {
    return list.map(item => {
      if (!item.createTimeStr) {
        item.createTimeStr = item.createTime
      }
      return item
    })
  }

  setCharts(data: any[] = []) {
    this.sampData = data
    let sizeOpts: any = {}
    if (this.size === 'min') {
      sizeOpts = {
        grid: { width: '50%' },
        dataZoom: [
          {
            textStyle: {
              fontSize: 8
            }
          },
          {
            textStyle: {
              fontSize: 8
            },
            left: '4%'
          },
          {
            textStyle: {
              fontSize: 8
            },
            right: '4%'
          }
        ],
        legend: {
          show: false
        },
        xAxis: {
          splitNumber: 5
        },
        yAxis: [
          {
            splitNumber: 10,
            axisLabel: { fontSize: 8 }
          },
          {
            splitNumber: 10,
            axisLabel: { fontSize: 8 }
          }
        ]
      }
    }

    this.selectSamp = null
    const chartConfig = this.getChartConfig()
    const polar = _merge(
      {
        dataset: {
          source: data
        },
        tooltip: {
          trigger: 'axis',
          // axisPointer: {},
          transitionDuration: 0.4,
          padding: 10,
          textStyle: {
            fontSize: 12
          },
          confine: true,
          extraCssText: 'width: 170px',
          formatter: params => {
            let htmlStr = ''
            let mainInfo = true
            for (let i = 0; i < params.length; i++) {
              const { seriesName, marker, value, dimensionNames } = params[i]
              if (value.stepTime === 0) continue
              if (mainInfo) {
                this.selectSamp = value
                const stepId = value.stepId + 1
                const workerId = `工序：${stepId}（${stepId}-${value.loopNum}）`
                const workerStatus = `工步信息：${value.workerName}`
                const stepTime = `工步时间：${value.stepTime}s`
                // const xName = `总工步时间：${value[dimensionNames[0]]}s` // 时间
                const date = `日期：${value.createTimeStr}`
                htmlStr += `${workerId}</br>${workerStatus}</br>${stepTime}</br>${date}</br>`
                mainInfo = false
              }
              const yKey = dimensionNames[1]
              if (yKey) {
                const yValue = value[yKey] // y轴值
                const unit = SAMPCHART_Y_MAP[yKey]?.unit
                htmlStr += `<div>${marker} ${seriesName}：${yValue} ${unit}</div>`
              }
            }
            return htmlStr
          }
        },
        legend: {
          show: true,
          top: '2%'
        },
        dataZoom: [
          {
            type: 'slider',
            filterMode: 'none',
            yAxisIndex: [0],
            left: '2%',
            width: '4%'
          },
          {
            type: 'slider',
            filterMode: 'none',
            yAxisIndex: [1],
            right: '2%',
            width: '4%'
          },
          {
            type: 'slider',
            xAxisIndex: [0],
            filterMode: 'none',
            bottom: '2%',
            height: '4%'
          },
          { type: 'inside', filterMode: 'none' }
        ],
        grid: {
          x: 'center',
          y: 'center',
          width: '74%',
          height: '76%',
          containLabel: false
        },
        xAxis: {
          axisLine: { onZero: false }
        }
      },
      sizeOpts,
      chartConfig
    )
    this.polar = polar
    // if (this.$refs.echart.chart) {
    //   this.$refs.echart.chart.clear()
    // }
    this.$refs.echart.mergeOptions(polar)
  }

  async update(data?: Port.SampItem[]) {
    if (data && data.length > 0) {
      this.sampData = [...this.sampData, ...this.checkList(data)]
      this.$refs.echart.mergeOptions({
        dataset: {
          source: this.sampData
        }
      })
    }
  }

  /** 采样数据整理 */
  async setBaseList(list: Port.SampItem[]) {
    this.setCharts(this.checkList(list))
  }

  /** 获取Y轴配置，添加默认和show属性 */
  getYConfig(key: string) {
    const data = SAMPCHART_Y_MAP[key]
    if (!data) {
      return {
        name: '',
        unit: '',
        color: '',
        key: '',
        show: false
      }
    } else {
      return {
        ...data,
        show: true
      }
    }
  }

  /** 获取采样图标设置 */
  getChartConfig() {
    const y1 = this.getYConfig(this.sampChartConfig.y1)
    const y2 = this.getYConfig(this.sampChartConfig.y2)
    return {
      yAxis: [
        {
          id: '1',
          name: `${y1.name}(${y1.unit})`,
          max: this.sampChartConfig.y1Limt.max,
          min: this.sampChartConfig.y1Limt.min,
          splitNumber: 25,
          position: 'left',
          splitLine: { show: true }
        },
        {
          id: '2',
          name: `${y2.name}(${y2.unit})`,
          show: y2.show,
          max: this.sampChartConfig.y2Limt.max,
          min: this.sampChartConfig.y2Limt.min,
          splitNumber: 25,
          position: 'right',
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: y1.name,
          dimensions: ['stepTimeTotal', y1.key],
          lineStyle: { color: y1.color },
          itemStyle: { color: y1.color },
          yAxisIndex: 0,
          type: 'line',
          seriesLayoutBy: 'row',
          showSymbol: false
        },
        {
          name: y2.name,
          dimensions: ['stepTimeTotal', y2.key],
          lineStyle: { color: y2.color },
          itemStyle: { color: y2.color },
          yAxisIndex: 1,
          type: 'line',
          seriesLayoutBy: 'row',
          showSymbol: false
        }
      ],
      dataZoom: [{ show: y1.show }, { show: y2.show }]
    }
  }

  refreshConfig() {
    if (this.$refs.echart) {
      const cof = this.getChartConfig()
      this.$refs.echart.mergeOptions(cof)
    }
  }

  refresh(data) {
    this.sampData = data
    this.$refs.echart.mergeOptions({
      dataset: {
        source: this.sampData
      }
    })
  }

  resize() {
    setTimeout(() => {
      this.setCharts(this.sampData)
    }, 180)
  }

  /** 获取echart实例 */
  getEchart(cb: (echart: any) => any) {
    cb(this.$refs?.echart?.chart)
  }

  handleClick() {
    if (this.selectSamp) {
      this.$emit('locate', this.selectSamp)
    }
  }

  mounted() {
    this.$nextTick(() => {
      this.setCharts()
    })
  }
}
</script>

<style lang="scss">
.echart-box,
.echarts {
  width: 100%;
  height: 100%;
}
</style>
