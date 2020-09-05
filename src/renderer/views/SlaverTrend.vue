<template>
  <div class="slaver-trend">
    <template v-if="slaverData">
      <el-divider content-position="left">信息</el-divider>
      <div class="msg-box">
        串口：{{ portItem.path }}
        <br />
        masterId：{{ portItem.masterId }}
        <br />
        slaverId：{{ portItem.slaverId }}
      </div>
      <el-divider content-position="left">范围选择</el-divider>
      <el-button @click="refresh">刷新</el-button>
      <div class="time-tag">
        <el-tag
          class="time-tag-item"
          type="info"
          effect="dark"
          size="small"
          v-for="item in timeTag"
          :key="item.value"
        >
          <a href="javascript:;" @click="changeTime(item.value)">
            {{ item.title }}
          </a>
        </el-tag>
        <el-date-picker
          v-model="selectDate"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="selectDateChange"
        ></el-date-picker>
      </div>

      <el-divider content-position="left">通道</el-divider>
      <el-row class="thend-list" :gutter="20">
        <el-col
          class="thend-item"
          v-for="channel in list"
          :key="channel.id"
          :span="6"
        >
          <div class="thend-wrap" v-loading="channel.loading">
            <ul class="tag-box">
              <li
                v-for="(tag, index) in tagList"
                :key="index"
                :class="channel.tag === index"
              >
                <a
                  href="javascript:;"
                  @click="channelTagChange(channel, index)"
                >
                  {{ tag }}
                </a>
              </li>
            </ul>
            <div class="tag-container">
              <div class="thend-item-box" v-if="channel.tag === 0">
                <TrendChart
                  class="chart-item"
                  ref="TrendChart"
                  :channelId="channel.id"
                  size="min"
                ></TrendChart>
              </div>
              <div class="spam-table-box" v-if="channel.tag === 1">
                <RecycleScroller
                  class="spam-table"
                  :items="channel.sampData"
                  :item-size="32"
                  key-field="createTime"
                  :ref="`spam-table-${channel.id}`"
                >
                  <template #before>
                    <div class="spam-item">
                      <div class="samp-w-box">
                        <div class="spam-text date-r">日期</div>
                        <div class="spam-text u-r">电压</div>
                        <div class="spam-text i-r">电流</div>
                        <div class="spam-text status-r">执行工步</div>
                        <div class="spam-text workeId-r">工步ID</div>
                      </div>
                      <div
                        v-if="channel.sampData.length === 0"
                        style="text-align: center;padding:10px;"
                      >
                        暂无数据
                      </div>
                    </div>
                  </template>
                  <div class="samp-w-box">
                    <div class="spam-text date-r">日期</div>
                    <div class="spam-text u-r">电压</div>
                    <div class="spam-text i-r">电流</div>
                    <div class="spam-text status-r">执行工步</div>
                    <div class="spam-text workeId-r">工步ID</div>
                  </div>
                  <template v-slot="{ item }">
                    <div class="spam-item">
                      <div class="samp-w-box">
                        <div class="spam-text date-r">
                          <span>{{ item.createTime }}</span>
                        </div>
                        <div class="spam-text u-r">{{ item.U }}</div>
                        <div class="spam-text i-r">{{ item.I }}</div>
                        <div class="spam-text status-r">
                          {{ item.workerStatus }}
                        </div>
                        <div class="spam-text workeId-r">
                          {{ item.workerId }}
                        </div>
                      </div>
                    </div>
                  </template>
                </RecycleScroller>
              </div>
              <div
                class="spam-worker-step"
                v-if="channel.tag === 2"
                style="width:100%;height:100%;overflow:auto;"
              >
                <p class="steps-now">当前工步：{{ channel.workerIdNow + 1 }}</p>
                <p class="steps-now">
                  当前工步状态：{{ channel.workerStatus }}
                </p>
                <div style="width:600px;">
                  <el-table border :data="channel.nowStepList">
                    <el-table-column label="工步信息">
                      <template slot-scope="{ row }">
                        <span class="step-now-icon">
                          {{ row.id === channel.workerIdNow ? '*' : '' }}
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
              </div>
            </div>
            <p>通道{{ channel.id + 1 }}</p>
          </div>
        </el-col>
      </el-row>
      <!-- <ul class="thend-list">
        <li
          class="thend-item"
          v-for="(channel, cKey) in slaverData.list"
          :key="cKey"
        >
          {{ cKey }}
          <TrendChart
            class="chart-item"
            ref="TrendChart"
            :channelId="channel.id"
          ></TrendChart>
        </li>
      </ul> -->
    </template>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import TrendChart from '@/renderer/components/TrendChart.vue'
