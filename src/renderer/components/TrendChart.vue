<template>
  <div class="echart-box">
    <v-chart ref="echart" :manual-update="true" :autoresize="true"></v-chart>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/toolbox'
import 'echarts/lib/component/axisPointer'
import 'echarts/lib/component/dataZoom'

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
  @Prop({ type: Number, default: 25 }) splitNumber!: number
  @Prop({ type: Number, default: 1 }) itemOpacity!: number
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

  setCharts() {
    this.xData = [0]
    this.UData = []
    this.IData = []
    const polar = {
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
        data: ['电压', '电流']
      },
      xAxis: {
        type: 'value',
        data: this.xData
        // splitNumber: 5,
      },
      grid: this.grid,
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
          max: 10000,
          min: 0,
          splitNumber: this.splitNumber,
          position: 'left',
          splitLine: { show: true },
          axisLabel: {
            fontSize: 10
          }
        },
        {
          name: '电流(mA)',
          max: 10000,
          min: 0,
          splitNumber: this.splitNumber,
          position: 'right',
          splitLine: { show: false },
          axisLabel: {
            fontSize: 10
          }
        }
      ],
      series: [
        {
          name: '电压',
          data: this.UData,
          type: 'line',
          yAxisIndex: 0,
          lineStyle: { color: 'green' },
          itemStyle: { color: 'green', opacity: this.itemOpacity },
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
          itemStyle: { color: 'red', opacity: this.itemOpacity }
        }
      ]
    }
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
