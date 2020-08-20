<template>
  <el-dialog
    title="保存工步模板"
    :close-on-click-modal="false"
    :visible.sync="dialog"
    width="300px"
    class="step-tpl-save"
  >
    <el-form>
      <el-form-item label="工步模板名称">
        <el-input v-model.trim="stepTplName" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>

    <div slot="footer">
      <el-button @click="closeModal">取 消</el-button>
      <el-button type="primary" @click="stepsTplSave" :loading="this.loading">
        确 定
      </el-button>
    </div>
  </el-dialog>
</template>
<script lang="ts">
import { Vue, Component, PropSync, Prop, Watch } from 'vue-property-decorator'
import { setStoreConfig } from '@/renderer/ipc/storeConfig'

@Component
export default class StepTplSave extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean
  @Prop({
    type: Array,
    default() {
      return []
    }
  })
  list!: any[]

  loading = false
  stepTplName = ''

  @Watch('dialog')
  changeDialog(v: boolean) {
    if (v) {
      this.stepTplName = ''
    }
  }

  async stepsTplSave() {
    try {
      if (this.loading) return
      this.loading = true
      if (!this.stepTplName) {
        return this.$message.info('请先输入模板名称')
      }
      await setStoreConfig({
        type: 'workStepTpl',
        data: {
          name: this.stepTplName,
          list: this.list
        }
      })
      this.closeModal()
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  closeModal() {
    this.dialog = false
  }
}
</script>

<style lang="scss">
.step-tpl-save {
  .el-dialog__body {
    padding: 10px 20px;
  }
}
</style>