import { getChannelList, getWorkStep } from '../ipc/channel'
import command from '../command'
import { getSamp } from '../ipc/db'
import dayjs from 'dayjs'
import { formatTimeStr, stepListUtil } from '../utils/util'
import { RecycleScroller } from 'vue-virtual-scroller'

@Component({
  components: {
    TrendChart,
    RecycleScroller
  }
})
export default class SlaverTrend extends Vue {
  $refs!: {
    TrendChart: TrendChart[]
  }

  portItem: null | any = null
  slaverData: any = null
  loading = false
  list: any[] = []
  tagList = ['走势图', '数据表格', '工步查看']

  timeTag = [
    { title: '15分钟', value: 15 },
    { title: '1小时', value: 60 },
    { title: '2小时', value: 120 },
    { title: '12小时', value: 60 * 12 },
    { title: '1天', value: 60 * 24 }
  ]

  selectDate = []

  async getList() {
    const data = await getChannelList({
      type: 'slaver',
      ...this.portItem
    })
    if (data.status) {
      this.slaverData = data.data
      this.list = Object.keys(data.data.list).map(cKey => {
        const channel = data.data.list[cKey]
        return {
          ...channel,
          sampData: [],
          tag: 0,
          loading: false,
          workerIdNow: null,
          workerStatus: '',
          nowStepList: []
        }
      })
      this.getWorkStepList()
      this.$nextTick(async () => {
        await this.getSampDatas(15, this.list)
        this.setCharts()
      })
    }
  }

  getChartMap() {
    const chartMap: { [key: string]: TrendChart } = {}
    this.$refs.TrendChart.forEach(item => {
      chartMap[item.channelId] = item
    })
    return chartMap
  }

  async getWorkStepList() {
    const listMap = {}
    this.list.forEach(item => {
      listMap[item.id] = item
    })
    const data = await getWorkStep({
      ...this.portItem,
      channelId: [0, 1, 2, 3, 4, 5, 6, 7]
    })
    if (data.status) {
      Object.keys(data.data.stepData).forEach(cKey => {
        const channel = listMap[cKey]
        if (listMap[cKey]) {
          channel.nowStepList = data.data.stepData[cKey].stepList.map(
            stepListUtil
          )
        }
      })
    }
  }

  // async getSampData(minute, channelList: any[]) {
  //   try {
  //     console.time()
  //     const channelArr: any[] = []
  //     channelList.forEach(item => {
  //       item.loading = true
  //       channelArr.push({
  //         id: item.id
  //       })
  //     })
  //     if (channelArr.length <= 0) return
  //     const slaverId = this.portItem.slaverId
  //     let startTime = dayjs()
  //       .subtract(minute, 'minute')
  //       .unix()
  //     let endTime = dayjs().unix()
  //     if (this.selectDate.length === 2) {
  //       startTime = dayjs(this.selectDate[0]).unix()
  //       endTime = dayjs(this.selectDate[1]).unix()
  //     }

  //     // const add = 60 * 2
  //     // const startTime = dayjs()
  //     //   .subtract(minute + add, 'minute')
  //     //   .unix()
  //     // const endTime = dayjs()
  //     //   .subtract(add, 'minute')
  //     //   .unix()
  //     const data = await getSamp({
  //       start: startTime,
  //       end: endTime,
  //       masterId: this.portItem.masterId,
  //       slaverArr: [
  //         {
  //           id: slaverId,
  //           channel: channelArr
  //         }
  //       ]
  //     })
  //     if (data.status) {
  //       const chartMap = this.getChartMap()
  //       const slaverSamp = data.data[slaverId] || {}
  //       const promisArr = this.list.map(async channel => {
  //         const id = channel.id
  //         const sampData = slaverSamp[id] || []

