<template>
  <div class="home">
    <div>
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
        <el-button type="primary" @click="openSorting">
          容量分选
        </el-button>
        <el-button type="primary" @click="sysLogOpen">
          查看系统日志
        </el-button>
        <div class="select-file-btn">
          <FileSelect open-type="file" @change="importHistory">
            <el-button type="primary">
              导入外部文件
            </el-button>
          </FileSelect>
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

      <TitleBox name="通道列表">
        <SelectMaster v-model="activeMasterId" />
        <Transition name="el-fade-in">
          <div v-if="activeMaster" class="channel-main-box">
            <el-card class="box-card" shadow="never">
              <div slot="header" class="box-card-header">
                <span>{{ activeMaster.name }}</span>
              </div>
              <ul class="slaver-list">
                <li
                  v-for="(slaver, sKey) in activeMaster.slaverList"
                  :key="sKey"
                  class="slaver-item"
                >
                  <div class="slaver-channel-box">
                    <div class="slaver-item-l">{{ slaver.name }}</div>
                    <div class="channel-list">
                      <ChannelItem
                        v-for="(channel, ckey) in slaver.list"
                        :key="`${activeMasterId}_${sKey}_${ckey}`"
                        :ref="`${activeMasterId}_${slaver.id}_${channel.id}`"
                        :master-id="activeMaster.id"
                        :slaver-id="slaver.id"
                        :channel-data="channel"
                        @stepEditOpen="stepsSetShow"
                        @start="channelStart"
                        @setChannelStatus="setChannelStatus"
                      />
                    </div>
                    <el-button @click="slaverDetails(slaver.id)">
                      查看
                    </el-button>
                  </div>
                  <el-collapse-transition name="el-fade-in">
                    <SlaverDetails
                      v-if="showSlaverDetail === slaver.id"
                      :master-id="activeMasterId"
                      :slaver="slaver"
                    />
                  </el-collapse-transition>
                </li>
              </ul>
            </el-card>
          </div>
        </Transition>
      </TitleBox>

      <StepSetModal
        :show.sync="stepsShow"
        :show-item="stepsShowItem"
        :is-batch="stepsBatch"
        @openSysLog="sysLogOpen"
      />

      <BatchModal
        ref="batchModal"
        :show.sync="batchShow"
        @setChannelStatus="setChannelStatus"
      />

      <SetChannelStatus ref="setChannelStatus" @openSysLog="sysLogOpen" />
      <SysLog :show.sync="sysLogShow" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import StepSetModal from '@/renderer/components/StepSetModal/index.vue'
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

  stepsShow = false
  stepsBatch = false
  stepsShowItem: any = {
    masterId: null,
    slaverId: null,
    channelId: null
  }

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

  openSorting() {
    this.$command.send('/createdWin', {
      type: 'sorting'
    })
  }

  trendChange() {
    if (this.trendUnRegister) {
      this.trendUnRegister()
    }
    if (this.activeMasterId === null) {
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
.home {
  padding-bottom: 40px;
}

.color-box {
  .color-box-list {
    display: flex;
    align-items: center;

    li {
      display: inline-flex;
      align-items: center;
      margin-right: 20px;

      .color-icon {
        width: 14px;
        height: 14px;
        margin-right: 4px;
        background-color: #ccc;
        border-radius: 4px;
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
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    line-height: 40px;
  }
}

.slaver-list {
  margin: 0;
}

.slaver-item {
  padding: 14px 10px;
  background-color: #eff0f1;
  border-bottom: 1px solid #ccc;

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
    display: flex;
    flex: 1 0 auto;

    .channel-item {
      flex: 1 0 auto;
    }
  }
}

.channel-main-box {
  padding-bottom: 40px;
}

.box-card {
  margin-top: 40px;
  overflow: initial;

  .box-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
