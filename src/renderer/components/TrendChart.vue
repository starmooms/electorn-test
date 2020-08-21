<template>
  <div class="echart-box">
    <v-chart ref="echart" :manual-update="true" :autoresize="true"></v-chart>
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
import { merge } from '@/shared/utils'
import { SettingStatus } from '../store/modules/Setting'

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
  sampling = SettingStatus.sampling

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
        ],
        series: [{ itemStyle: { opacity: 0 } }, { itemStyle: { opacity: 0 } }]
      }
    }
    const polar = merge(
      {
        tooltip: {
          // alwaysShowContent: false,
          trigger: 'axis',
          backgroundColor: 'rgba(245, 245, 245, 0.8)',
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          textStyle: {
            color: '#000'
          },
          extraCssText: 'width: 170px'
          // axisPointer: {
          //   type: 'line',
          //   // trigger: 'axis',
          //   extraCssText: 'width: 400px'
          // }
        },
        legend: {
          show: true,
          data: ['电压', '电流']
        },
        xAxis: {
          type: 'value',
          data: this.xData
          // max: function(value) {
          //   return value.max + 3600
          // }
          // splitNumber: 5,
        },
        dataZoom: [
          {
            type: 'slider',
            xAxisIndex: [0],
            show: true
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
            tooltip: {
              formatter: function(param) {
                return `电压：${param.data[1]}mV`
              }
            }
          },
          {
            name: '电流',
            data: this.IData,
            type: 'line',
            yAxisIndex: 1,
            lineStyle: { color: 'red' },
            itemStyle: { color: 'red' }
          }
        ]
      },
      sizeOpts
    )
    this.$refs.echart.mergeOptions(polar)
  }

  update(data: UpdateOpts) {
    const time = data.time
    this.xData.push(data.time)
    this.UData.push([time, data.U])
    this.IData.push([time, data.I])
    this.$refs.echart.mergeOptions({
      xAxis: { data: this.xData },
      series: [{ data: this.UData }, { data: this.IData }]
    })
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
.echart-box {
  width: 100%;
  height: 100%;
}
.echarts {
  width: 100%;
  height: 100%;
}
</style>
