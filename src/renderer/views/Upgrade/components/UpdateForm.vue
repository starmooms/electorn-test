<template>
  <div>
    <el-form ref="form" :model="form" label-width="100px">
      <el-form-item label="机柜">
        <div class="select-master">
          <el-col :span="20">
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
          </el-col>
          <el-col :span="4">
            <el-button type="text" @click="selectAllMaster">全选</el-button>
          </el-col>
        </div>
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
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import FileSelect from '@/renderer/components/FileSelect.vue'

@Component({
  components: {
    FileSelect
  }
})
export default class UpdateForm extends Vue {
  @Prop({ type: Number, required: true }) upgradeType!: number

  form = {
    masterIds: [] as number[],
    filePath: ''
  }

  fileType = ['hex']

  get staticMaster() {
    return ChannelStatus.staticChList.master
  }

  /** 全选 */
  selectAllMaster() {
    if (this.form.masterIds.length === this.staticMaster.length) {
      this.form.masterIds = []
    } else {
      this.form.masterIds = this.staticMaster.map(item => item.id)
    }
  }

  async submit() {
    this.form.masterIds.sort((a, b) => a - b)
    const { masterIds, filePath } = this.form
    if (masterIds.length === 0) {
      return this.$message.error('请先选择机柜')
    } else if (!filePath) {
      return this.$message.error('请先选择更新文件')
    }

    this.$emit('submit', {
      masterIds,
      filePath,
      upgradeType: this.upgradeType
    })
  }
}
</script>
<style lang="scss" scoped>
.limt-form-item {
  width: 420px;
}

.select-master {
  width: 246px;
}
</style>