  //         if (channel && sampData.length > 0) {
  //           channel.sampData = sampData.map(item => {
  //             return {
  //               createTime: dayjs.unix(item.createTime).format(formatTimeStr),
  //               U: item.U,
  //               I: item.I,
  //               workerStatus: item.workerStatus.name,
  //               workerId: item.workerId + 1
  //             }
  //           })
  //         }

  //         const component = chartMap[id]
  //         if (component && sampData.length > 0) {
  //           if (sampData.length > 0) {
  //             if (sampData[0].createTime > startTime) {
  //               sampData.unshift({
  //                 createTime: startTime,
  //                 U: '-',
  //                 I: '-'
  //               })
  //             }
  //             if (sampData[1].createTime < endTime) {
  //               sampData.push({
  //                 createTime: endTime,
  //                 U: '-',
  //                 I: '-'
  //               })
  //             }
  //           }

  //           await component.setBaseList(sampData)
  //         }
  //       })
  //       await Promise.all(promisArr)
  //     }
  //   } catch (err) {
  //     console.error(err)
  //   } finally {
  //     console.timeEnd()
  //     channelList.forEach(item => {
  //       item.loading = false
  //     })
  //   }
  // }

  showTime = 15
  async changeTime(minute: number) {
    if (this.showTime !== minute) {
      this.selectDate = []
      this.showTime = minute
      this.getSampDatas(this.showTime, this.list)
    }
  }

  async getSampDatas(minute, channelList: any[]) {
    try {
      const channelArr: any[] = []
      channelList.forEach(item => {
        item.loading = true
        channelArr.push({
          id: item.id
        })
      })
      if (channelArr.length <= 0) return
      const slaverId = this.portItem.slaverId
      let startTime = 0
      let endTime = 0

      if (this.selectDate.length === 2) {
        startTime = dayjs(this.selectDate[0]).unix()
        endTime = dayjs(this.selectDate[1]).unix()
      } else {
        startTime = dayjs()
          .subtract(minute, 'minute')
          .unix()
        endTime = dayjs().unix()
      }

      const data = await getSamp({
        start: startTime,
        end: endTime,
        masterId: this.portItem.masterId,
        slaverArr: [
          {
            id: slaverId,
            channel: channelArr
          }
        ]
      })
      if (data.status) {
        const chartMap = this.getChartMap()
        const slaverSamp = data.data[slaverId] || {}
        const promisArr = channelList.map(async channel => {
          const id = channel.id
          const sampData = slaverSamp[id] || []
          channel.sampData = sampData.map(samp => {
            samp.createTimeStr = dayjs.unix(samp.createTime).format(formatTimeStr) // eslint-disable-line
            return {
              createTime: samp.createTimeStr,
              U: samp.U,
              I: samp.I,
              workerStatus: samp.workerStatus.name,
              workerId: samp.workerId + 1
            }
          })
          const chart = chartMap[id]
          if (chart) {
            await chart.setBaseList(sampData)
          }
        })
        await Promise.all(promisArr)
      }
    } catch (err) {
      console.error(err)
    } finally {
      channelList.forEach(item => {
        item.loading = false
      })
    }
  }

  refresh() {
    this.getSampDatas(this.showTime, this.list)
    this.getWorkStepList()
    this.checkScroll()
  }

  selectDateChange() {
    this.getSampDatas(this.showTime, this.list)
  }

  channelTagChange(channel: any, tagId: number) {
    if (channel.tag !== tagId) {
      channel.tag = tagId
      this.$nextTick(() => {
        if (tagId === 1) {
          setTimeout(() => {
            const sl = this.$refs[`spam-table-${channel.id}`]
            if (sl && sl[0]) {
              const el = sl[0]
              el.scrollToItem(channel.sampData.length - 1)
            }
          }, 200)
        }
      })
      this.$nextTick(() => {
        if (tagId === 0) {
          this.getSampDatas(this.showTime, [channel])
        }
      })
    }
  }

