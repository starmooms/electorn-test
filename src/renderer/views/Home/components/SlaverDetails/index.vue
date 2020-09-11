<template>
  <div class="slaver-details">
    <div class="action-box">
      <el-button
        class="refresh-btn"
        type="primary"
        icon="el-icon-refresh"
        @click="refresh"
      >
        刷新
      </el-button>
    </div>

    <el-row
      class="channel-list"
      :gutter="20"
      v-loading="loading"
      element-loading-background="rgba(255, 255, 255, 0.6)"
    >
      <el-col :span="6" v-for="channel in list" :key="channel.channelId">
        <div class="item">
          <div class="item-box title-box">
            <p class="tit">通道{{ channel.channelId + 1 }}</p>
          </div>

          <div class="item-box msg-box">
            <div class="msg-l">
              <span class="i-txt">电流：{{ channel.samp.I }} mA</span>
              <br />
              <span class="u-txt">电压：{{ channel.samp.U }} mV</span>
              <br />
              <span class="u-txt">当前循环次数：{{ channel.loopNow }}</span>
            </div>
            <div class="msg-r">
              <span class="now-txt" :class="channel.samp.workerStatus.status">
                {{ channel.samp.workerStatus.name }}
              </span>
            </div>
          </div>

          <div class="item-box step-box">
            <div class="step-no-list" v-if="channel.stepList.length === 0">
              暂无数据
            </div>
            <ul class="step-list">
              <li
                class="step-item"
                v-for="(step, index) in channel.stepList"
                :key="index"
                :class="{ active: step.id === channel.samp.workerId }"
              >
                {{ step.msg }}
              </li>
            </ul>
          </div>

          <!-- <div class="item-box now-status">当前状态：{{ channel.status }}</div> -->
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { getWorkStep } from '@/renderer/ipc/channel'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { getDefatulSamp } from '@/renderer/utils/util'
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class SlaverDetails extends Vue {
  @Prop({ type: Object }) slaver!: Port.SlaverItem
  @Prop({ type: Number }) masterId!: number

  stepData = {}
  list: any[] = []
  loading = false

  get slaverId() {
    return this.slaver.id
  }

  get workerStatus() {
    return ChannelStatus.workerStatus
  }

  getStepList(stepData?: Port.StepsDataItem) {
    let loopNow: number | null = null
    let stepList: any[] = []
    if (stepData) {
      stepList = stepData.stepList.map(item => {
        let msg = `${item.id + 1}、${item.name}`
        if (item.type === 'loop') {
          const hasLoopNow = item.worker.find(work => work.type === 'loopNow')
          if (hasLoopNow !== void 0) {
            loopNow = hasLoopNow.data
          }
        } else {
          const workers = item.worker
            .map(work => {
              return `${work.data}${work.unit}`
            })
            .join('、')
          msg += `（${workers}）`
        }
        return {
          id: item.id,
          msg
        }
      })
    }

    return {
      loopNow,
      stepList
    }
  }

  getSamp(channelId: number) {
    const samp =
      ChannelStatus.sampMap[`${this.masterId}_${this.slaver.id}_${channelId}`]
    return samp || getDefatulSamp()
  }

  /** 获取工步列表 */
  async getWorkerSteps() {
    if (this.loading) return
    try {
      this.loading = true

      const channelIds = Object.entries(this.slaver.list).map(([key, val]) => {
        return val.id
      })
      const data = await getWorkStep({
        masterId: this.masterId,
        slaverId: this.slaver.id,
        channelId: channelIds
      })

      if (data.status) {
        const stepData = data.data.stepData
        this.list = Object.entries(this.slaver.list).map(([key, channel]) => {
          const channelId = channel.id
          const samp = this.getSamp(channelId)
          const { stepList, loopNow } = this.getStepList(stepData[channelId])
          return {
            channelId,
            stepList,
            samp,
            loopNow,
            status: this.workerStatus[samp.workerStatus.status] || '未初始化'
          }
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  refresh() {
    this.getWorkerSteps()
  }

  mounted() {
    this.getWorkerSteps()
  }
}
</script>

<style lang="scss" scoped>
@mixin border-line($bd: border) {
  #{$bd}: 1px solid #ccc;
}

.slaver-details {
  margin-bottom: 20px;

  .action-box {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .channel-list {
    display: flex;
    flex-flow: row wrap;
    .item {
      @include border-line;
      background-color: #dcdcdc;
      margin-top: 20px;

      .item-box {
        padding: 6px;
        box-sizing: border-box;
        @include border-line(border-bottom);
        &:last-child {
          border-bottom: none;
        }
      }

      .title-box {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .tit {
          margin: 0;
        }
      }

      .msg-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        font-weight: bold;
        p {
          margin: 0;
        }
        .msg-l {
          span {
            margin-right: 10px;
            line-height: 1.4;
          }
        }
        .msg-r {
          .now-txt {
            color: #fff;
            font-size: 14px;
            display: inline-block;
            padding: 0 5px;
            border-radius: 4px;
            height: 20px;
            line-height: 19px;
            letter-spacing: 2px;
            @each $status, $val in $statusColor {
              &.#{$status} {
                background-color: $val;
              }
            }
          }
        }

        .now-step {
          font-size: 14px;
          letter-spacing: 2px;
        }
      }

      .step-box {
        height: 200px;
        overflow: auto;
        .step-no-list {
          text-align: center;
        }

        .step-list {
          .step-item {
            white-space: nowrap;
            line-height: 24px;
            &.active {
              background-color: #67c23a;
              color: #fff;
            }
          }
        }
      }
    }
  }
}
</style>
