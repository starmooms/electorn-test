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
        <el-button type="primary" @click="openBatch('master')">
          机柜批量设置
        </el-button>
      </el-form>

      <title-box name="通道列表">
        <SelectMaster v-model="activeMasterId"></SelectMaster>
        <!-- <el-radio-group class="master-group" v-model="activeMasterId">
          <el-radio-button
            class="master-group-item"
            v-for="(master, mKey) in batteryList"
            :key="mKey"
            :label="mKey"
          >
            {{ master.name }}
          </el-radio-button>
        </el-radio-group> -->
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
                      @click="showChannel(activeMaster, channel, slaver)"
                    >
                      <el-tooltip
                        class="item"
                        effect="dark"
                        content="Left Top 提示文字"
                        placement="bottom-end"
                        transition="none"
                        v-model="channel.tipShow"
                      >
                        <div slot="content">
                          电压: {{ channel.trend.U }}
                          <br />
                          电流: {{ channel.trend.I }}
                          <br />
                          当前工步：{{ channel.trend.workerId }}
                        </div>
                        <ContextMenu @open="openMenu(channel)">
                          <svg-icon
                            class="channel-icon"
                            icon-class="batter"
                          ></svg-icon>
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
                              @click="
                                stepsSetShow(channel, slaver, activeMaster)
                              "
                            >
                              编辑工步
                            </a>
                          </template>
                        </ContextMenu>
                      </el-tooltip>
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

  openBatch(type: string) {
    this.$refs.batchModal.open(type, this.batteryList)
    this.batchShow = true
  }

  openMenu(channel: any) {
    channel.tipShow = false
  }

  async setTranslate() {
    await SettingStatus.toggleReadTranslate()
  }

  trendListSet() {
    const trendList = deepClone(this.batteryList)
    Object.keys(trendList).forEach(mKey => {
      const master = trendList[mKey]
      Object.keys(master.slaverList).forEach(sKey => {
        const slaver = master.slaverList[sKey]
        Object.keys(slaver.list).forEach(cKey => {
          const channel = slaver.list[cKey]
          channel.trend = {
            U: 0,
            I: 0,
            workerId: null
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
            }
          }
        })
      },
      vm: this
    })
    this.trendUnRegister = unRegister
  }

  mounted() {
    const trendList = deepClone(this.batteryList)
    Object.keys(trendList).forEach(mKey => {
      const master = trendList[mKey]
      Object.keys(master.slaverList).forEach(sKey => {
        const slaver = master.slaverList[sKey]
        Object.keys(slaver.list).forEach(cKey => {
          const channel = slaver.list[cKey]
          channel.trend = {
            U: 0,
            I: 0,
            workerId: null
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
          color: #66b1ff;
        }
      }

      .channel-icon {
        transition: all 0.2s;
        color: #606266;
        font-size: 40px;
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
</style>
