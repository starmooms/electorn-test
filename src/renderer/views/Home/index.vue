<template>
  <div class="home">
    <div v-if="portPath">
      <el-form size="medium" :inline="true">
        <el-button @click="setTranslate">
          {{ readTranslate ? '关闭采样' : '打开采样' }}
        </el-button>
        <el-button type="primary" @click="stepsBatchOpen">
          机柜批量编辑工步
        </el-button>
        <el-button type="primary" @click="openBatch">
          机柜批量操作
        </el-button>
      </el-form>

      <div class="color-box">
        <ul class="color-box-list">
          <li class="null">
            <span class="color-icon"></span>
            <span class="color-tip">等待</span>
          </li>
          <li class="pause">
            <span class="color-icon"></span>
            <span class="color-tip">暂停</span>
          </li>
          <li class="stop">
            <span class="color-icon"></span>
            <span class="color-tip">停止</span>
          </li>
          <li class="end">
            <span class="color-icon"></span>
            <span class="color-tip">结束</span>
          </li>
          <li class="run">
            <span class="color-icon"></span>
            <span class="color-tip">运行</span>
          </li>
          <li class="protect">
            <span class="color-icon"></span>
            <span class="color-tip">保护</span>
          </li>
          <li class="error">
            <span class="color-icon"></span>
            <span class="color-tip">异常</span>
          </li>
        </ul>
      </div>

      <title-box name="通道列表">
        <SelectMaster v-model="activeMasterId"></SelectMaster>
        <transition name="el-fade-in">
          <div v-if="activeMaster">
            <!-- <el-divider content-position="left">
              机柜{{ activeMaster.id + 1 }}
            </el-divider> -->
            <el-card class="box-card" shadow="never">
              <div slot="header" class="box-card-header">
                <span>{{ activeMaster.name }}</span>
                <el-dropdown>
                  <el-button type="text">
                    操作
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item>批量操作从控</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
              <ul class="slaver-list">
                <li
                  class="slaver-item"
                  v-for="(slaver, sKey) in activeMaster.slaverList"
                  :key="sKey"
                >
                  <div class="slaver-item-l">{{ slaver.name }}</div>
                  <ul class="channel-list">
                    <li
                      class="channel-item"
                      v-for="(channel, ckey) in slaver.list"
                      :span="3"
                      :key="ckey"
                      :class="[
                        channel.trend.workerStatus.status,
                        { error: channel.trend.errorMsg }
                      ]"
                      @click="showChannel(activeMaster, channel, slaver)"
                    >
                      <ContextMenu @open="openMenu(channel)">
                        <div class="channel-box">
                          <div class="sigh-box" v-if="channel.trend.errorMsg">
                            <svg-icon icon-class="sigh"></svg-icon>
                          </div>
                          <div class="tip-box">
                            <div class="tip-box-wrap">
                              电压: {{ channel.trend.U }}
                              <br />
                              电流: {{ channel.trend.I }}
                              <br />
                              当前工步：{{ channel.trend.workerId }}
                              <template v-if="channel.trend.errorMsg">
                                <br />
                                错误信息：{{ channel.trend.errorMsg }}
                              </template>
                            </div>
                          </div>
                          <svg-icon
                            class="channel-icon"
                            icon-class="batter"
                          ></svg-icon>
                        </div>
                        <template v-slot:menu>
                          <a
                            href="javascript:;"
                            v-for="menu in batteryCtxMenu"
                            :key="menu.action"
                            @click="
                              changeStatus(
                                menu.action,
                                channel,
                                slaver,
                                activeMaster
                              )
                            "
                          >
                            {{ menu.name }}
                          </a>
                          <a
                            href="javascript:;"
                            @click="calOpen(channel, slaver, activeMaster)"
                          >
                            局部设置
                          </a>
                          <a
                            href="javascript:;"
                            @click="stepsSetShow(channel, slaver, activeMaster)"
                          >
                            编辑工步
                          </a>
                        </template>
                      </ContextMenu>
                    </li>
                  </ul>

                  <div class="slaver-item-r">
                    <el-dropdown>
                      <el-button type="text">
                        操作
                        <i class="el-icon-arrow-down el-icon--right"></i>
                      </el-button>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item
                          @click.native="openSlaverTrend(activeMaster, slaver)"
                        >
                          查看
                        </el-dropdown-item>
                        <el-dropdown-item>批量操作通道</el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </div>
                </li>
              </ul>
            </el-card>
          </div>
        </transition>
      </title-box>

      <StepSetModal
        :show.sync="stepsShow"
        :showItem="stepsShowItem"
        :isBatch="stepsBatch"
      ></StepSetModal>

      <CalModal :show.sync="calShow" :showItem="calShowItem"></CalModal>

      <BatchModal ref="batchModal" :show.sync="batchShow"></BatchModal>
    </div>
    <div v-else>请先设置串口</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import ContextMenu from '@/renderer/components/ContextMenu.vue'
