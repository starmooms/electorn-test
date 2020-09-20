<template>
  <div v-loading="loading">
    <div class="channel-select">
      <ChannelPosition @changeData="changeChannelPos"></ChannelPosition>
      <el-button @click="getSampData" type="primary">刷新</el-button>
    </div>
    <split-pane class="main-box" split="vertical">
      <template slot="paneL">
        <div class="left-container pane-container">
          <samp-chart ref="sampChart"></samp-chart>
        </div>
      </template>
      <template slot="paneR">
        <div class="right-container pane-container">
          <samp-list :samp-data="sampData"></samp-list>
        </div>
      </template>
    </split-pane>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { RecycleScroller } from 'vue-virtual-scroller'
import SplitPane from '@/renderer/components/SplitPane/index.vue'
import SampChart from '@/renderer/components/SampChart.vue'
import SampList from './components/SampList.vue'
import HistoryDb from '@/renderer/Db/HistoryDb'
import dayjs from 'dayjs'
import { formatTimeStr } from '@/renderer/utils/util'
import { WORKSTEPS_MAP } from '@/shared/config/port'
import ChannelPosition from './components/ChannelPosition.vue'

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
  $refs!: {
    sampChart: SampChart
  }

  sampData: any[] = []
  filePath = ''
  db!: HistoryDb
  loading = false

  async openDb(filePath: string) {
    try {
      this.loading = true
      this.filePath = filePath
      this.db = new HistoryDb(this.filePath)
      await this.db.connect()
      this.getSampData()
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  async getSampData(params: any) {
    try {
      this.loading = true
      const data = await this.db.getSampData({
        $masterId: params.masterId,
        $slaverId: params.masterId,
        $channelId: params.masterId
      })
      console.log(data)
      this.sampData = data.map(item => {
        const worker = WORKSTEPS_MAP[item.workCode]
        return {
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

  changeChannelPos(data: any) {
    console.log(data)
  }

  mounted() {
    this.openDb(this.$route.params.filePath)
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
