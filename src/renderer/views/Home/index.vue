<template>
  <div class="home">
    <div v-if="portPath">
      <el-form size="medium" :inline="true" class="port-select-form">
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
                      <ContextMenu>
                        <svg-icon
                          class="channel-icon"
                          icon-class="batter"
                        ></svg-icon>
                        <template v-slot:menu>
                          <a
                            href="javascript:;"
                            v-for="menu in batteryCtxMenu"
                            :key="menu.action"
                            @click="changeStatus(menu.action, channel, slaver)"
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
import { Component, Vue } from 'vue-property-decorator'
import ContextMenu from '@/renderer/components/ContextMenu.vue'
import { channelList } from '@/shared/config/port'
import { typedKeys } from '@/shared/utils'
import { setChannelStatus, translateSet } from '@/renderer/ipc/channel'
import StepSetModal from '@/renderer/components/StepSetModal/index.vue'
import CalModal from '@/renderer/components/CalModal.vue'
import SelectMaster from '@/renderer/components/SelectMaster.vue'
import BatchModal from './components/BatchModal.vue'
import { SettingStatus } from '@/renderer/store/modules/Setting'

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
  batteryCtxMenu = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '关闭', action: 'close' }
  ]
  batteryList: any = {}

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

  activeMasterId = ''

  get activeMaster() {
    return this.batteryList[this.activeMasterId]
  }

  handleClick() {}

  get readTranslate() {
    return SettingStatus.$readTranslate
  }

  changeStatus(status, channel, slaver) {
    setChannelStatus({
      path: this.portPath,
      slaverId: slaver.id,
      channelId: channel.id,
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

  async setTranslate() {
    await SettingStatus.toggleReadTranslate()
  }

  mounted() {
    const obj: any = {}
    typedKeys(channelList).forEach(masterKey => {
      obj[masterKey] = {
        slaverShow: false,
        ...(channelList[masterKey] as any)
      }
    })
    this.batteryList = obj
  }
}
</script>

<style lang="scss" scoped>
.port-select-form {
  width: 324px;
  .el-select {
    width: 270px;
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