import { channelList } from '@/shared/config/port'
import { typedKeys, deepClone } from '@/shared/utils'
import { changeStatus } from '@/renderer/ipc/channel'
import StepSetModal from '@/renderer/components/StepSetModal/index.vue'
import CalModal from '@/renderer/components/CalModal.vue'
import SelectMaster from '@/renderer/components/SelectMaster.vue'
import BatchModal from './components/BatchModal.vue'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { deprecate } from 'util'

@Component({
  name: 'Home',
  components: {
    ContextMenu,
    StepSetModal,
    CalModal,
    BatchModal,
    SelectMaster
  }
})
export default class Home extends Vue {
  $refs!: {
    batchModal: BatchModal
  }
  batteryShow = []

  // portItem: any = null
  portList: any[] = []
  portPath = SettingStatus.portPath

  stepsShow = false
  stepsBatch = false
  stepsShowItem: any = {
    masterId: null,
    slaverId: null,
    channelId: null
  }

  calShow = false
  calShowItem: any = {
    masterId: null,
    slaverId: null,
    channelId: null
  }

  batchShow = false

  activeMasterId: null | number = null
  trendList = {}
  trendUnRegister!: any

  get batteryList() {
    return ChannelStatus.list
  }

  get activeMaster() {
    return this.activeMasterId !== null
      ? this.trendList[this.activeMasterId]
      : null
  }

  get readTranslate() {
    return SettingStatus.$readTranslate
  }

  get batteryCtxMenu() {
    return ChannelStatus.statusList
  }

  @Watch('activeMasterId')
  changeMasterId() {
    this.trendChange()
  }

  async changeStatus(status, channel, slaver, master) {
    await changeStatus({
      path: this.portPath,
      slaverId: [slaver.id],
      channelId: [channel.id],
      masterId: master.id,
      status
    })
  }

  stepsSetShow(channel: any, slaver: any, master: any) {
    this.stepsShowItem = {
      path: this.portPath,
      masterId: master.id,
      slaverId: slaver.id,
      channelId: channel.id
    }
    this.stepsBatch = false
    this.stepsShow = true
  }

  stepsBatchOpen() {
    this.stepsBatch = true
    this.stepsShow = true
  }

  calOpen(channel: any, slaver: any, master: any) {
    this.calShowItem = {
      path: this.portPath,
      masterId: master.id,
      slaverId: slaver.id,
      channelId: channel.id
    }
    this.calShow = true
  }

  showChannel(master: any, channel: any, slaver: any) {
    this.$command.send('/createdWin', {
      type: 'channel',
      data: {
        path: this.portPath,
        masterId: master.id,
        slaverId: slaver.id,
        channelId: channel.id
      }
    })
  }

  /** 打开采样统计 */
  openSlaverTrend(master: any, slaver: any) {
    this.$command.send('/createdWin', {
      type: 'slaverTrend',
      data: {
        path: this.portPath,
        masterId: master.id,
        slaverId: slaver.id
      }
    })
  }

  openBatch() {
    this.batchShow = true
  }

  openMenu(channel: any) {
    channel.tipShow = false
  }

  async setTranslate() {
    await SettingStatus.toggleReadTranslate()
  }

  trendListSet() {
    const trendList: any = deepClone(this.batteryList)
    Object.keys(trendList).forEach(mKey => {
      const master = trendList[mKey]
      Object.keys(master.slaverList).forEach(sKey => {
        const slaver = master.slaverList[sKey]
        Object.keys(slaver.list).forEach(cKey => {
          const channel = slaver.list[cKey]
          channel.trend = {
            U: 0,
            I: 0,
            workerId: null,
            errorMsg: '',
            status: ''
          }
          channel.tipShow = false
        })
      })
    })
    this.trendList = trendList
    this.trendChange()
  }

  trendChange() {
    if (this.trendUnRegister) {
      this.trendUnRegister()
    }
    if (!this.portPath || this.activeMasterId === null) {
      return
    }

    const { unRegister } = this.$command.on({
      eventName: `/port/translate/${encodeURIComponent(this.portPath)}/${
        this.activeMasterId
      }/0`,
      onEmit: data => {
        data.list.forEach(item => {
          const slaver = this.activeMaster.slaverList[item.slaverId]
          if (slaver) {
            const channel = slaver.list[item.channelId]
            if (channel) {
              const trend = channel.trend
              trend.U = item.U
              trend.I = item.I
              trend.workerId = item.workerId + 1
              trend.errorMsg = item.errorMsg
              trend.workerStatus = item.workerStatus
            }
          }
        })
      },
      vm: this
    })
    this.trendUnRegister = unRegister
  }

