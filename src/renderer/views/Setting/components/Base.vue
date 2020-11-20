<template>
  <div>
    <el-form ref="form" :model="form" label-width="25%">
      <el-form-item label="通讯方式" class="port-select">
        <el-select v-model="form.requestType" placeholder="选择通讯方式">
          <el-option
            v-for="item in requestList"
            :key="item.type"
            :label="item.name"
            :value="item.type"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item
        label="串口"
        class="port-select"
        v-if="form.requestType === 'Port'"
      >
        <el-select v-model="form.portPath" placeholder="选择串口">
          <el-option
            v-for="item in portList"
            :key="item.path"
            :label="item.path"
            :value="item.path"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="IP设置" v-else-if="form.requestType === 'Tcp'">
        <el-button @click="showIpConfig = true">IP设置</el-button>
      </el-form-item>
    </el-form>
    <FromAction
      ref="FromAction"
      title="基础设置"
      :data.sync="form"
      @submit="submit"
    ></FromAction>
    <ip-config :show.sync="showIpConfig" :baseConfig="form" />
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import FromAction from './FromAction.vue'
import { setStoreConfig } from '@/renderer/ipc/storeConfig'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { deepClone } from '@/shared/utils'
import IpConfig from './ipConfig/index.vue'

@Component({
  components: {
    FromAction,
    IpConfig
  }
})
export default class Base extends Vue {
  $refs!: {
    FromAction: FromAction
  }

  form = deepClone(SettingStatus.base)
  portList: any[] = []

  requestList = [
    { type: 'Port', name: '串口' },
    { type: 'Tcp', name: '网口' }
  ]

  showIpConfig = false

  async submit() {
    const data = await setStoreConfig({
      type: 'userConfig',
      key: 'base',
      data: this.form
    })
    if (data.status) {
      this.$message.success('保存成功')
      this.update()
    }
  }

  async update() {
    await SettingStatus.getUserConfg()
    this.form = deepClone(SettingStatus.base)
    this.$refs.FromAction.update()
  }

  /** 子组件ipConfig调用，更改连接类型 */
  updateRequestType() {
    this.form = this.$refs.FromAction.rollBack()
    this.form.requestType = 'Tcp'
    return this.submit()
  }

  getPortList() {
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
  }

  mounted() {
    this.getPortList()
    this.$nextTick(() => {
      this.$refs.FromAction.update()
    })
  }
}
</script>

<style>
.commui-config {
  display: flex;
  margin-bottom: 40px;
}
</style>
