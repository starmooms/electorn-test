<template>
  <el-dialog
    class="cal-dialog"
    title="局部设置"
    width="700px"
    :close-on-click-modal="false"
    :visible.sync="dialog"
  >
    <el-form :inline="true" class="cal-form">
      <el-form-item
        v-for="(item, index) in list"
        :key="index"
        class="form-item"
        :label="`${item.name}${item.key}`"
      >
        <el-input v-model.number="item.value" />
      </el-form-item>
    </el-form>

    <div slot="footer">
      <el-button @click="dialog = false">取 消</el-button>
      <el-button type="primary" @click="save">
        确 定
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'
import { getCalList } from '@/shared/config/port'
import { setCal, readCal } from '@/renderer/ipc/channel'

@Component
export default class CalModal extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  @Prop({ type: Object }) private showItem!: ipcReq.CalOpts

  list = getCalList()

  @Watch('dialog')
  async dialogChange(v) {
    if (v === true) {
      if (!this.showItem) {
        this.$message.error('缺少通道参数')
      }
      const data = await readCal(this.showItem)
      if (data.status) {
        this.list = data.data.list
      }
    }
  }

  async save() {
    const data = await setCal({
      ...this.showItem,
      list: this.list
    })
    if (data.status) {
      this.$message.success('设置校准成功')
    }
  }

  // mounted() {}
}
</script>

<style lang="scss">
.cal-form {
  display: flex;
  flex-flow: row wrap;
  height: 40vh;
  overflow: auto;

  .form-item {
    flex: 0 1 50%;
    margin-right: 0;

    .el-form-item__content {
      width: 140px;
    }
  }
}
</style>
