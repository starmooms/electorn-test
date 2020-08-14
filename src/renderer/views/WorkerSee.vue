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
    <div class="steps-list">
      <el-table border max-height="40vh" :data="nowStepList">
        <el-table-column label="工步信息" prop="msg"></el-table-column>
        <el-table-column label="工步限制条件" prop="limt"></el-table-column>
      </el-table>
    </div>

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
import 'echarts/lib/component/dataZoom'
import { setChannelStatus, getWorkStep } from '../ipc/channel'
import command from '../command'
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
      type: 'value',
      data: [0]
      // splitNumber: 5,
    },
    grid: {},
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: [0],
        show: true
      }
    ],
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
        min: 0,
        splitNumber: 24,
        position: 'right',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '电压',
        data: [] as number[][],
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
        data: [] as number[][],
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
    // let i = 0
    // this.setTimer = setInterval(() => {
    //   i += 20
    //   this.polar.series[0].data.push([
    //     i,
    //     Math.floor(Math.random() * 1400) + 3600
    //   ])
    //   this.polar.series[1].data.push([i, Math.floor(Math.random() * 3000)])
    // }, 1000)
  }

  destroy() {
    clearInterval(this.setTimer)
  }

  async getWorkStep() {
    // const data = await this.$command.invoke(
    //   `getWorkerStep/${encodeURIComponent(this.path)}/${this.slaverId}/${
    //     this.channelId
    //   }`
    // )

    const data = await getWorkStep(
      `getWorkerStep/${encodeURIComponent(this.path)}/${this.slaverId}/${
        this.channelId
      }`
    )
    if (data.status) {
      const setInput = (item: any) => {
        if (item.name === '循环') {
          return `${item.name}${item.data + 1}${item.unit}`
        }
        return `${item.data}${item.unit}`
      }
      this.nowStepList = data.data.map((item: any) => {
        const worker = item.worker.map(setInput)
        const limt = item.limt.map(setInput)
        return {
          msg: `${item.id + 1}.${item.name}：${worker.join(' ')}`,
          limt: limt.join(' ')
        }
      })
    }
    console.log(data)
  }

  mounted() {
    let i = 0
    // setInterval(() => {
    //   i++
    //   this.polar.xAxis.data.push(i)
    //   this.polar.series[0].data.push([
    //     i,
    //     Math.floor(Math.random() * 1400) + 3600
    //   ])
    //   this.polar.series[1].data.push([i, Math.floor(Math.random() * 3000)])
    // }, 1000)
    command.on({
      eventName: `/port/translate/${this.slaverId}`,
      onEmit: data => {
        const item = data.list[this.channelId]
        i++
        this.polar.xAxis.data.push(i)
        this.polar.series[0].data.push([i, item.U])
        this.polar.series[1].data.push([i, item.I])
        // console.log(data)
      },
      vm: this
    })
    this.getWorkStep()
  }
}
</script>

<style lang="scss">
.steps-list {
  max-width: 600px;
  min-width: 600px;
}

.echart-box {
  margin-top: 40px;
  width: 800px;
  height: 600px;
  background-color: #f3f3f3;
  .echarts {
    width: 100%;
    height: 100%;
  }
}
</style>
