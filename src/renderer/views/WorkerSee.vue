<template>
  <div class="worker-see">
    <el-divider content-position="left">串口</el-divider>
    <p>
      slaverId: {{ slaverId }}
      <br />
      channelId: {{ channelId }}
    </p>

    <el-divider content-position="left">操作</el-divider>
    <div>
      <el-button
        v-for="item in btnList"
        :key="item.name"
        @click="btnc(item.action)"
      >
        {{ item.name }}
      </el-button>
    </div>

    <el-divider content-position="left">当前工步</el-divider>
    <el-table border max-height="40vh" :data="nowStepList">
      <el-table-column label="工步信息" prop="msg"></el-table-column>
      <el-table-column label="工步限制条件" prop="limt"></el-table-column>
    </el-table>

    <div class="echart-box">
      <v-chart :options="polar"></v-chart>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/toolbox'
import 'echarts/lib/component/axisPointer'
import { setChannelStatus } from '../ipc/channel'
// import { getChartsData } from '../utils/getConfig'

// const chartData = getChartsData()

@Component({
  components: {
    'v-chart': ECharts
  }
})
export default class WorkerSee extends Vue {
  btnList = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '关闭', action: 'close' }
  ]

  get path() {
    return this.$route.params.path
  }

  get slaverId() {
    return Number(this.$route.params.slaverId)
  }

  get channelId() {
    return Number(this.$route.params.channelId)
  }

  polar = {
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
    // axisPointer: {
    //   // show: true,
    //   type: 'line',
    //   snap: true,
    //   extraCssText: 'width: 400px'
    // },
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
        name: '电压',
        data: [
          [0.5, 4200],
          [20, 4800]
        ],
        type: 'line',
        yAxisIndex: 0,
        lineStyle: { color: 'green' },
        itemStyle: { color: 'green' },
        tooltip: {
          formatter: function(param) {
            console.log(param)
            return `电压：${param.data[1]}`
          }
        }
      },
      {
        name: '电流',
        data: [
          [0.5, 0],
          [20, 4]
        ],
        type: 'line',
        yAxisIndex: 1,
        lineStyle: { color: 'red' },
        itemStyle: { color: 'red' }
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

  btnc(status: string) {
    setChannelStatus({
      path: this.path,
      slaverId: this.slaverId,
      channel: this.channelId,
      status
    })
  }

  setTimer: any = null
  created() {
    let i = 0
    this.setTimer = setInterval(() => {
      i += 20
      this.polar.series[0].data.push([
        i,
        Math.floor(Math.random() * 1400) + 3600
      ])
      this.polar.series[1].data.push([i, Math.floor(Math.random() * 3000)])
    }, 1000)
  }

  destroy() {
    clearInterval(this.setTimer)
  }
}
</script>

<style lang="scss">
.stepsAdd-dialog {
  min-width: 900px;
}

.echart-box {
  width: 800px;
  height: 600px;
  background-color: #f3f3f3;
  .echarts {
    width: 100%;
    height: 100%;
  }
}
</style>
