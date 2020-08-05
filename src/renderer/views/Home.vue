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

    <el-collapse>
      <el-collapse-item
        v-for="(value, key) in batteryList"
        :key="key"
        :title="key"
        :name="key"
      >
        <el-collapse-item
          v-for="(value, key) in batteryList"
          :key="key"
        >
          
        </el-collapse-item>
      </el-collapse-item>
    </el-collapse>
    <ContextMenu>
      <svg-icon icon-class="batter"></svg-icon>
      <template v-slot:menu>
        <a
          href="javascript:;"
          v-for="menu in batteryCtxMenu"
          :key="menu.action"
          @click="changeStatus(menu.action)"
        >
          {{ menu.name }}
        </a>
      </template>
    </ContextMenu>
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
  batteryCtxMenu = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '关闭', action: 'close' }
  ]
  batteryList: any = {}

  portItem: any = null
  portList: any[] = []

  changeStatus(status) {
    console.log(status)
    if (!this.portItem) {
      return this.$message.info('请先选择串口')
    }
    this.$command.send('/port/slaver/setStatus', {
      path: this.portItem.path,
      slaverId: 0,
      channel: 1,
      status
    })
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
</style>
