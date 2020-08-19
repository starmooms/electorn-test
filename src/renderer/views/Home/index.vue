<template>
  <div class="home">
    <el-form size="medium" :inline="true" class="port-select-form">
      <el-form-item label="串口" class="port-select">
        <el-select v-model="portItem" placeholder="选择串口">
          <el-option
            v-for="item in portList"
            :key="item.path"
            :label="item.path"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-button v-if="portItem" @click="setTranslate(portItem)">
        {{ portItem.readTranslate ? '关闭采样' : '打开采样' }}
      </el-button>
    </el-form>

    <ul class="master-list" v-if="portItem">
      <li class="master-item" v-for="(master, mKey) in batteryList" :key="mKey">
        <div class="master-box" @click="master.slaverShow = !master.slaverShow">
          <span>{{ master.name }}</span>
          <svg-icon class="channel-icon" icon-class="down"></svg-icon>
        </div>
        <el-collapse-transition>
          <ul class="slaver-list" v-if="master.slaverShow">
            <li
              class="slaver-item"
              v-for="(slaver, sKey) in master.slaverList"
              :key="sKey"
            >
              <div class="slaver-item-l">{{ slaver.name }}</div>
              <ul class="channel-list">
                <li
                  class="channel-item"
                  v-for="(channel, ckey) in slaver.list"
                  :span="3"
                  :key="ckey"
                  @click="showChannel(master, channel, slaver)"
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
                        @click="calOpen(channel, slaver, master)"
                      >
                        设置
                      </a>
                      <a
                        href="javascript:;"
                        @click="stepsSetShow(channel, slaver, master)"
                      >
                        编辑工步
                      </a>
                    </template>
                  </ContextMenu>
                </li>
              </ul>
              <div class="slaver-item-r">
                <el-button @click="openSlaverTrend(master, slaver)">
                  查看
                </el-button>
              </div>
            </li>
          </ul>
        </el-collapse-transition>
      </li>
    </ul>

    <StepSetModal
      :show.sync="stepsShow"
      :showItem="stepsShowItem"
    ></StepSetModal>

    <CalModal :show.sync="calShow" :showItem="calShowItem"></CalModal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ContextMenu from '@/renderer/components/ContextMenu.vue'
import { channelList } from '@/shared/config/port'
import { typedKeys } from '@/shared/utils'
import { setChannelStatus, translateSet } from '@/renderer/ipc/channel'
import StepSetModal from '@/renderer/components/StepSetModal.vue'
import CalModal from '@/renderer/components/CalModal.vue'

@Component({
  name: 'Home',
  components: {
    ContextMenu,
    StepSetModal,
    CalModal
  }
})
export default class Home extends Vue {
  batteryShow = []
  batteryCtxMenu = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '关闭', action: 'close' }
  ]
  batteryList: any = {}

  portItem: any = null
  portList: any[] = []

  stepsShow = false
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

  changeStatus(status, channel, slaver) {
    if (!this.portItem) {
      return this.$message.info('请先选择串口')
    }
    setChannelStatus({
      path: this.portItem.path,
      slaverId: slaver.id,
      channelId: channel.id,
      status
    })
  }

  stepsSetShow(channel: any, slaver: any, master: any) {
    this.stepsShowItem = {
      path: this.portItem.path,
      masterId: master.id,
      slaverId: slaver.id,
      channelId: channel.id
    }
    this.stepsShow = true
  }

  calOpen(channel: any, slaver: any, master: any) {
    this.calShowItem = {
      path: this.portItem.path,
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
        path: this.portItem.path,
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
        path: this.portItem.path,
        masterId: master.id,
        slaverId: slaver.id
      }
    })
  }

  async setTranslate(portItem: any) {
    const status = !portItem.readTranslate
    await translateSet({
      path: portItem.path,
      status
    })
    portItem.readTranslate = status
  }

  mounted() {
    this.$command.on({
      eventName: '/port/sendList',
      onEmit: data => {
        this.portList = data.list.map(item => {
          return {
            readTranslate: false,
            ...item
          }
        })
      },
      vm: this
    })
    this.$command.send('/port/getPortList', true)
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
</style>
