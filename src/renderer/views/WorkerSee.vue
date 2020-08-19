<template>
  <div class="worker-see">
    <!-- <el-tabs type="border-card">
      <el-tab-pane>
        <span slot="label">
          <i class="el-icon-date"></i>
          我的行程
        </span>
        我的行程
      </el-tab-pane>
      <el-tab-pane label="消息中心">消息中心</el-tab-pane>
      <el-tab-pane label="角色管理">角色管理</el-tab-pane>
      <el-tab-pane label="定时任务补偿">定时任务补偿</el-tab-pane>
    </el-tabs> -->

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

    <TrendChart ref="trendChart"></TrendChart>

    <StepSetModal :show.sync="stepsShow" :showItem="portItem"></StepSetModal>

    <CalModal :show.sync="calShow" :showItem="portItem"></CalModal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { setChannelStatus, getWorkStep } from '../ipc/channel'
import command from '../command'
import StepSetModal from '@/renderer/components/StepSetModal.vue'
import CalModal from '@/renderer/components/CalModal.vue'
import TrendChart from '@/renderer/components/TrendChart.vue'

interface PortData {
  path: string
  slaverId: number
  channelId: number
}

@Component({
  components: {
    TrendChart,
    StepSetModal,
    CalModal
  }
})
export default class WorkerSee extends Vue {
  public $refs!: {
    trendChart: TrendChart
  }

  btnList = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '关闭', action: 'close' }
  ]
  portItem: PortData | null = null
  stepsShow = false
  calShow = false

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

  setCharts() {
    let i = 0
    console.log(this.portItem!.slaverId)
    command.on({
      eventName: `/port/translate/${this.portItem!.slaverId}`,
      onEmit: (data: any) => {
        const item = data.list[this.portItem!.channelId]
        i++
        this.$refs.trendChart.update({
          time: i,
          U: item.U,
          I: item.I
        })
      },
      vm: this
    })
  }

  mounted() {
    console.log('mounted')
    this.getWorkStep()
    this.$nextTick(() => {
      this.setCharts()
    })
  }

  beforeDestroy() {
    console.log('destory')
  }
}
</script>

<style lang="scss" scoped>
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
  border: 1px solid #ccc;
  padding: 20px 0;
}
</style>
