<template>
  <div class="worker-see">
    <div class="tab-content">
      <div class="channel-details">
        <div class="tab-l">
          <ch-position
            :position="position"
            @changeData="changeChannel"
          ></ch-position>

          <ch-action
            :isRun="isRun"
            :position="position"
            @refresh="refresh"
          ></ch-action>

          <ch-history
            v-model="history"
            :position="position"
            :channelData="channelData"
            ref="chHistory"
          ></ch-history>
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
              <div class="echart-box" v-show="tabActive === 0">
                <div class="pane-echart">
                  <samp-chart
                    v-if="channelId !== null"
                    :channelId="channelId"
                    ref="chart"
                  ></samp-chart>
                </div>
              </div>

              <!-- 表格数据 -->
              <div class="samp-data-tab" v-if="tabActive === 1">
                <div class="spam-head">
                  <div class="spam-item">
                    <div class="samp-w-box">
                      <div class="spam-text date-r">日期</div>
                      <div class="spam-text u-r">电压</div>
                      <div class="spam-text i-r">电流</div>
                      <div class="spam-text status-r">执行工步</div>
                      <div class="spam-text workeId-r">工步ID</div>
                    </div>
                  </div>
                </div>
                <div
                  v-if="sampData.length === 0"
                  style="text-align: center;padding:10px;"
                >
                  暂无数据
                </div>
                <RecycleScroller
                  v-else
                  :items="sampData"
                  class="spam-table"
                  key-field="createTime"
                  :item-size="32"
                  ref="recycleScroller"
                  @visible="scrollBottom"
                >
                  <template v-slot="{ item, index }">
                    <div class="spam-item" :class="{ even: index % 2 }">
                      <div class="samp-w-box">
                        <div class="spam-text date-r">
                          <span>{{ item.createTimeStr }}</span>
                        </div>
                        <div class="spam-text u-r">{{ item.U }}</div>
                        <div class="spam-text i-r">{{ item.I }}</div>
                        <div class="spam-text status-r">
                          {{ item.workerStatus.name }}
                        </div>
                        <div class="spam-text workeId-r">
                          {{ item.workerId + 1 }}
                        </div>
                      </div>
                    </div>
                  </template>
                </RecycleScroller>
              </div>

              <!-- 工步查看 -->
              <div class="steps-list" v-if="tabActive === 2">
                <el-table
                  border
                  max-height="40vh"
                  :data="nowStepList"
                  :row-class-name="stepsTableRow"
                >
                  <el-table-column label="工步信息">
                    <template slot-scope="{ row }">
                      <span class="step-now-icon">
                        <svg-icon icon-class="right"></svg-icon>
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

              <!-- 保护参数 -->
              <div class="protect-tab" v-if="tabActive === 3">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Route } from 'vue-router'
import { getWorkStep, getChannelList } from '@/renderer/ipc/channel'
import StepSetModal from '@/renderer/components/StepSetModal/index.vue'
import CalModal from '@/renderer/components/CalModal.vue'
import SampChart from '@/renderer/components/SampChart.vue'
import { deepClone } from '@/shared/utils'
import { GET_PROTECT_FORM, PROTECT } from '@/shared/config/port'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import dayjs from 'dayjs'
import { getChannelHistory, getSamp } from '@/renderer/ipc/db'
import { formatTimeStr, stepListUtil } from '@/renderer/utils/util'
import { RecycleScroller } from 'vue-virtual-scroller'
import ChPosition from './components/ChPosition.vue'
import ChAction from './components/ChAction.vue'
import ChHistory from './components/ChHistory.vue'

@Component({
  components: {
    SampChart,
    StepSetModal,
    CalModal,
    RecycleScroller,
    ChPosition,
    ChAction,
    ChHistory
  }
})
export default class WorkerSee extends Vue {
  public $refs!: {
    sampChart: SampChart
    chart: SampChart
    recycleScroller: RecycleScroller
    chHistory: ChHistory
  }

  stepsShow = false
  calShow = false
  sampStop = true

  // 2
  nowStepList: any[] = []

  protectList = deepClone(PROTECT)
  protectForm = GET_PROTECT_FORM()
  workerIdNow: number | null = null
  workerStatus: string | null = null

  sampData: Port.SampItem[] = []

  tabActive = 0
  tabList = ['1.曲线图', '2.详细数据', '3.工步查看', '4.保护参数']

  history: any = null

  position = {
    path: '',
    masterId: 0,
    slaverId: 0,
    channelId: 0
  }

  get channelId() {
    return this.position.channelId
  }

  /** 当前通道信息 */
  get channelData() {
    return ChannelStatus.channelMap
      ? ChannelStatus.channelMap[this.position.masterId][
          this.position.slaverId
        ][this.channelId]
      : null
  }

  get channelNowStart() {
    return this.channelData ? this.channelData.workerStart : null
  }

  get isRun() {
    return this.channelNowStart && this.history
      ? this.channelNowStart === this.history.start
      : false
  }

  @Watch('tabActive')
  changeTabPan(v) {
    this.$nextTick(() => {
      if (v === 0 && this.$refs.chart) {
        this.$refs.chart.resize()
      }
      if (v === 1 && this.$refs.recycleScroller) {
        this.$refs.recycleScroller.scrollToItem(this.sampData.length - 1)
      }
    })
  }

  @Watch('history')
  changeHistory(v, old) {
    if (v && old && v.start === old.start && v.end === old.end) return
    if (v) {
      this.getSampData()
    }
  }

