<template>
  <div>
    <template v-if="form">
      <el-form ref="form" :model="form" label-width="25%">
        <el-form-item
          v-for="UIitem in formUI"
          :key="UIitem.key"
          :label="UIitem.label"
        >
          <el-col class="from-sub-item">
            <span class="from-sub-name">上限</span>
            <el-input-number
              class="small-input"
              v-model="form[UIitem.key].max"
              controls-position="right"
            ></el-input-number>
          </el-col>
          <el-col class="from-sub-item">
            <span class="from-sub-name">下限</span>
            <el-input-number
              class="small-input"
              v-model="form[UIitem.key].min"
              controls-position="right"
            ></el-input-number>
          </el-col>
        </el-form-item>
      </el-form>
      <FromAction
        ref="FromAction"
        title="采样设置"
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
export default class Sampling extends Vue {
  $refs!: {
    FromAction: FromAction
  }

  form = deepClone(SettingStatus.sampling)

  formUI = [
    { label: '电压：', key: 'U' },
    { label: '电流：', key: 'I' }
  ]

  storeData = {
    type: 'userConfig',
    key: 'sampling'
  }

  async submit() {
    const data = await setStoreConfig({
      ...this.storeData,
      data: this.form
    })
    if (data.status) {
      this.$message.success('保存参数成功')
      this.update()
    }
  }

  update() {
    SettingStatus.getUserConfg().then(() => {
      this.form = deepClone(SettingStatus.sampling)
      this.$refs.FromAction.update()
    })
  }

  // async getConfig() {
  //   const data = await getStoreConfig(this.storeData)
  //   if (data.status) {
  //     this.form = data.data
  //     this.$nextTick(() => {
  //       this.$refs.FromAction.update()
  //     })
  //   }
  // }

  mounted() {
    this.$nextTick(() => {
      this.$refs.FromAction.update()
    })
  }
}
</script>


