<template>
  <div class="worker-see" v-if="portItem">
    <el-tabs type="border-card" v-model="tabChannel">
      <el-tab-pane
        v-for="item in channelList"
        :key="item.id"
        :label="`通道${item.id + 1}`"
        :name="String(item.id)"
      ></el-tab-pane>

      <div class="tab-content">
        <div class="channel-details">
          <div class="tab-l">
            <title-box class="channel-msg-box" name="通道信息">
              <div class="steps-now">
                <span>机柜：</span>
                <span>{{ portItem.masterId + 1 }}</span>
              </div>
              <div class="steps-now">
                <span>从控：</span>
                <span>{{ portItem.slaverId + 1 }}</span>
              </div>
              <div class="steps-now">
                <span>通道：</span>
                <span>{{ portItem.channelId + 1 }}</span>
              </div>
            </title-box>
            <title-box name="当前工步信息">
              <p class="steps-now">当前工步：{{ workerIdNow + 1 }}</p>
              <p class="steps-now">当前工步状态：{{ workerStatus }}</p>
            </title-box>
            <title-box name="操作" class="action-box">
              <el-button
                v-for="item in btnList"
                :key="item.name"
                @click="setStatus(item.action)"
                type="primary"
              >
                {{ item.name }}
              </el-button>
              <el-button @click="calOpen" type="primary">局部设置</el-button>
              <el-button @click="workStepsOpen" type="primary">
                编辑工步
              </el-button>
            </title-box>
          </div>
          <div class="tab-r">
            <div class="tab-nav-container">
              <ul class="tab-nav">
                <li
                  v-for="(item, index) in tabList"
                  :key="item"
                  class="tab-nav-item"
                  :class="{ active: tabActive === index }"
                  @click="tabActive = index"
                >
                  {{ item }}
                </li>
              </ul>
              <div class="tab-pane-box">
                <div class="pane-echart" v-show="tabActive === 0">
                  <samp-chart
                    v-if="channelId !== null"
                    :channelId="channelId"
                    ref="chart"
                  ></samp-chart>
                </div>
              </div>
            </div>
          </div>
        </div>
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
} from '@/renderer/ipc/channel'
import command from '@/renderer/command'
import StepSetModal from '@/renderer/components/StepSetModal/index.vue'
import CalModal from '@/renderer/components/CalModal.vue'
// import TrendChart from '@/renderer/components/TrendChart.vue'
import SampChart from '@/renderer/components/SampChart.vue'
import { deepClone } from '@/shared/utils'
import { GET_PROTECT_FORM, PROTECT } from '@/shared/config/port'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import dayjs from 'dayjs'
import { getSamp } from '@/renderer/ipc/db'
import { stepListUtil } from '@/renderer/utils/util'

@Component({
  components: {
    SampChart,
    StepSetModal,
    CalModal
  }
})
export default class WorkerSee extends Vue {
  public $refs!: {
    sampChart: SampChart
    chart: SampChart
  }

  portItem: ipcReq.PortItem | null = null
  stepsShow = false
  calShow = false
  tabChannel = '0'
  channelList: any[] = []
  sampStop = true

  // 2
  nowStepDialog = false
  nowStepList: any[] = []

  protectList = deepClone(PROTECT)
  protectForm = GET_PROTECT_FORM()
  workerIdNow: number | null = null
  workerStatus: string | null = null

  chartData!: Port.SampItem[]

  tabActive = 0
  tabList = ['1.曲线图', '2.详细数据', '3.工步查看', '4.保护参数']

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

  @Watch('tabActive')
  changeTabPan(v) {
    if (v === 0) {
      setInterval(() => {
        if (this.$refs.chart) {
          console.log(this.$refs.chart)
          this.$refs.chart?.resize()
        }
      }, 2000)
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
    this.sampStop = true
    this.$refs.chart.setBaseList([])
    this.nowStepList = []
    const { channelId } = this.portItem!
    const data = await getWorkStep({
      ...this.portItem,
      channelId: [channelId]
    })
    if (data.status) {
      if (data.data.stepData && data.data.stepData[channelId]) {
        const { protect, stepList } = data.data.stepData[channelId]
        this.protectForm = protect
        this.nowStepList = stepList.map(stepListUtil)
      }
      this.getSampData()
    }
  }

  /** 获取采样 */
  async getSampData() {
    try {
      const start = dayjs()
        .subtract(15, 'minute')
        .unix()
      const end = dayjs().unix()
      const { masterId, slaverId, channelId } = this.portItem!
      const samp = await getSamp({
        start,
        end,
        masterId,
        slaverArr: [
          {
            id: slaverId,
            channel: [
              {
                id: channelId
              }
            ]
          }
        ]
      })
      if (samp.status) {
        const sampData = samp.data?.[slaverId]?.[channelId]
        if (sampData) {
          this.chartData = sampData
          if (this.$refs.chart) {
            this.$refs.chart.setBaseList(sampData)
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.sampStop = false
    }
  }

  setCharts() {
    if (!this.portItem) return
    const { path, masterId, slaverId } = this.portItem
    command.on({
      eventName: `/port/translate/${encodeURIComponent(
        path
      )}/${masterId}/${slaverId}`,
      onEmit: (data: any) => {
        if (this.sampStop) return
        const item = data.list[this.portItem!.channelId + slaverId * 8]
        if (item) {
          this.workerIdNow = item.workerId
          this.workerStatus = item.workerStatus.name

          if (item.workerCode !== '00') {
            if (!this.chartData) {
              this.chartData = []
            }
            this.chartData.push(item)
            this.$refs.chart.update([item])
          }
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
    this.tabChannel = this.$route.params.channelId
    this.getList()
    this.$nextTick(() => {
      this.getWorkStep()
      this.setCharts()
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

.tab-content {
  .channel-details {
    display: flex;
    .tab-l {
      width: 200px;
      margin-right: 20px;
      align-content: top;
      .channel-msg-box {
        margin: 0;
        .channel-msg {
          display: flex;
        }
      }
      .action-box {
        display: flex;
        flex-flow: row wrap;
        justify-content: space-between;
        .el-button {
          margin: 0;
          margin-bottom: 10px;
          // width: 40%;
          // // margin: 0;
          // margin-bottom: 10px;
          // flex: 1 1 auto;
        }
      }
    }
    .tab-r {
      flex: 1;
      .tab-nav-container {
        border: 1px solid #dcdfe6;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.12),
          0 0 6px 0 rgba(0, 0, 0, 0.04);
      }
      .tab-nav {
        display: flex;
        background-color: #f5f7fa;
        color: #909399;
        line-height: 40px;
        margin: 0;

        .tab-nav-item {
          padding: 0 18px;
          font-weight: bold;
          cursor: pointer;

          &:hover {
            color: #409eff;
          }
          &.active {
            color: #409eff;
            background-color: #fff;
            border-left: 1px solid #dcdfe6;
            border-right: 1px solid #dcdfe6;
            &:first-child {
              border-left: transparent;
            }
          }
        }
      }

      .tab-pane-box {
        padding: 10px;
      }
    }
  }
}

.echart-box {
  margin-top: 40px;
  width: 800px;
  min-width: 200px;
  height: 620px;
  background-color: #f3f3f3;
  border: 1px solid #ccc;
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
