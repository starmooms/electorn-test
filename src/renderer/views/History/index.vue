<template>
  <div v-loading="loading">
    <split-pane class="main-box" split="vertical">
      <template slot="paneL">
        <div class="left-container pane-container">
          <samp-chart></samp-chart>
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

@Component({
  components: {
    RecycleScroller,
    SplitPane,
    SampChart,
    SampList
  }
})
export default class History extends Vue {
  sampData: any[] = []
  filePath = ''
  db!: HistoryDb
  loading = false

  async openDb(filePath: string) {
    try {
      this.loading = true
      this.filePath = filePath
      this.db = new HistoryDb(this.filePath)
      console.log(this.db)
      await this.db.connect()
      this.getSampData()
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  async getSampData() {
    try {
      this.loading = true
      const data = await this.db.getSampData({
        $masterId: 0,
        $slaverId: 0,
        $channelId: 0
      })
      this.sampData = data.map(item => {
        return {
          createTimeStr: dayjs(item.createTime).format(formatTimeStr),
          ...item
        }
      })
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
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
.main-box {
  height: 80vh;

  .pane-container {
    overflow: hidden;
    padding: 10px;
  }

  .left-container {
    height: 100%;

    // background-color: #ccc;
  }

  .right-container {
    overflow: hidden;
    .samp-data-tab {
      max-width: 600px;
      border: 1px solid #dcdfe6;
      overflow: auto;

      .spam-item {
        height: 32px;
        line-height: 32px;
        box-sizing: border-box;
        min-width: 580px;
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
</style>
