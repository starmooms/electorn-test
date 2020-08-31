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
      <button @click="changeTime(0.25)">15分钟</button>
      <button @click="changeTime(0.5)">30分钟</button>
      <button @click="changeTime(1)">1小时</button>
      <button @click="changeTime(3)">3小时</button>
      <button @click="changeTime(6)">6小时</button>
      <el-divider content-position="left">走势图</el-divider>
      <el-row class="thend-list" :gutter="20" v-loading="loading">
        <el-col
          class="thend-item"
          v-for="(channel, cKey) in slaverData.list"
          :key="cKey"
          :span="6"
        >
          <div class="thend-item-box">
            <TrendChart
              class="chart-item"
              ref="TrendChart"
              :channelId="channel.id"
              size="min"
            ></TrendChart>
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
import { getChannelList } from '../ipc/channel'
import command from '../command'
import { getSamp } from '../ipc/db'
import { keys } from 'lodash'
import dayjs from 'dayjs'
import { formatTimeStr } from '../utils/util'

@Component({
  components: {
    TrendChart
  }
})
export default class SlaverTrend extends Vue {
  $refs!: {
    TrendChart: TrendChart[]
  }

  portItem: null | any = null
  slaverData: any = null
  loading = false

  async getList() {
    const data = await getChannelList({
      type: 'slaver',
      ...this.portItem
    })
    if (data.status) {
      this.slaverData = data.data
      this.$nextTick(async () => {
        await this.getSampData()
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

  async getSampData(minute = 15) {
    try {
      this.loading = true
      const objList = this.slaverData.list
      const channelList = Object.keys(objList).map(key => {
        return {
          id: objList[key].id
        }
      })
      const slaverId = this.portItem.slaverId
      const startTime = dayjs()
        .subtract(minute, 'minute')
        .unix()
      const endTime = dayjs().unix()
      const data = await getSamp({
        start: startTime,
        end: endTime,
        masterId: this.portItem.masterId,
        slaverArr: [
          {
            id: slaverId,
            channel: channelList
          }
        ]
      })
      if (data.status) {
        const chartMap = this.getChartMap()
        const slaverSamp = data.data[slaverId] || {}
        const promisArr = Object.keys(chartMap).map(async cKey => {
          const sampData = slaverSamp[cKey] || []
          const component = chartMap[cKey]
          if (component) {
            if (sampData.length > 0) {
              if (sampData[0].createTime > startTime) {
                sampData.unshift({
                  createTime: startTime,
                  U: '-',
                  I: '-'
                })
              }
              if (sampData[1].createTime < endTime) {
                sampData.push({
                  createTime: endTime,
                  U: '-',
                  I: '-'
                })
              }
            }
            await component.setBaseList(sampData)
          }
        })
        await Promise.all(promisArr)
        // Object.keys(data.data).forEach(sKey => {
        //   Object.keys(data.data[sKey]).forEach(cKey => {
        //     if (data.data[sKey][cKey]) {
        //       const component = chartMap[cKey]
        //       if (component) {
        //         component.setBaseList(data.data[sKey][cKey])
        //       }
        //     }
        //   })
        // })
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  async changeTime(start: number) {
    if (start < 24) {
      console.log(start * 2 * 30)
      this.getSampData(start * 2 * 30)
    }
  }

  setCharts() {
    let i = 0
    const chartMap: { [key: string]: TrendChart } = {}
    this.$refs.TrendChart.forEach(item => {
      chartMap[item.channelId] = item
    })
    const { path, masterId, slaverId } = this.portItem
    command.on({
      eventName: `/port/translate/${encodeURIComponent(
        path
      )}/${masterId}/${slaverId}`,
      onEmit: (data: any) => {
        i += 1
        data.list.forEach(item => {
          if (item.slaverId === slaverId) {
            const component = chartMap[item.channelId]
            if (component) {
              component.update({
                time: i,
                ...item
              })
            }
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
    .thend-item-box {
      border: 1px solid #ccc;
      margin-bottom: 20px;
      padding: 10px;
    }
    .chart-item {
      width: 100%;
      height: 300px;
    }
  }
}
</style>
