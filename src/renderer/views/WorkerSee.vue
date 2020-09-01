<template>
  <div class="worker-see">
    <el-tabs type="border-card" v-model="tabChannel">
      <el-tab-pane
        v-for="item in channelList"
        :key="item.id"
        :label="`通道${item.id + 1}`"
        :name="String(item.id)"
      ></el-tab-pane>

      <div class="tab-content">
        <el-divider content-position="left">信息</el-divider>
        <p v-if="portItem">
          串口： {{ portItem.path }}
          <br />
          主控：{{ portItem.masterId + 1 }}
          <br />
          从控: {{ portItem.slaverId + 1 }}
          <br />
          通道: {{ portItem.channelId + 1 }}
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
          <el-button @click="calOpen">局部设置</el-button>
          <el-button @click="workStepsOpen">编辑工步</el-button>
        </div>

        <title-box name="工步信息">
          <p class="steps-now">当前工步：{{ workerIdNow + 1 }}</p>
          <p class="steps-now">当前工步状态：{{ workerStatus }}</p>
          <div class="steps-list">
            <el-table border max-height="40vh" :data="nowStepList">
              <el-table-column label="工步信息">
                <template slot-scope="{ row }">
                  <span class="step-now-icon">
                    {{ row.id === workerIdNow ? '*' : '' }}
                  </span>
                  <span>{{ row.msg }}</span>
                </template>
              </el-table-column>
              <el-table-column label="工步工作条件">
                <template slot-scope="{ row }">
                  <el-tag
                    :disable-transitions="true"
                    effect="dark"
                    class="tag-item"
                    v-for="item in row.worker"
                    :key="item.label"
                  >
                    {{ item.label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="工步限制条件" prop="limt">
                <template slot-scope="{ row }">
                  <el-tag
                    effect="dark"
                    class="tag-item"
                    :disable-transitions="true"
                    v-for="item in row.limt"
                    :key="item.label"
                  >
                    {{ item.label }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </title-box>

        <title-box name="保护参数" style="width: 400px;">
          <el-form
            class="protect-form"
            :model="protectForm"
            label-width="200px"
          >
            <el-form-item
              v-for="item in protectList"
              :key="item.index"
              :label="item.name"
            >
              <el-input
                v-model.number="protectForm[item.type]"
                :disabled="true"
              ></el-input>
            </el-form-item>
          </el-form>
        </title-box>

        <TrendChart
          v-if="channelId !== null"
          :channelId="channelId"
          ref="trendChart"
        ></TrendChart>
      </div>
    </el-tabs>

    <StepSetModal :show.sync="stepsShow" :showItem="portItem"></StepSetModal>

    <CalModal :show.sync="calShow" :showItem="portItem"></CalModal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Route } from 'vue-router'
import {
  setChannelStatus,
  getWorkStep,
  getChannelList,
  changeStatus
} from '../ipc/channel'
import command from '../command'
import StepSetModal from '@/renderer/components/StepSetModal/index.vue'
import CalModal from '@/renderer/components/CalModal.vue'
import TrendChart from '@/renderer/components/TrendChart.vue'
import { deepClone } from '@/shared/utils'
import { GET_PROTECT_FORM, PROTECT } from '@/shared/config/port'
import { ChannelStatus } from '../store/modules/Channel'

interface PortData {
  path: string
  masterId: number
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

  portItem: PortData | null = null
  stepsShow = false
  calShow = false
  tabChannel = '0'
  channelList: any[] = []

  // 2
  nowStepDialog = false
  nowStepList: any[] = []

  protectList = deepClone(PROTECT)
  protectForm = GET_PROTECT_FORM()
  workerIdNow: number | null = null
  workerStatus: string | null = null

  get btnList() {
    return ChannelStatus.statusList
  }

  get channelId() {
    return this.portItem ? this.portItem.channelId : null
  }

  @Watch('tabChannel')
  changeTab(newValue) {
    const newChannelId = Number(newValue)
    if (this.portItem && this.portItem.channelId !== newChannelId) {
      this.changeChannelId(newChannelId)
    }
  }

  changeChannelId(channelId: number) {
    if (!this.portItem) return
    const { path, masterId, slaverId } = this.portItem
    this.portItem.channelId = channelId
    this.$router.push({
      path: `/port/WorkerSee/${encodeURIComponent(
        path
      )}/${masterId}/${slaverId}/${channelId}`
    })
  }

  nowStepShow() {
    this.nowStepDialog = true
  }

  async setStatus(status: string) {
    if (!this.portItem) return
    await changeStatus({
      path: this.portItem.path,
      slaverId: [this.portItem.slaverId],
      channelId: [this.portItem.channelId],
      masterId: this.portItem.masterId,
      status
    })
  }

  calOpen() {
    this.calShow = true
  }

  workStepsOpen() {
    this.stepsShow = true
  }

  async getList() {
    const data = await getChannelList({
      type: 'slaver',
      path: this.portItem!.path,
      masterId: this.portItem!.masterId,
      slaverId: this.portItem!.slaverId
    })
    if (data.status) {
      this.channelList = data.data.list
    }
  }

  async getWorkStep() {
    if (!this.portItem) return
    const data = await getWorkStep({
      ...this.portItem,
      channelId: [this.portItem.channelId]
    })
    if (data.status) {
      if (!data.data.stepData || !data.data.stepData[this.portItem.channelId]) {
        this.$message.error('工步返回结构错误')
      } else {
        const setInput = (item: any) => {
          return {
            label: `${item.name}：${item.data}${item.unit}`
          }
        }
        const { protect, stepList } = data.data.stepData[
          this.portItem.channelId
        ]
        this.protectForm = protect
        this.nowStepList = stepList.map((item: any) => {
          const worker = item.worker.map(setInput)
          const limt = item.limt.map(setInput)
          return {
            id: item.id,
            msg: `${item.id + 1}.${item.name}`,
            worker,
            limt
          }
        })
      }
    }
  }

  setCharts() {
    if (!this.portItem) return
    let i = 0
    const { path, masterId, slaverId } = this.portItem
    command.on({
      eventName: `/port/translate/${path}/${masterId}/${slaverId}`,
      onEmit: (data: any) => {
        const item = data.list[this.portItem!.channelId + slaverId * 8]
        this.workerIdNow = item.workerId
        this.workerStatus = item.workerStatus.name
        if (item) {
          i++
          this.$refs.trendChart.update({
            time: i,
            U: item.U,
            I: item.I
          })
        }
      },
      vm: this
    })
  }

  mounted() {
    this.portItem = {
      path: this.$route.params.path,
      masterId: Number(this.$route.params.masterId),
      slaverId: Number(this.$route.params.slaverId),
      channelId: Number(this.$route.params.channelId)
    }
    this.getList()
    this.getWorkStep()
    this.$nextTick(() => {
      this.setCharts()
      // setInterval(() => {
      //   this.workerIdNow = this.workerIdNow === 0 ? 1 : 0
      // }, 1000)
    })
  }

  beforeRouteUpdate(to: Route, from: Route, next: Function) {
    this.getWorkStep()
    next()
  }
}
</script>

<style lang="scss" scoped>
.steps-list {
  width: 800px;
  .tag-item {
    margin-right: 12px;
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

.protect-form {
  max-width: 800px;
  display: flex;
  flex-flow: row wrap;
}

.steps-now {
  margin-top: 0;
  margin-bottom: 10px;
}
.step-now-icon {
  color: red;
}
</style>