  @Watch('channelData', { deep: true })
  changeNowStart(val: Port.ChannelItem | null, old: Port.ChannelItem | null) {
    if (val && old) {
      if (val.fullId === old.fullId) {
        this.$refs.chHistory.getHistory(true)
      }
    }
  }

  scrollBottom() {
    if (this.$refs.recycleScroller) {
      this.$refs.recycleScroller.scrollToItem(this.sampData.length - 1)
    }
  }

  stepsTableRow({ row }) {
    return row.id === this.workerIdNow ? 'worker-row' : ''
  }

  changeChannel(newPosition: any) {
    this.position = {
      ...this.position,
      ...newPosition
    }
    this.$router.push({
      name: 'WorkerSee',
      params: {
        path: encodeURIComponent(this.position.path),
        masterId: String(this.position.masterId),
        slaverId: String(this.position.slaverId),
        channelId: String(this.position.channelId)
      }
    })
  }

  refresh() {
    this.getSampData(true)
    this.getWorkStep()
  }

  /** 重置 */
  reset() {
    this.sampStop = true
    this.$refs.chart.setBaseList([])
    this.protectForm = GET_PROTECT_FORM()
    this.sampData = []
    this.nowStepList = []
    this.history = null
  }

  /** 获取工步 */
  async getWorkStep() {
    const { channelId } = this.position
    const data = await getWorkStep({
      ...this.position,
      channelId: [channelId]
    })
    if (data.status) {
      if (data.data.stepData && data.data.stepData[channelId]) {
        const { protect, stepList } = data.data.stepData[channelId]
        this.protectForm = protect
        this.nowStepList = stepList.map(stepListUtil)
      }
    }
  }

  /** 获取采样 */
  async getSampData(isRefresh = false) {
    try {
      if (!this.history) return
      const { start, end } = this.history
      const { masterId, slaverId, channelId } = this.position
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
          let lastEnd = 0
          if (this.sampData.length > 0) {
            lastEnd = this.sampData[this.sampData.length - 1].createTime
          }
          this.sampData = sampData.map(item => {
            item.createTimeStr = dayjs
              .unix(item.createTime)
              .format(formatTimeStr)
            return item
          })

          if (this.$refs.chart) {
            if (isRefresh) {
              this.$refs.chart.refresh(sampData)
              this.autoScrollEnd(lastEnd)
            } else {
              this.$refs.chart.setBaseList(sampData)
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      // this.sampStop = false
    }
  }

  autoScrollEnd(lastEnd: number) {
    if (this.$refs.recycleScroller && lastEnd) {
      const pool = this.$refs.recycleScroller.pool
      if (pool.length > 2) {
        const poolEnd = pool[pool.length - 1]
        if (poolEnd && poolEnd.item.createTime === lastEnd) {
          this.$nextTick(() => {
            this.$refs.recycleScroller.scrollToItem(this.sampData.length - 1)
          })
        }
      }
    }
  }

  init() {
    this.reset()
    this.getWorkStep()
    this.$refs.chHistory.getHistory()
  }

  mounted() {
    this.position = {
      path: this.$route.params.path,
      masterId: Number(this.$route.params.masterId),
      slaverId: Number(this.$route.params.slaverId),
      channelId: Number(this.$route.params.channelId)
    }

    this.$nextTick(() => {
      this.init()
    })
  }

  beforeRouteUpdate(to: Route, from: Route, next: Function) {
    this.$nextTick(() => {
      this.init()
      next()
    })
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
      flex: 0 0 200px;
      margin-right: 20px;
      align-content: top;
      .channel-msg-box {
        margin: 0;
        .channel-msg {
          display: flex;
        }
      }
    }
    .tab-r {
      flex: 1 1 auto;
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

        .pane-echart {
          width: 100%;
          height: 620px;
          background-color: #f3f3f3;
          border: 1px solid #ccc;
        }

        .steps-list {
          .el-table ::v-deep {
            .step-now-icon {
              display: none;
              color: #409eff;
              margin-right: 4px;
            }
            .worker-row {
              background: #f0f9eb;
              .step-now-icon {
                display: inline-block;
              }
            }
          }
        }

        .samp-data-tab {
          max-width: 600px;
          border: 1px solid #dcdfe6;
          .spam-item {
            height: 32px;
            line-height: 32px;
            box-sizing: border-box;
            border-bottom: 1px solid #dcdfe6;
            .samp-w-box {
              display: flex;
              .spam-text {
                border-right: 1px solid #dcdfe6;
                padding-left: 10px;
                box-sizing: border-box;
                &:last-child {
                  border-right: none;
                }
              }
              .date-r {
                min-width: 200px;
              }
              .u-r,
              .i-r,
              .workeId-r {
                min-width: 80px;
              }
              .status-r {
                min-width: 140px;
              }
            }
          }

          .spam-table {
            height: 60vh;
            margin: 0;
            width: 100%;
            .even {
              background-color: #f5f7fa;
            }
          }
        }
      }
    }
  }
}

/* .echart-box {
  margin-top: 40px;
  width: 800px;
  min-width: 200px;
  height: 620px;
  background-color: #f3f3f3;
  border: 1px solid #ccc;
} */

.protect-form {
  max-width: 800px;
  display: flex;
  flex-flow: row wrap;
}

.steps-now {
  margin-top: 0;
  margin-bottom: 10px;
}
</style>
