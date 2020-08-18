<template>
  <div class="worker-see">
    <el-divider content-position="left">串口</el-divider>
    <p v-if="portItem">
      slaverId: {{ portItem.slaverId }}
      <br />
      channelId: {{ portItem.channelId }}
    </p>

    <el-divider content-position="left">操作</el-divider>
    <div>
      <el-button
        v-for="item in btnList"
        :key="item.name"
        @click="setStatus(item.action)"
      >
        {{ item.name }}
      </el-button>
      <el-button @click="calOpen">校准</el-button>
      <el-button @click="workStepsOpen">编辑工步</el-button>
    </div>

    <el-divider content-position="left">当前工步</el-divider>
    <div class="steps-list">
      <el-table border max-height="40vh" :data="nowStepList">
        <el-table-column label="工步信息" prop="msg"></el-table-column>
        <el-table-column label="工步工作条件" prop="msg">
          <template slot-scope="{ row }">
            <el-tag
              v-for="item in row.worker"
              :key="item.label"
              effect="dark"
              class="tag-item"
            >
              {{ item.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工步限制条件" prop="limt">
          <template slot-scope="{ row }">
            <el-tag
              v-for="item in row.limt"
              :key="item.label"
              effect="dark"
              class="tag-item"
            >
              {{ item.label }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="echart-box">
      <v-chart :options="polar"></v-chart>
    </div>

    <StepSetModal :show.sync="stepsShow" :showItem="portItem"></StepSetModal>

    <CalModal :show.sync="calShow" :showItem="portItem"></CalModal>
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
import StepSetModal from '@/renderer/components/StepSetModal.vue'
import CalModal from '@/renderer/components/CalModal.vue'

interface PortData {
  path: string
  slaverId: number
  channelId: number
}

@Component({
  components: {
    'v-chart': ECharts,
    StepSetModal,
    CalModal
  }
})
export default class WorkerSee extends Vue {
  btnList = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '关闭', action: 'close' }
  ]
  portItem: PortData | null = null
  stepsShow = false
  calShow = false

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
        name: '电压(mV)',
        max: 10000,
        min: 0,
        splitNumber: 25,
        position: 'left',
        splitLine: { show: true }
      },
      {
        name: '电流(mA)',
        max: 10000,
        min: 0,
        splitNumber: 25,
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
  nowStepList: any[] = []

  nowStepShow() {
    this.nowStepDialog = true
  }

  setStatus(status: string) {
    if (!this.portItem) return
    setChannelStatus({
      ...this.portItem,
      status
    })
  }

  calOpen() {
    this.calShow = true
  }

  workStepsOpen() {
    this.stepsShow = true
  }

  async getWorkStep() {
    if (!this.portItem) return
    const { path, slaverId, channelId } = this.portItem
    const data = await getWorkStep(
      `getWorkerStep/${encodeURIComponent(path)}/${slaverId}/${channelId}`
    )
    if (data.status) {
      const setInput = (item: any) => {
        return {
          label: `${item.name}：${item.data}${item.unit}`
        }
      }
      this.nowStepList = data.data.map((item: any) => {
        const worker = item.worker.map(setInput)
        const limt = item.limt.map(setInput)
        return {
          msg: `${item.id + 1}.${item.name}`,
          worker,
          limt
        }
      })
    }
  }

  created() {
    this.portItem = {
      path: this.$route.params.path,
      slaverId: Number(this.$route.params.slaverId),
      channelId: Number(this.$route.params.channelId)
    }
  }

  mounted() {
    let i = 0
    command.on({
      eventName: `/port/translate/${this.portItem!.slaverId}`,
      onEmit: data => {
        const item = data.list[this.portItem!.channelId]
        i++
        this.polar.xAxis.data.push(i)
        this.polar.series[0].data.push([i, item.U])
        this.polar.series[1].data.push([i, item.I])
      },
      vm: this
    })
    this.getWorkStep()
  }
}
</script>

<style lang="scss">
.steps-list {
  width: 800px;
  .tag-item {
    & + .tag-item {
      margin-left: 12px;
    }
  }
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
