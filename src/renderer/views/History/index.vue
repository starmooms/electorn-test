<template>
  <div v-loading="loading">
    <div class="channel-select">
      <ChannelPosition
        :position="position"
        @changeData="changeChannelPos"
      ></ChannelPosition>
      <el-button @click="refresh" type="primary">刷新</el-button>
    </div>
    <split-pane class="main-box" split="vertical">
      <template slot="paneL">
        <div class="left-container pane-container">
          <samp-chart ref="sampChart"></samp-chart>
        </div>
      </template>
      <template slot="paneR">
        <div class="right-container pane-container">
          <samp-list
            :samp-data="sampData"
            :step-list="sampTableList"
          ></samp-list>
        </div>
      </template>
    </split-pane>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { RecycleScroller } from 'vue-virtual-scroller'
import SplitPane from '@/renderer/components/SplitPane/index.vue'
import SampChart from '@/renderer/components/SampChart.vue'
import SampList from './components/SampList.vue'
import HistoryDb from '@/renderer/Db/HistoryDb'
import dayjs from 'dayjs'
import { formatTimeStr } from '@/renderer/utils/util'
import { WORKSTEPSINPUT, WORKSTEPS_MAP } from '@/shared/config/port'
import ChannelPosition from './components/ChannelPosition.vue'
import { ChannelStatus } from '@/renderer/store/modules/Channel'

@Component({
  components: {
    RecycleScroller,
    SplitPane,
    SampChart,
    SampList,
    ChannelPosition
  }
})
export default class History extends Vue {
  @Prop({ type: Boolean, default: true }) isHistory!: boolean

  $refs!: {
    sampChart: SampChart
  }

  sampData: any[] = []
  sampTableList: any[] = []

  filePath = ''
  db!: HistoryDb
  loading = false
  position = {
    masterId: 0,
    slaverId: 0,
    channelId: 0
  }
  stepList: any[] = []

  get nowChannel() {
    return !this.isHistory && ChannelStatus.channelMap
      ? ChannelStatus.channelMap[
          `${this.position.masterId}_${this.position.slaverId}_${this.position.channelId}`
        ]
      : null
  }

  async closeDb() {
    if (this.db) {
      await this.db.close()
    }
  }

  async openDb(filePath: string) {
    try {
      this.loading = true
      this.filePath = filePath
      this.db = new HistoryDb(this.filePath)
      await this.db.connect()
      // await this.db.getChannelList()
      await this.getWorkStep()
      this.getSampData()
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  async getWorkStep() {
    const data = await this.db.getWorkStep()
    this.stepList = JSON.parse(data.stepList)
  }

  async getSampData() {
    try {
      this.loading = true
      const data = await this.db.getSampData({
        $masterId: this.position.masterId,
        $slaverId: this.position.slaverId,
        $channelId: this.position.channelId
      })

      let lastStepIdId: any = null
      let lastStep: any = null
      const stepLoop = {}
      const dataEnd = data.length - 1

      this.sampTableList = []
      this.sampData = data.map((item, index) => {
        const worker = WORKSTEPS_MAP[item.workCode]

        if (lastStepIdId !== item.stepId) {
          lastStepIdId = item.stepId
          const steps = this.stepList[item.stepId]
          let msgData = ''

          Object.entries(steps.input).forEach(([key, val]) => {
            const valData: any = WORKSTEPSINPUT[key]
            if (valData) {
              msgData += `${valData.name}${val}${valData.unit}，`
            }
          })
          if (msgData) {
            msgData = msgData.slice(0, -1)
          }
          if (!stepLoop[steps.id]) {
            stepLoop[steps.id] = 0
          }
          stepLoop[steps.id] += 1
          const loop = stepLoop[steps.id]
          const showStepId = steps.id + 1
          const nowStep = {
            msg: `工序： ${showStepId}（${showStepId}-${loop}）${steps.name}：${msgData}`,
            start: index,
            end: dataEnd
          }
          this.sampTableList.push(nowStep)
          if (lastStep) {
            lastStep.end = index
          }
          lastStep = nowStep
        }

        return {
          sIndex: index + 1,
          createTimeStr: dayjs.unix(item.createTime).format(formatTimeStr),
          workerName: worker?.name,
          ...item
        }
      })

      this.$refs.sampChart.setCharts(this.sampData)
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  refresh() {
    this.getSampData()
  }

  reset() {
    this.sampData = []
    this.stepList = []
  }

  @Watch('nowChannel')
  changeChannelHandle() {
    this.reset()
    if (this.nowChannel) {
      console.log(this.nowChannel, 'now??')
    }
  }

  changeChannelPos(data: any) {
    this.position = data
    if (this.isHistory) {
      this.getSampData()
    }
  }

  changeFileHandle() {
    this.$command.on({
      eventName: '/history/changeFile',
      onEmit: async (opt: any) => {
        if (opt.filePath) {
          await this.closeDb()
          this.openDb(opt.filePath)
        }
      },
      vm: this
    })
  }

  mounted() {
    if (this.isHistory) {
      this.openDb(this.$route.params.filePath)
      this.changeFileHandle()
    } else {
      this.changeChannelHandle()
    }
  }

  beforeDestroy() {
    if (this.db) {
      this.db.close()
    }
  }
}
</script>

<style lang="scss" scoped>
.channel-select {
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
}
.main-box {
  height: 80vh;

  .pane-container {
    overflow: hidden;
    padding: 20px;
  }

  .left-container {
    height: 100%;

    // background-color: #ccc;
  }

  .right-container {
    overflow: hidden;
  }
}
</style>
