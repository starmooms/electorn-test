<template>
  <div>
    <template v-if="form">
      <el-form ref="form" :model="form" label-width="25%">
        <el-form-item label="串口" class="port-select">
          <el-select v-model="form.portPath" placeholder="选择串口">
            <el-option
              v-for="item in portList"
              :key="item.path"
              :label="item.path"
              :value="item.path"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <FromAction
        ref="FromAction"
        title="基础设置"
        :data.sync="form"
        @submit="submit"
      ></FromAction>
    </template>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import FromAction from './FromAction.vue'
import { setStoreConfig } from '@/renderer/ipc/storeConfig'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { deepClone } from '@/shared/utils'

@Component({
  components: {
    FromAction
  }
})
export default class Base extends Vue {
  $refs!: {
    FromAction: FromAction
  }

  form = deepClone(SettingStatus.base)
  portList: any[] = []

  storeData = {
    type: 'userConfig',
    key: 'base'
  }

  async submit() {
    const data = await setStoreConfig({
      ...this.storeData,
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

  getPortList() {
    this.$command.on({
      eventName: '/port/sendList',
      onEmit: data => {
        console.log(data)
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
