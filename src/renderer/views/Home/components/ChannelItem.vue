<template>
  <div
    class="channel-item"
    :class="[sampData.workerStatus.status, { error: sampData.errorMsg }]"
    @click="showChannel"
  >
    <ContextMenu @open="openMenu">
      <div
        class="channel-box"
        @mouseenter="tipShow = true"
        @mouseleave="tipShow = false"
      >
        <div class="sigh-box" v-if="sampData.errorMsg">
          <svg-icon icon-class="sigh"></svg-icon>
        </div>
        <div class="tip-box" v-if="tipShow">
          <div class="tip-box-wrap">
            状态：{{ sampData.workerStatus.name }}
            <br />
            电压: {{ sampData.U }}
            <br />
            电流: {{ sampData.I }}
            <template v-if="waitStatus.indexOf(sampData.workerCode) < 0">
              <br />
              启动时刻：{{ channelData.workerStart }}
              <br />
              当前工步：{{ sampData.workerId }}
            </template>

            <template v-if="sampData.errorMsg">
              <br />
              错误信息：{{ sampData.errorMsg }}
            </template>
          </div>
        </div>
        <svg-icon class="channel-icon" icon-class="batter"></svg-icon>
      </div>
      <template v-slot:menu>
        <a
          href="javascript:;"
          v-for="menu in batteryCtxMenu"
          :key="menu.action"
          @click="changeStatus(menu.action)"
        >
          {{ menu.name }}
        </a>
        <a href="javascript:;" @click="calEditOpen">
          局部设置
        </a>
        <a href="javascript:;" @click="stepEditOpen">
          编辑工步
        </a>
      </template>
    </ContextMenu>
  </div>
</template>
<script lang="ts">
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { Vue, Component, Prop } from 'vue-property-decorator'
import ContextMenu from '@/renderer/components/ContextMenu.vue'
import { getDefatulSamp } from '@/renderer/utils/util'
import setChannelStatus from '@/renderer/utils/setChannelStatus'
import setChannelStatus from '@/renderer/utils/setChannelStatus.vue'

declare type SampData = Pick<
  Port.SampItem,
  'U' | 'I' | 'errorMsg' | 'workerStatus' | 'workerCode'
> & {
  workerId: number | null
}

@Component({
  components: {
    ContextMenu
  }
})
export default class ChannelItem extends Vue {
  @Prop({ type: Number, required: true }) masterId!: number
  @Prop({ type: Number, required: true }) slaverId!: number
  @Prop({ type: Object, required: true }) channelData!: Port.ChannelItem

  tipShow = false
  waitStatus = ['00', '02']

  get id() {
    return this.channelData.id
  }

  get portPath() {
    return SettingStatus.portPath
  }

  get batteryCtxMenu() {
    return ChannelStatus.statusList
  }

  get sampData() {
    return (
      ChannelStatus.sampMap[`${this.masterId}_${this.slaverId}_${this.id}`] ||
      getDefatulSamp()
    )
  }

  /** 打开右键菜单 */
  openMenu() {
    this.tipShow = true
  }

  /** 改变状态 */
  async changeStatus(status) {
    await setChannelStatus(
      {
        path: this.portPath,
        slaverId: this.slaverId,
        channelId: this.id,
        masterId: this.masterId,
        status
      },
      true,
      this
    )
  }

  // /** 更新采样 */
  // updateSamp(sampData: Port.SampItem) {
  //   // this.sampData = {
  //   //   U: sampData.U,
  //   //   I: sampData.I,
  //   //   workerId: sampData.workerId,
  //   //   errorMsg: sampData.errorMsg,
  //   //   workerStatus: sampData.workerStatus,
  //   //   workerCode: sampData.workerCode
  //   // }
  // }

  /** 打开通道详细页面 */
  showChannel() {
    this.$command.send('/createdWin', {
      type: 'channel',
      data: {
        path: this.portPath,
        masterId: this.masterId,
        slaverId: this.slaverId,
        channelId: this.id
      }
    })
  }

  getChannelMsg() {
    return {
      masterId: this.masterId,
      slaverId: this.slaverId,
      channelId: this.id
    }
  }

  /** 打开工步编辑 */
  stepEditOpen() {
    this.$emit('stepEditOpen', this.getChannelMsg())
  }

  /** 打开局部设置 */
  calEditOpen() {
    this.$emit('calEditOpen', this.getChannelMsg())
  }
}
</script>
<style lang="scss">
.channel-item {
  cursor: pointer;
  text-align: center;
  &:hover {
    .channel-icon {
      transform: translate3d(0, -4px, 0);
    }
  }

  @each $status, $val in $statusColor {
    &.#{$status} .channel-icon {
      color: $val;
    }
  }

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

.channel-box {
  position: relative;
  /* &:hover {
    .tip-box {
      display: block;
    }
  } */

  $tipW: 200px;
  .tip-box {
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
