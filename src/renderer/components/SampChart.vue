<template>
  <div class="echart-box">
    <v-chart ref="echart" manual-update :autoresize="true"></v-chart>
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
import { merge } from '@/shared/utils'
import { SettingStatus } from '../store/modules/Setting'
import getSampWorker from '@/renderer/utils/getSampWorker'
import dayjs from 'dayjs'
import { formatTimeStr } from '../utils/util'

interface UpdateOpts {
  time: number
  U: number
  I: number
  [key: string]: any
}

@Component({
  components: {
    'v-chart': ECharts
  }
})
export default class SampChart extends Vue {
  @Prop({ type: Number, default: null }) channelId!: number
  @Prop({ type: String, default: 'default' }) size!: string
  @Prop({ type: Boolean, default: true }) autoResize!: boolean

  public $refs!: {
    echart: ECharts
  }

  xData!: string[]
  sampling = SettingStatus.sampling
  sampData: Port.SampItem[] = []

  chartSamp!: string | null
  polar!: any

  @Watch('channelId')
  changeChannelId() {
    this.setCharts()
  }

  checkList(list: Port.SampItem[]) {
    return list.map(item => {
      if (!item.createTimeStr) {
        item.createTimeStr = dayjs.unix(item.createTime).format(formatTimeStr)
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

    const polar = merge(
      {
        dataset: {
          source: data
        },
        tooltip: {
          trigger: 'axis',
          transitionDuration: 0,
          padding: 10,
          textStyle: {
            fontSize: 12
          },
          confine: true,
          extraCssText: 'width: 170px',
          formatter(params, ticket, callback) {
            let htmlStr = ''
            for (let i = 0; i < params.length; i++) {
              const { seriesName, marker, value, dimensionNames } = params[i]
              if (i === 0) {
                const xName = value[dimensionNames[0]] // 时间
                const workerId = `工步ID：${value.workerId + 1}`
                const workerStatus = `工步信息：${value.workerStatus.name}`
                htmlStr += `${xName}</br>${workerId}</br>${workerStatus}</br>`
              }
              const yValue = value[dimensionNames[1]] // y轴值
              const unit = i === 0 ? 'mV' : 'mA'
              htmlStr += `<div>${marker} ${seriesName}：${yValue} ${unit}</div>`
            }
            return htmlStr
          }
        },
        legend: {
          show: true,
          top: '2%'
        },
        dataZoom: [
          { type: 'slider', xAxisIndex: [0], bottom: '2%', height: '4%' },
          { type: 'slider', yAxisIndex: [0], left: '2%', width: '4%' },
          { type: 'slider', yAxisIndex: [1], right: '2%', width: '4%' },
          { type: 'inside' }
        ],
        grid: {
          x: 'center',
          y: 'center',
          width: '74%',
          height: '76%',
          containLabel: false
        },
        xAxis: {
          type: 'time'
        },
        yAxis: [
          {
            name: '电压(mV)',
            max: this.sampling.U.max,
            min: this.sampling.U.min,
            splitNumber: 25,
            position: 'left',
            splitLine: { show: true }
          },
          {
            name: '电流(mA)',
            max: this.sampling.I.max,
            min: this.sampling.I.min,
            splitNumber: 25,
            position: 'right',
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '电压',
            seriesLayoutBy: 'row',
            dimensions: ['createTimeStr', 'U'],
            type: 'line',
            yAxisIndex: 0,
            lineStyle: { color: 'green' },
            itemStyle: { color: 'green' },
            showSymbol: false
          },
          {
            name: '电流',
            type: 'line',
            yAxisIndex: 1,
            dimensions: ['createTimeStr', 'I'],
            lineStyle: { color: 'red' },
            itemStyle: { color: 'red' },
            seriesLayoutBy: 'row',
            showSymbol: false
          }
        ]
      },
      sizeOpts
    )
    this.polar = polar
    if (this.$refs.echart.chart) {
      this.$refs.echart.chart.clear()
    }
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

  resize() {
    setTimeout(() => {
      this.setCharts(this.sampData)
    }, 180)
  }

  @Watch('sampling')
  upDateSampling() {
    this.$refs.echart.mergeOptions({
      yAxis: [
        { max: this.sampling.U.max, min: this.sampling.U.min },
        { max: this.sampling.I.max, min: this.sampling.I.min }
      ]
    })
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
