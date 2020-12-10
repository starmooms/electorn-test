<template>
  <div v-loading="loading">
    <div class="channel-select">
      <channel-position
        :position="position"
        @changeData="changeChannelPos"
      ></channel-position>
      <el-button type="primary" @click="refresh">刷新</el-button>
      <el-button type="primary" @click="startInfoOpen">查看启动信息</el-button>
    </div>
    <split-pane class="main-box" split="vertical">
      <template slot="paneL">
        <div class="left-container pane-container">
          <samp-chart ref="sampChart" @locate="locate"></samp-chart>
        </div>
      </template>
      <template slot="paneR">
        <div class="right-container pane-container">
          <samp-list
            ref="sampList"
            :samp-data="sampData"
            :step-list="sampTableList"
          ></samp-list>
        </div>
      </template>
    </split-pane>
    <start-info-dialog :show.sync="startInfoShow" :start-info="startInfo" />
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import SplitPane from '@/renderer/components/SplitPane/index.vue'
import SampChart from '@/renderer/components/SampChart/index.vue'
import HistoryDb from '@/renderer/Db/HistoryDb'
import { computerAdd, startInfoFormat } from '@/renderer/utils/util'
import { CHANNEL_STATUS, END_STATUS } from '@/shared/config/port'
import SampList from './components/SampList.vue'
import ChannelPosition from './components/ChannelPosition.vue'
import StartInfoDialog from './components/StartInfoDialog.vue'

@Component({
  components: {
    SplitPane,
    SampChart,
    SampList,
    ChannelPosition,
    StartInfoDialog
  }
})
export default class History extends Vue {
  @Prop({ type: Boolean, default: true }) isHistory!: boolean
  @Prop({
    type: Object,
    default() {
      return {
        masterId: 0,
        slaverId: 0,
        channelId: 0
      }
    }
  })
  position!: {
    masterId: number
    slaverId: number
    channelId: number
  }

  $refs!: {
    sampChart: SampChart
    sampList: SampList
  }

  sampData: any[] = []
  sampTableList: any[] = []

  filePath: string | null = null
  db!: HistoryDb | null
  loading = false

  startInfo: null | UtilT.StartInfoFormat = null
  startInfoShow = false

  get stepList() {
    return this.startInfo ? this.startInfo.stepList : []
  }

  async closeDb() {
    if (this.db) {
      this.startInfo = null
      await this.db.close()
      this.db = null
    }
  }

  async openDb(filePath: string | null) {
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
      await this.getSampData()
    } catch (err) {
      console.error(err)
      this.reset()
      this.$message.error(err.message)
    } finally {
      this.loading = false
    }
  }

  async getWorkStep() {
    if (!this.db) return
    const data = await this.db.getWorkStep()
    if (!data) {
      throw new Error('缺少工步信息')
    }
    this.startInfo = startInfoFormat(data)
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

      let nowStep: any = null
      let lastStepTimeEnd = 0
      let stepTimeMax = 0
      const spamTotalLen = data.length

      this.sampTableList = []
      this.sampData = data.map((item, index) => {
        if (
          !nowStep ||
          nowStep.stepId !== item.stepId ||
          nowStep.loopNum !== item.loopNum
        ) {
          const steps = this.stepList[item.stepId]
          if (!steps) {
            throw new Error('缺少工步信息')
          }

          if (steps && steps.type !== 'loop') {
            const stepId = steps.id
            const showStepId = stepId + 1
            const loopNum = item.loopNum
            const newStep = {
              msg: `工序： ${showStepId}（${showStepId}-${loopNum}）${steps.msg}`,
              stepId,
              loopNum,
              start: index,
              end: spamTotalLen
            }
            this.sampTableList.push(newStep)
            if (nowStep) {
              nowStep.end = index
              lastStepTimeEnd = computerAdd(lastStepTimeEnd, stepTimeMax)
              stepTimeMax = 0
            }
            nowStep = newStep
          }
        }
        if (item.stepTime >= stepTimeMax) {
          stepTimeMax = item.stepTime
        } else {
          console.warn('error', item, stepTimeMax, item.stepTime)
        }

        return {
          sIndex: index + 1,
          stepTimeTotal: computerAdd(lastStepTimeEnd, item.stepTime),
          createTimeStr: item.createTime,
          workerName: CHANNEL_STATUS[item.workCode]?.name,
          endStatus:
            item.endCode && item.endCode !== '00'
              ? END_STATUS[item.endCode]
              : '',
          msg: nowStep.msg,
          ...item
        }
      })

      this.$refs.sampChart.setCharts(this.sampData)
    } catch (err) {
      console.error(err)
      this.$message.error(err.message)
    } finally {
      this.loading = false
    }
  }

  refresh() {
    this.$emit('refresh')
  }

  /** 查看启动信息 */
  startInfoOpen() {
    this.startInfoShow = true
  }

  reset() {
    this.sampData = []
    this.sampTableList = []
    this.$refs.sampChart.setCharts(this.sampData)
  }

  changeChannelPos(data: any) {
    Object.keys(data).forEach(key => {
      this.position[key] = data[key]
    })
    this.$emit('changePosition', data)
  }

  /** 曲线点击定位 */
  locate(samp: SampTB.SampItem) {
    if (this.$refs.sampList) {
      this.$refs.sampList.locate(samp)
    }
  }

  beforeDestroy() {
    this.closeDb()
  }
}
</script>

<style lang="scss" scoped>
.channel-select {
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
}

.main-box {
  height: 80vh;

  .pane-container {
    padding: 20px;
    overflow: hidden;
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
