<template>
  <div
    class="channel-item"
    :class="[sampData.workerStatus.status, { error: sampData.errorMsg }]"
    @click="showChannel"
  >
    <context-menu @open="openMenu">
      <div
        class="channel-box"
        @mouseenter="tipShow = true"
        @mouseleave="tipShow = false"
      >
        <div v-if="sampData.errorMsg" class="sigh-box">
          <svg-icon icon-class="sigh"></svg-icon>
        </div>
        <div v-if="tipShow" class="tip-box">
          <div class="tip-box-wrap">
            状态：{{ sampData.workerStatus.name }}
            <br />
            电压: {{ sampData.U }}
            <br />
            电流: {{ sampData.I }}
            <template v-if="waitStatus.indexOf(sampData.workerCode) < 0">
              <!-- <br />
              启动时刻：{{ channelData.workerStart }} -->
              <br />
              当前工步：{{ sampData.stepId + 1 }}
            </template>

            <template v-if="sampData.errorMsg">
              <br />
              错误信息：{{ sampData.errorMsg }}
            </template>
          </div>
        </div>
        <div class="channel-text-icon">
          <i class="channe-b-top-icon"></i>
          <div class="channel-border-icon">
            U：{{ sampData.U }}
            <br />
            I：{{ sampData.I }}
          </div>
        </div>
        <!-- <svg-icon class="channel-icon" icon-class="batter"></svg-icon> -->
      </div>
      <template v-slot:menu>
        <a href="javascript:;" @click="changeStatus('start')">启动</a>
        <a
          v-for="menu in batteryCtxMenu"
          :key="menu.action"
          href="javascript:;"
          @click="changeStatus(menu.action)"
        >
          {{ menu.name }}
        </a>
      </template>
    </context-menu>
  </div>
</template>
<script lang="ts">
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { Vue, Component, Prop } from 'vue-property-decorator'
import ContextMenu from '@/renderer/components/ContextMenu.vue'
import { getDefatulSamp } from '@/renderer/utils/util'
import { CHANNEL_STATUS_END } from '@/shared/config/port'

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
  waitStatus = CHANNEL_STATUS_END

  get id() {
    return this.channelData.id
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
  changeStatus(status: string) {
    if (status === 'start') {
      this.$emit('start', {
        slaverIds: [this.slaverId],
        channelIds: [this.id],
        masterIds: [this.masterId]
      })
    } else {
      this.$emit('setChannelStatus', {
        params: {
          slaverId: this.slaverId,
          channelId: this.id,
          masterId: this.masterId,
          status
        },
        isSingle: true
      })
    }
  }

  /** 打开通道详细页面 */
  showChannel() {
    this.$command.send('/createdWin', {
      type: 'channel',
      data: {
        masterId: this.masterId,
        slaverId: this.slaverId,
        channelId: this.id
      }
    })
  }

  getChannelMsg(): ipcReq.PortItem {
    return {
      masterId: this.masterId,
      slaverId: this.slaverId,
      channelId: this.id
    }
  }
}
</script>
<style lang="scss">
$noConnect-cl: #ccc;

.channel-item {
  text-align: center;
  cursor: pointer;

  &:hover {
    .channel-icon,
    .channel-text-icon {
      transform: translate3d(0, -4px, 0);
    }
  }

  .channel-icon {
    font-size: 40px;
    color: $noConnect-cl;
    transition: all 0.2s;
  }

  .channel-text-icon {
    position: relative;
    box-sizing: border-box;
    display: inline-block;
    font-size: 0;
    transition: all 0.2s;

    .channe-b-top-icon {
      display: inline-block;
      width: 24px;
      height: 4px;
      background-color: $noConnect-cl;
    }

    .channel-border-icon {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 82px;
      height: 48px;
      font-size: 12px;
      border: 4px solid $noConnect-cl;
    }
  }

  .sigh-box {
    position: absolute;
    top: 0;
    right: 50%;
    margin-right: -54px;
    color: $--color-error;
  }

  @each $status, $val in $statusColor {
    &.#{$status} {
      .channel-icon {
        color: $val;
      }

      .channel-text-icon {
        .channe-b-top-icon {
          background-color: $val;
        }

        .channel-border-icon {
          border-color: $val;
        }
      }
    }
  }
}

.channel-box {
  /* &:hover {
    .tip-box {
      display: block;
    }
  } */

  $tipW: 200px;

  position: relative;

  .tip-box {
    $tipIw: 6px;

    position: absolute;
    top: 100%;
    left: 50%;
    z-index: 99;
    box-sizing: border-box;
    width: $tipW;
    margin-top: 8px;
    margin-left: -($tipW/2);
    font-size: 12px;
    line-height: 1.6;
    color: #fff;

    .tip-box-wrap {
      display: inline-block;
      padding: 6px;
      background-color: $--color-bg-reversal;
      border-radius: 4px;
    }

    &::after {
      position: absolute;
      bottom: 100%;
      left: 50%;
      width: 0;
      height: 0;
      margin-left: -$tipIw;
      content: '';
      border: $tipIw solid transparent;
      border-bottom-color: $--color-bg-reversal;
    }
  }
}
</style>