  checkScroll() {
    setTimeout(() => {
      this.list.forEach(item => {
        if (item.tag === 1) {
          const sl = this.$refs[`spam-table-${item.id}`]
          if (sl && sl[0]) {
            const el = sl[0]
            el.scrollToItem(item.sampData.length - 1)
          }
        }
      })
    }, 200)
  }

  setCharts() {
    let i = 0
    const chartMap: { [key: string]: TrendChart } = {}
    this.$refs.TrendChart.forEach(item => {
      chartMap[item.channelId] = item
    })
    const { path, masterId, slaverId } = this.portItem
    const listMap = {}
    this.list.forEach(item => {
      listMap[item.id] = item
    })
    command.on({
      eventName: `/port/translate/${encodeURIComponent(
        path
      )}/${masterId}/${slaverId}`,
      onEmit: (data: any) => {
        i += 1
        data.list.forEach(item => {
          if (item.slaverId === slaverId) {
            const channel = listMap[item.channelId]
            channel.workerIdNow = item.workerId
            channel.workerStatus = item.workerStatus.name
            // const component = chartMap[item.channelId]
            // if (component) {
            //   component.update({
            //     time: i,
            //     ...item
            //   })
            // }
          }
        })
      },
      vm: this
    })
  }

  mounted() {
    this.portItem = {
      path: this.$route.params.path,
      masterId: Number(this.$route.params.masterId),
      slaverId: Number(this.$route.params.slaverId)
    }
    this.getList()
  }
}
</script>

<style lang="scss" scoped>
.slaver-trend {
  min-width: 1200px;
}
.thend-list {
  min-width: 1200px;
  overflow: hidden;
  .thend-item {
    padding: 10px;
    .thend-wrap {
      border: 1px solid #ccc;
    }
    .tag-box {
      display: flex;
      border-bottom: 1px solid #ccc;
      margin: 0;
      li {
        padding: 0 10px;
        line-height: 24px;
        border-right: 1px solid #ccc;
      }
    }
    .tag-container {
      height: 320px;
      overflow: hidden;
      position: relative;
    }
    .thend-item-box {
      padding: 10px;
      margin-bottom: 20px;
    }
    .chart-item {
      width: 100%;
      height: 300px;
    }

    .spam-table-box {
      height: 100%;
      width: 100%;
      overflow-y: auto;

      // .smap-wrap {
      //   width: 500px;
      // }

      // .samp-fix-box {
      //   position: relative;
      //   .samp-fix-header {
      //     height: 32px;
      //     .samp-item {
      //       position: absolute;
      //       top: 0;
      //       left: 0;
      //     }
      //   }
      // }

      .spam-table {
        height: 100%;
        margin: 0;
        width: 100%;
      }
      $w: 504px;
      ::v-deep .vue-recycle-scroller__slot {
        position: sticky;
        top: 0;
        z-index: 99;
        .samp-w-box {
          background-color: #fff;
        }
      }
      ::v-deep .vue-recycle-scroller__item-wrapper {
        width: $w;
      }

      // .samp-header {
      //   height: 32px;
      //   .samp-w-box {
      //     position: absolute;
      //     top: 0;
      //     left: 0;
      //   }
      // }
      // .samp-scroll {
      //   height: 288px;
      // }
      .spam-item {
        height: 32px;
        line-height: 32px;
        align-items: center;
        width: 100%;
        .samp-w-box {
          width: $w;
          border-bottom: 1px solid #ccc;
          box-sizing: border-box;
          display: flex;
          position: relative;
        }

        .spam-text {
          margin-right: 10px;
          padding-left: 7px;
          box-sizing: border-box;
          &.date-r {
            flex: 1;
            span {
              position: absolute;
              top: 0;
              left: 0;
              padding: inherit;
            }
          }
          &.u-r,
          &.i-r {
            width: 56px;
          }
          &.status-r {
            width: 140px;
          }
          &.workeId-r {
            width: 60px;
          }
        }
      }
    }
  }
}

.time-tag {
  display: flex;
  align-items: center;
  margin-top: 20px;
  .time-tag-item {
    margin-right: 14px;
  }
}
</style>
