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
import {
  CHANNEL_ERR_STATUS,
  CHANNEL_STATUS,
  END_STATUS,
  WORKSTEPSINPUT,
  WORKSTEPS_MAP
} from '@/shared/config/port'
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
  db!: HistoryDb | null
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
      this.stepList = []
      await this.db.close()
      this.db = null
    }
  }

  async openDb(filePath: string) {
    try {
      this.loading = true
      if (this.filePath !== filePath) {
        await this.closeDb()
        this.filePath = filePath
        if (this.filePath) {
          this.db = new HistoryDb(this.filePath)
          await this.db.connect()
          await this.getWorkStep()
        }
      }
      this.getSampData()
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  async getWorkStep() {
    if (!this.db) return
    const data = await this.db.getWorkStep()
    this.stepList = JSON.parse(data.stepList)
  }

  async getSampData() {
    try {
      if (!this.db) {
        this.reset()
        return
      }
      this.loading = true
      const data = await this.db.getSampData({
        $masterId: this.position.masterId,
        $slaverId: this.position.slaverId,
        $channelId: this.position.channelId
      })

      let lastStepIdId: null | number = null
      let lastLoopNum: null | number = null
      let lastStep: any = null
      const dataEnd = data.length - 1

      this.sampTableList = []
      this.sampData = data.map((item, index) => {
        if (lastStepIdId !== item.stepId || item.loopNum !== lastLoopNum) {
          const steps = this.stepList[item.stepId]
          if (steps && steps.type !== 'loop') {
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

            const stepId = steps.id
            const showStepId = stepId + 1
            const loopNum = item.loopNum
            const nowStep = {
              msg: `工序： ${showStepId}（${showStepId}-${loopNum}）${steps.name}：${msgData}`,
              loopNum,
              start: index,
              end: dataEnd
            }
            this.sampTableList.push(nowStep)
            if (lastStep) {
              lastStep.end = index - 1
            }
            lastStepIdId = stepId
            lastLoopNum = loopNum
            lastStep = nowStep
          }
        }
        return {
          sIndex: index + 1,
          createTimeStr: dayjs.unix(item.createTime).format(formatTimeStr),
          workerName: CHANNEL_STATUS[item.workCode]?.name,
          endStatus: item.endCode ? END_STATUS[item.endCode] : '',
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
    if (!this.isHistory && !this.db) {
      this.changeChannel()
    } else {
      this.getSampData()
    }
  }

  reset() {
    this.sampData = []
    this.sampTableList = []
    this.$refs.sampChart.setCharts(this.sampData)
  }

  @Watch('nowChannel')
  changeChannel() {
    console.log(this.nowChannel, '?c')
    if (this.nowChannel) {
      this.openDb(this.nowChannel.filePath)
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
          this.openDb(opt.filePath)
        }
      },
      vm: this
    })
  }

  changeChannelHandle() {
    this.$command.on({
      eventName: '/channel/channelPosition',
      onEmit: (opt: any) => {
        this.position = opt
      },
      vm: this
    })
  }

  setPosition() {
    this.position = {
      masterId: Number(this.$route.params.masterId),
      slaverId: Number(this.$route.params.slaverId),
      channelId: Number(this.$route.params.channelId)
    }
  }

  mounted() {
    if (this.isHistory) {
      this.openDb(this.$route.params.filePath)
      this.changeFileHandle()
    } else {
      this.setPosition()
      this.changeChannelHandle()
    }
  }

  beforeDestroy() {
    this.closeDb()
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
