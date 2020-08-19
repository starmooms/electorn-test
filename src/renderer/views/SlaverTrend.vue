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
      <el-divider content-position="left">走势图</el-divider>
      <el-row class="thend-list" :gutter="20">
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

  async getList() {
    const data = await getChannelList({
      type: 'slaver',
      ...this.portItem
    })
    if (data.status) {
      this.slaverData = data.data
      this.$nextTick(() => {
        this.setCharts()
      })
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
      eventName: `/port/translate/${path}/${masterId}/${slaverId}`,
      onEmit: (data: any) => {
        i += 1
        data.list.forEach(item => {
          const component = chartMap[item.channelId]
          if (component) {
            component.update({
              time: i,
              ...item
            })
          }
        })
      },
      vm: this
    })
  }

  mounted() {
    this.portItem = {
      path: encodeURIComponent(this.$route.params.path),
      masterId: this.$route.params.masterId,
      slaverId: this.$route.params.slaverId
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
