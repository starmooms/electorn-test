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
import { merge } from '@/shared/utils'
import { SettingStatus } from '../store/modules/Setting'
import dayjs from 'dayjs'

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

  xData!: number[]
  UData!: number[][]
  IData!: number[][]
  xMinUnix = 0
  sampling = SettingStatus.sampling
  lastTime = 0

  @Watch('channelId')
  changeChannelId() {
    this.setCharts()
  }

  setCharts() {
    this.xData = [0]
    this.UData = []
    this.IData = []
    let sizeOpts: any = {}
    if (this.size === 'min') {
      sizeOpts = {
        grid: { left: 40, right: 40 },
        dataZoom: [
          {
            height: 20
          }
        ],
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
          // backgroundColor: 'rgba(245, 245, 245, 0.8)',
          // borderWidth: 1,
          // borderColor: '#ccc',
          padding: 10,
          textStyle: {
            fontSize: 12
            // color: '#000'
          },
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
            showSymbol: false,
            sampling: 'average'
          },
          {
            name: '电流',
            data: this.IData,
            type: 'line',
            yAxisIndex: 1,
            lineStyle: { color: 'red' },
            itemStyle: { color: 'red' },
            sampling: 'average',
            showSymbol: false
          }
        ]
      },
      sizeOpts
    )
    this.$refs.echart.mergeOptions(polar)
  }

  fullNullData(item: any, lastTime = this.lastTime) {
    const UData: any[] = []
    const IData: any[] = []
    if (item.createTime - lastTime >= 2) {
      const len = Math.abs(item.createTime - lastTime)
      for (let i = 1; i < len; i++) {
        const full = dayjs.unix(lastTime + i).format('YYYY-MM-DD HH:mm:ss')
        // this.UData.push([full, '-'])
        // this.IData.push([full, '-'])
        UData.push([full, '-'])
        IData.push([full, '-'])
      }
    }
    this.lastTime = item.createTime
    return {
      UData,
      IData
    }
  }

  update(data?: UpdateOpts) {
    if (data) {
      const time = dayjs.unix(data.createTime).format('YYYY-MM-DD HH:mm:ss')
      // if (this.UData.length - 1 <= time -2) {
      //   const fillData = []

      //   this.UData.push([time - 1, null])
      // }
      // this.xData.push(time)
      const { UData, IData } = this.fullNullData(data)
      UData.push([time, data.U])
      IData.push([time, data.I])
      this.xData.push(time)
      if (this.$refs.echart.chart) {
        this.$refs.echart.chart.appendData({
          seriesIndex: 0,
          data: UData
        })
        this.$refs.echart.chart.appendData({
          seriesIndex: 1,
          data: IData
        })
        this.$refs.echart.mergeOptions({
          xAxis: { data: this.xData }
        })
      }
    } else {
      this.$refs.echart.mergeOptions({
        xAxis: { data: this.xData },
        series: [{ data: this.UData }, { data: this.IData }]
      })
    }
  }

  setBaseList(list: any) {
    if (list.length > 0) {
      const min = list[0].createTime - 1
      let lastTime = list[0].createTime
      // let lastX = min
      list.forEach(item => {
        // const x = item.createTime - min
        // if (x - lastX > 2) {
        //   console.log('添加null')
        //   this.UData.push([lastX + 1, null])
        //   this.IData.push([lastX + 1, null])
        // }
        const { UData, IData } = this.fullNullData(item, lastTime)
        this.UData = [...this.UData, ...UData]
        this.IData = [...this.IData, ...IData]
        const x = dayjs.unix(item.createTime).format('YYYY-MM-DD HH:mm:ss')
        this.UData.push([x, item.U])
        this.IData.push([x, item.I])
        lastTime = item.createTime
        // lastX = x
      })
      this.lastTime = lastTime
      this.update()
    }
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
