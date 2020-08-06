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
    </el-form>

    <el-collapse v-model="batteryShow" v-if="portItem">
      <el-collapse-item
        class="master-item"
        v-for="(master, mKey) in batteryList"
        :key="mKey"
        :title="mKey"
        :name="mKey"
      >
        <ul class="slaver-list" v-if="batteryShow.indexOf(mKey) >= 0">
          <li class="slaver-item" v-for="(slaver, sKey) in master" :key="sKey">
            <div class="slaver-item-l">{{ sKey }}</div>
            <ul class="channel-list">
              <li
                class="channel-item"
                v-for="(channel, ckey) in slaver.list"
                :span="3"
                :key="ckey"
              >
                <ContextMenu>
                  <svg-icon class="channel-icon" icon-class="batter"></svg-icon>
                  <template v-slot:menu>
                    <a
                      href="javascript:;"
                      v-for="menu in batteryCtxMenu"
                      :key="menu.action"
                      @click="changeStatus(menu.action, channel, slaver)"
                    >
                      {{ menu.name }}
                    </a>
                    <a href="javascript:;" @click="stepsSetShow">编辑工步</a>
                  </template>
                </ContextMenu>
              </li>
            </ul>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ContextMenu from '@/renderer/components/ContextMenu.vue'
import { channelList } from '@/shared/config/port'

@Component({
  name: 'Home',
  components: {
    ContextMenu
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

  changeStatus(status, channel, slaver) {
    console.log(status, channel, slaver)
    if (!this.portItem) {
      return this.$message.info('请先选择串口')
    }
    this.$command.send('/port/slaver/setStatus', {
      path: this.portItem.path,
      slaverId: slaver.id,
      channel: channel.id,
      status
    })
  }

  stepsSetShow() {
    this.stepsShow = true
  }

  mounted() {
    this.$command.register({
      eventName: 'usbData',
      onEmit: data => {
        if (data) {
          if (data.type === 'list') {
            this.portList = data.list
            console.log(this.portList)
          }
        }
      },
      vm: this
    })
    this.$command.send('usbDetection', true)
    this.batteryList = channelList
  }

  beforeDestroy() {
    this.$command.send('usbDetection', false)
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
}
.slaver-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ccc;
  padding: 16px 10px;

  .slaver-item-l {
    flex: 0 0 100px;
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

      .channel-icon {
        transition: all 0.2s;
        color: #606266;
        font-size: 46px;
      }
    }
  }
}
</style>
