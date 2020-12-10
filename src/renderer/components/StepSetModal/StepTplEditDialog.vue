<template>
  <el-dialog
    title="工步模板编辑"
    width="910px"
    class="center-dialog"
    :close-on-click-modal="false"
    :visible.sync="dialog"
  >
    <el-form :inline="true">
      <el-form-item label="模板名称">
        <el-input v-model.trim="tplName"></el-input>
      </el-form-item>
    </el-form>
    <StepTplEdit ref="stepTplEdit" :show-start-id="false" />
    <div slot="footer">
      <el-button @click="closeModal">取 消</el-button>
      <el-button @click="saveEditTpl">保 存</el-button>
    </div>
  </el-dialog>
</template>
<script lang="ts">
import { Vue, Component, PropSync, Prop, Watch } from 'vue-property-decorator'
import { setStoreConfig } from '@/renderer/ipc/storeConfig'
import StepTplEdit from './StepTplEdit.vue'

@Component({
  components: {
    StepTplEdit
  }
})
export default class StepTplUse extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean
  @Prop({ type: Object, required: false }) editRow: any

  $refs!: {
    stepTplEdit: StepTplEdit
  }

  tplName = ''
  id = ''

  @Watch('dialog')
  changeDialog(v: boolean) {
    if (v === true) {
      this.$nextTick(() => {
        this.tplName = this.editRow.name
        this.id = this.editRow.id
        this.$refs.stepTplEdit.useTplData(this.editRow.tplData)
      })
    }
  }

  async saveEditTpl() {
    if (!this.tplName) {
      return this.$message.warning('模板名称不能为空')
    }
    const tplResult = await this.$refs.stepTplEdit.getTplData(false)
    if (tplResult.data) {
      const tpl = tplResult.data as any
      delete tpl.startId
      const params = {
        id: this.id,
        name: this.tplName,
        tplData: tpl
      }
      const data = await setStoreConfig({
        type: 'workStepTpl',
        data: params
      })
      if (data.status) {
        this.$emit('saveTplSuccess', params)
        this.closeModal()
      }
    }
  }

  closeModal() {
    this.dialog = false
  }
}
</script>
<style lang="scss" scoped></style>
