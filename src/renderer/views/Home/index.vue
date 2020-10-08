<template>
  <div class="home">
    <div v-if="portPath">
      <el-form size="medium" :inline="true">
        <el-button @click="setTranslate">
          {{ readTranslate ? '关闭采样' : '打开采样' }}
        </el-button>
        <el-button type="primary" @click="stepsBatchOpen">
          机柜批量启动
        </el-button>
        <el-button type="primary" @click="openBatch">
          机柜批量操作
        </el-button>
        <el-button type="primary" @click="openSeparat">
          容量分选
        </el-button>
        <el-button type="primary" @click="sysLogOpen">
          查看系统日志
        </el-button>
        <div class="select-file-btn">
          <file-select openType="file" @change="importHistory">
            <el-button type="primary">
              导入外部文件
            </el-button>
          </file-select>
        </div>
      </el-form>

      <div class="color-box">
        <ul class="color-box-list">
          <li v-for="(val, key) in workerStatus" :key="key" :class="key">
            <span class="color-icon"></span>
            <span class="color-tip">{{ val }}</span>
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
                <!-- <el-dropdown>
                  <el-button type="text">
                    操作
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item>批量操作从控</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown> -->
              </div>
              <ul class="slaver-list">
                <li
                  class="slaver-item"
                  v-for="(slaver, sKey) in activeMaster.slaverList"
                  :key="sKey"
                >
                  <div class="slaver-channel-box">
                    <div class="slaver-item-l">{{ slaver.name }}</div>
                    <div class="channel-list">
                      <channel-item
                        v-for="(channel, ckey) in slaver.list"
                        :key="`${activeMasterId}_${sKey}_${ckey}`"
                        :master-id="activeMaster.id"
                        :slaver-id="slaver.id"
                        :channel-data="channel"
                        :ref="`${activeMasterId}_${slaver.id}_${channel.id}`"
                        @stepEditOpen="stepsSetShow"
                        @start="channelStart"
                        @calEditOpen="calOpen"
                        @setChannelStatus="setChannelStatus"
                      ></channel-item>
                    </div>
                    <el-button @click="slaverDetails(slaver.id)">
                      查看
                    </el-button>
                  </div>
                  <el-collapse-transition name="el-fade-in">
                    <slaver-details
                      v-if="showSlaverDetail === slaver.id"
                      :master-id="activeMasterId"
                      :slaver="slaver"
                    ></slaver-details>
                  </el-collapse-transition>
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
        @openSysLog="sysLogOpen"
      ></StepSetModal>

      <CalModal :show.sync="calShow" :showItem="calShowItem"></CalModal>

      <BatchModal
        ref="batchModal"
        :show.sync="batchShow"
        @setChannelStatus="setChannelStatus"
      ></BatchModal>

      <SetChannelStatus
        ref="setChannelStatus"
        @openSysLog="sysLogOpen"
      ></SetChannelStatus>
      <sys-log :show.sync="sysLogShow"></sys-log>
    </div>
    <div v-else>请先设置串口</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import StepSetModal from '@/renderer/components/StepSetModal/index.vue'
import CalModal from '@/renderer/components/CalModal.vue'
import SelectMaster from '@/renderer/components/SelectMaster.vue'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import BatchModal from './components/BatchModal.vue'
import SlaverDetails from './components/SlaverDetails/index.vue'
import SetChannelStatus from '@/renderer/components/SetChannelStatus.vue'
import ChannelItem from './components/ChannelItem.vue'
import FileSelect from '@/renderer/components/FileSelect.vue'
import SysLog from '@/renderer/components/SysLog/index.vue'

@Component({
  name: 'Home',
  components: {
    StepSetModal,
    FileSelect,
    CalModal,
    BatchModal,
    SlaverDetails,
    SelectMaster,
    ChannelItem,
    SetChannelStatus,
    SysLog
  }
})
export default class Home extends Vue {
  $refs!: {
    batchModal: BatchModal
    setChannelStatus: SetChannelStatus
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
  calShowItem: ipcReq.CalOpts | null = null

  batchShow = false

  activeMasterId: null | number = null
  trendUnRegister!: any
  showSlaverDetail: null | number = null

  sysLogShow = false

  get batteryList() {
    return ChannelStatus.list
  }

  get workerStatus() {
    return ChannelStatus.workerStatus
  }

  get activeMaster() {
    return this.activeMasterId !== null && this.batteryList
      ? this.batteryList[this.activeMasterId]
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
    this.showSlaverDetail = null
    this.trendChange()
  }

  stepsSetShow(channelMsg: any) {
    this.stepsShowItem = {
      path: this.portPath,
      ...channelMsg
    }
    this.stepsBatch = false
    this.stepsShow = true
  }

  channelStart(data: any) {
    this.stepsShowItem = data
    this.stepsBatch = false
    this.stepsShow = true
  }

  stepsBatchOpen() {
    this.stepsBatch = true
    this.stepsShow = true
  }

  calOpen(channelMsg: ipcReq.CalOpts) {
    this.calShowItem = channelMsg
    this.calShow = true
  }

  openBatch() {
    this.batchShow = true
  }

  sysLogOpen() {
    this.sysLogShow = true
  }

  setChannelStatus(data: any) {
    this.$refs.setChannelStatus.changeStatus(data)
  }

  slaverDetails(slaverId: number) {
    this.showSlaverDetail = this.showSlaverDetail === slaverId ? null : slaverId
  }

  async setTranslate() {
    await SettingStatus.toggleReadTranslate()
  }

  importHistory(filePath: string) {
    this.$command.send('/createdWin', {
      type: 'history',
      data: {
        filePath
      }
    })
  }

  openSeparat() {
    this.$command.send('/createdWin', {
      type: 'separat'
    })
  }

  trendChange() {
    if (this.trendUnRegister) {
      this.trendUnRegister()
    }
    if (!this.portPath || this.activeMasterId === null) {
      return
    }

    const { unRegister } = this.$command.on({
      eventName: `/port/translate/${this.activeMasterId}`,
      onEmit: data => {
        data.list.forEach(item => {
          const slaver = this.activeMaster?.slaverList[item.slaverId]
          if (slaver) {
            ChannelStatus.SET_SAMPMAP({
              masterId: this.activeMasterId!,
              samp: item
            })
            // const component = this.$refs[`${this.activeMasterId}_${item.slaverId}_${item.channelId}`][0] // eslint-disable-line
            // if (component) {
            //   component.updateSamp(item)
            // }
          }
        })
      },
      vm: this
    })
    this.trendUnRegister = unRegister
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

      @each $status, $val in $statusColor {
        &.#{$status} .color-icon {
          background-color: $val;
        }
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
  border-bottom: 1px solid #ccc;
  padding: 14px 10px;
  background-color: #eff0f1;
  &:last-child {
    border-bottom: none;
  }
  .slaver-channel-box {
    display: flex;
    align-items: center;

    .slaver-item-l {
      flex: 0 0 60px;
    }
  }
  // .slaver-details-box {
  //   height: 800px;
  // }

  .channel-list {
    flex: 1 0 auto;
    display: flex;
    .channel-item {
      flex: 1 0 auto;
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

.select-file-btn {
  display: inline-block;
  margin-left: 10px;
}
</style>
