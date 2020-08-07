<template>
  <div class="worker-see">
    <el-divider content-position="left">串口</el-divider>

    <el-divider content-position="left">操作</el-divider>
    <el-button>开始</el-button>
    <el-button>暂停</el-button>
    <el-button>继续</el-button>
    <el-button>关闭</el-button>

    <el-divider content-position="left">当前工步</el-divider>
    <el-table border max-height="40vh" :data="nowStepList">
      <el-table-column label="工步信息" prop="msg"></el-table-column>
      <el-table-column label="工步限制条件" prop="limt"></el-table-column>
    </el-table>

    <div class="d-box">
      <v-chart :options="polar"></v-chart>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/line'
import { EChartOption } from 'echarts'
import { getChartsData } from '../utils/getConfig'

// const chartData = getChartsData()

@Component({
  components: {
    'v-chart': ECharts
  }
})
export default class WorkerSee extends Vue {
  polar: EChartOption = {
    xAxis: {
      // data: chartData.Timex,
      splitNumber: 5,
      min: 0,
      max: 1000
    },
    grid: {},
    yAxis: [
      {
        name: '电压',
        max: 5000,
        min: 0,
        splitNumber: 25,
        position: 'left',
        splitLine: { show: true }
      },
      {
        name: '电流',
        max: 6000,
        min: -6000,
        splitNumber: 24,
        position: 'right',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        data: [
          [0.5, 4200],
          [20, 4800]
        ],
        type: 'line',
        yAxisIndex: 0
      },
      {
        data: [
          [0.5, 0],
          [20, 4]
        ],
        type: 'line',
        yAxisIndex: 1
      }
    ]
  }

  // 2
  nowStepDialog = false
  nowStepList = [
    {
      msg: '1.恒流充电：1000mA',
      limt: '12600mV'
    },
    {
      msg: '2.恒压充电：12600mV',
      limt: '30mA'
    },
    {
      msg: '3.静置10Min',
      limt: ''
    }
  ]

  nowStepShow() {
    this.nowStepDialog = true
  }

  created() {
    setInterval(() => {
      this.polar.series[0].data.push([1, 3])
      this.polar.series[1].data.push([1, 3])
    }, 1000)
  }
}
</script>

<style lang="scss">
.stepsAdd-dialog {
  min-width: 900px;
}
.echarts {
  width: 800px;
  height: 900px;
}
</style>
