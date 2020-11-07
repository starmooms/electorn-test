<template>
  <div>
    <el-divider content-position="left">机柜升级</el-divider>
    <el-form ref="form" :model="form" label-width="100px">
      <el-form-item label="机柜">
        <el-select
          v-model="form.masterIds"
          multiple
          collapse-tags
          placeholder="请选择机柜"
        >
          <el-option
            v-for="item in staticMaster"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="limt-form-item" label="选择更新文件">
        <el-input v-model="form.filePath">
          <file-select
            slot="append"
            v-model="form.filePath"
            openType="file"
            :fileType="fileType"
          ></file-select>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">立即升级</el-button>
      </el-form-item>
    </el-form>
    <el-divider content-position="left">丛控升级</el-divider>
  </div>
</template>
<script lang="ts">
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { Vue, Component } from 'vue-property-decorator'
import FileSelect from '@/renderer/components/FileSelect.vue'
import { upgradeStart } from '@/renderer/ipc/channel'

@Component({
  components: {
    FileSelect
  }
})
export default class Upgrade extends Vue {
  form = {
    masterIds: [],
    filePath: ''
  }

  fileType = ['hex']

  get staticMaster() {
    return ChannelStatus.staticChList.master
  }

  async submit() {
    this.form.masterIds.sort((a, b) => a - b)
    const { masterIds, filePath } = this.form
    if (masterIds.length === 0) {
      return this.$message.error('请先选择机柜')
    } else if (!filePath) {
      return this.$message.error('请先选择更新文件')
    }
    await upgradeStart({
      masterIds,
      filePath,
      upgradeType: 1
    })
  }
}
</script>
<style lang="scss" scoped>
.limt-form-item {
  width: 420px;
}
</style>