  mounted() {
    const trendList: any = deepClone(this.batteryList)
    Object.keys(trendList).forEach(mKey => {
      const master = trendList[mKey]
      Object.keys(master.slaverList).forEach(sKey => {
        const slaver = master.slaverList[sKey]
        Object.keys(slaver.list).forEach(cKey => {
          const channel = slaver.list[cKey]
          channel.trend = {
            U: 0,
            I: 0,
            workerId: null,
            errorMsg: '',
            workerStatus: {
              name: '',
              status: ''
            }
          }
          channel.tipShow = false
        })
      })
    })
    this.trendList = trendList
  }
}
</script>

<style lang="scss" scoped>
.color-box {
  .color-box-list {
    display: flex;
    align-items: center;
    li {
      margin-right: 20px;
      display: inline-flex;
      align-items: center;
      .color-icon {
        width: 14px;
        height: 14px;
        background-color: #ccc;
        border-radius: 4px;
        margin-right: 4px;
      }

      &.null .color-icon {
        background-color: $--color-null;
      }
      &.pause .color-icon {
        background-color: $--color-pause;
      }
      &.protect .color-icon {
        background-color: $--color-protect;
      }
      &.stop .color-icon {
        background-color: $--color-stop;
      }
      &.end .color-icon {
        background-color: $--color-end;
      }
      &.run .color-icon {
        background-color: $--color-run;
      }
      &.error .color-icon {
        background-color: $--color-error;
      }
    }
  }
}

.master-item {
  max-width: 860px;
  cursor: pointer;
  border-bottom: 1px solid #ccc;
  .master-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 40px;
    padding: 0 20px;
  }
}
.slaver-list {
  margin: 0;
}
.slaver-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ccc;
  padding: 14px 10px;
  background-color: #eff0f1;
  &:last-child {
    border-bottom: none;
  }

  .slaver-item-l {
    flex: 0 0 60px;
  }

  .channel-list {
    flex: 1 0 auto;
    display: flex;

    .channel-item {
      flex: 1 0 auto;
      cursor: pointer;
      text-align: center;
      &:hover {
        .channel-icon {
          transform: translate3d(0, -4px, 0);
        }
      }

      &.null .channel-icon {
        color: $--color-null;
      }
      &.pause .channel-icon {
        color: $--color-pause;
      }
      &.protect .channel-icon {
        color: $--color-protect;
      }
      &.stop .channel-icon {
        color: $--color-stop;
      }
      &.end .channel-icon {
        color: $--color-end;
      }
      &.run .channel-icon {
        color: $--color-run;
      }
      &.error .channel-icon {
        color: $--color-error;
      }

      /* &.protect {
        .channel-icon {
          color: $--color-protect;
        }
      }

      &.pause {
        .channel-icon {
          color: $--color-pause;
        }
      }

      &.run {
        .channel-icon {
          color: $--color-run;
        }
      }

      &.error {
        .channel-icon {
          color: $--color-error;
        }
      } */

      .channel-icon {
        transition: all 0.2s;
        color: #606266;
        font-size: 40px;
      }

      .sigh-box {
        position: absolute;
        top: 0;
        right: 50%;
        color: $--color-error;
        margin-right: -40px;
      }
    }
  }
}

.box-card {
  margin-top: 40px;
  .box-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  ::v-deep {
    .el-card__header {
      padding: 8px 20px;
    }
    .el-card__body {
      padding: 0;
    }
  }
}

.channel-box {
  position: relative;
  &:hover {
    .tip-box {
      display: block;
    }
  }

  $tipW: 200px;
  .tip-box {
    display: none;
    position: absolute;
    top: 100%;
    left: 50%;
    font-size: 12px;
    line-height: 1.6;
    color: #fff;
    z-index: 99;
    width: $tipW;
    box-sizing: border-box;
    margin-top: 8px;
    margin-left: -($tipW/2);
    .tip-box-wrap {
      padding: 6px;
      display: inline-block;
      border-radius: 4px;
      background-color: $--color-bg-reversal;
    }

    $tipIw: 6px;
    &:after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 100%;
      width: 0;
      height: 0;
      border: $tipIw solid transparent;
      margin-left: -$tipIw;
      border-bottom-color: $--color-bg-reversal;
    }
  }
}
</style>
