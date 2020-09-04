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
export default class TrendChart extends Vue {
  @Prop({ type: Number, default: null }) channelId!: number
  @Prop({ type: String, default: 'default' }) size!: string
  @Prop({
    type: Object,
    default() {
      return {}
    }
  })
  grid!: any

  public $refs!: {
    echart: ECharts
  }

  xData!: string[]
  UData!: [string, number][]
  IData!: [string, number][]
  xMinUnix = 0
  sampling = SettingStatus.sampling
  lastTime = 0
  chartSamp!: string | null
  polar!: any

  @Watch('channelId')
  changeChannelId() {
    this.setCharts()
  }

  setCharts(UData: any[] = [], IData: any[] = []) {
    this.xData = []
    this.UData = UData
    this.IData = IData
    // this.chartSamp = this.UData.length > 20000 ? 'average' : null
    this.chartSamp = null
    const tip =
      this.UData.length === 0 && this.IData.length === 0 ? '暂无数据' : ''
    let sizeOpts: any = {}
    if (this.size === 'min') {
      sizeOpts = {
        grid: { left: 40, right: 40 },
        dataZoom: [
          {
            height: 20,
            bottom: 0
          }
        ],
        xAxis: {
          splitNumber: 5
        },
        yAxis: [
          {
            splitNumber: 10,
            axisLabel: { fontSize: 10 }
          },
          {
            splitNumber: 10,
            axisLabel: { fontSize: 10 }
          }
        ]
        // series: [{ itemStyle: { opacity: 0 } }, { itemStyle: { opacity: 0 } }]
      }
    }
    const polar = merge(
      {
        tooltip: {
          // alwaysShowContent: false,
          trigger: 'axis',
          transitionDuration: 0,
          // backgroundColor: 'rgba(245, 245, 245, 0.8)',
          // borderWidth: 1,
          // borderColor: '#ccc',
          padding: 10,
          textStyle: {
            fontSize: 12
            // color: '#000'
          },
          confine: true,
          extraCssText: 'width: 170px',
          formatter(params, ticket, callback) {
            let htmlStr = ''
            for (let i = 0; i < params.length; i++) {
              const param = params[i]
              if (i === 0) {
                const xName = param.value[0] // x轴的名称
                htmlStr += xName + '<br/>' // x轴的名称
              }
              const seriesName = param.seriesName // 图例名称
              const value = param.value[1] // y轴值
              const unit = i === 0 ? 'mV' : 'mA'
              htmlStr += `<div>${param.marker} ${seriesName}：${value} ${unit}</div>`
            }
            return htmlStr
          }
          // axisPointer: {
          //   type: 'line',
          //   // trigger: 'axis',
          //   extraCssText: 'width: 400px'
          // }
        },
        legend: {
          show: true
          // data: ['电压(mV)', '电流(mA)']
        },
        xAxis: {
          type: 'time'
          // type: 'value',
          // max: 1000,
          // min: 0
          // data: this.xData
          // max: function(value) {
          //   return value.max + 3600
          // }
          // splitNumber: 5,
        },
        // visualMap: {
        //   show: false,
        //   dimension: 0,
        //   pieces: [
        //     {
        //       gt: 1000,
        //       lt: 2000,
        //       color: 'green'
        //     },
        //     {
        //       gt: 6,
        //       lte: 8,
        //       color: 'red'
        //     }
        //   ],
        //   outOfRange: { opacity: 1 },
        //   inRange: { opacity: 0 }
        // },
        dataZoom: [
          {
            type: 'slider',
            xAxisIndex: [0],
            show: true
          },
          {
            type: 'inside'
          }
        ],
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
            data: this.UData,
            type: 'line',
            yAxisIndex: 0,
            lineStyle: { color: 'green' },
            itemStyle: { color: 'green' },
            sampling: this.chartSamp,
            showSymbol: false
          },
          {
            name: '电流',
            data: this.IData,
            type: 'line',
            yAxisIndex: 1,
            lineStyle: { color: 'red' },
            itemStyle: { color: 'red' },
            sampling: this.chartSamp,
            showSymbol: false
          }
        ],
        graphic: [
          {
            type: 'text',
            id: 'test1',
            left: 'center',
            top: 'middle',
            z: 9,
            style: {
              fill: '#333',
              text: [tip],
              font: '15px Microsoft YaHei',
              zIndex: 999
            }
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

  async update(data?: UpdateOpts) {
    // let text = ''
    // let sampling: string | null = this.chartSamp
    // if (this.UData.length === 0 && this.IData.length === 0) {
    //   text = '暂无数据'
    //   sampling = null
    // }
    const { UData, IData, lastTime, lastX } = await getSampWorker.getSampList(
      [data],
      this.lastTime
    )
    this.lastTime = lastTime
    // this.xData.shift()
    // this.xData.push(lastX)
    this.UData.shift()
    this.IData.shift()
    this.UData = [...this.UData, ...UData]
    this.IData = [...this.IData, ...IData]
    this.$refs.echart.mergeOptions({
      xAxis: { data: this.xData },
      series: [{ data: this.UData }, { data: this.IData }],
      graphic: [
        {
          style: { text: [''] }
        }
      ]
    })
    // if (data) {
    //   const { UData, IData, lastTime, lastX } = await getSampWorker.getSampList(
    //     [data],
    //     this.lastTime
    //   )
    //   if (this.lastTime >= lastTime) return
    //   this.lastTime = lastTime
    //   this.xData[this.xData.length - 1] = lastX
    //   if (this.$refs.echart.chart) {
    //     // this.$refs.echart.chart.appendData({
    //     //   seriesIndex: '0',
    //     //   data: UData
    //     // })
    //     // this.$refs.echart.chart.appendData({
    //     //   seriesIndex: '1',
    //     //   data: IData
    //     // })
    //     // this.$refs.echart.mergeOptions({
    //     //   xAxis: { data: this.xData }
    //     //   // graphic: [
    //     //   //   {
    //     //   //     style: { text: [''] }
    //     //   //   }
    //     //   // ]
    //     // })
    //     // this.$refs.echart.mergeOptions({
    //     //   xAxis: { data: this.xData },
    //     //   series: [{ data: this.UData }, { data: this.IData }],
    //     //   graphic: [
    //     //     {
    //     //       style: { text: [''] }
    //     //     }
    //     //   ]
    //     // })
    //   }
    // } else {
    //   // let text = ''
    //   // let sampling: string | null = this.chartSamp
    //   // if (this.UData.length === 0 && this.IData.length === 0) {
    //   //   text = '暂无数据'
    //   //   sampling = null
    //   // }
    //   // this.$refs.echart.mergeOptions({
    //   //   xAxis: { data: [] },
    //   //   series: [
    //   //     { data: this.UData, sampling },
    //   //     { data: this.IData, sampling }
    //   //   ],
    //   //   graphic: [
    //   //     {
    //   //       style: { text: [text] }
    //   //     }
    //   //   ]
    //   // })
    // }
  }

  /** 采样数据整理 */
  async setBaseList(list: any, start?: number, end?: number) {
    let fullNull = false
    if (start && end) {
      const first = list[0]
      const last = list[list.length - 1]
      if (!first || first.createTime !== start) {
        list.unshift({
          createTime: start,
          U: '-',
          I: '-'
        })
      }
      if (!last || last !== end) {
        list.push({
          createTime: end,
          U: '-',
          I: '-'
        })
      }
      fullNull = end - start <= 1000
    }
    const { UData, IData, lastTime } = await getSampWorker.getSampList(
      list,
      undefined,
      fullNull
    )
    this.lastTime = lastTime
    this.setCharts(UData, IData)
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

  beforeDestroy() {}
}
</script>

<style lang="scss">
.echart-box {
  width: 100%;
  height: 100%;
}
.echarts {
  width: 100%;
  height: 100%;
}
</style>
