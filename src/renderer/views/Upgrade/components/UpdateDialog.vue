<template>
  <div>
    <el-dialog
      class="update-dialog"
      width="600px"
      :title="title"
      :visible.sync="dialog"
      :close-on-click-modal="false"
      :show-close="false"
      :modal-append-to-body="true"
    >
      <p class="info">机柜：{{ masterInfo }}</p>
      <p class="info">升级中...</p>
      <el-progress
        :text-inside="true"
        :stroke-width="20"
        :percentage="percent"
      ></el-progress>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, PropSync } from 'vue-property-decorator'

@Component
export default class UpdateDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false }) private dialog!: boolean
  @Prop({ type: String, default: '升级' }) title!: string
  @Prop({ type: Number, default: 0 }) percent!: number
  @Prop({ type: String, default: '' }) masterInfo!: string

  close() {
    this.$emit('close')
  }
}
</script>
<style lang="scss" scoped>
.update-dialog {
  ::v-deep .el-dialog__body {
    padding: 16px 20px;
  }

  .info {
    margin: 6px 0;
  }
}
</style>
