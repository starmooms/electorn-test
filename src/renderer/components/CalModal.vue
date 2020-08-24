<template>
  <el-dialog
    class="cal-dialog"
    title="设置"
    width="700px"
    :close-on-click-modal="false"
    :visible.sync="dialog"
  >
    <el-form :inline="true" class="cal-form">
      <el-form-item
        class="form-item"
        v-for="(item, index) in list"
        :key="index"
        :label="`${item.name}${item.key}`"
      >
        <el-input v-model="item.value"></el-input>
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

  @Prop({ type: Object }) private showItem!: any | null

  list = getCalList()

  @Watch('dialog')
  async dialogChange(v) {
    if (v === true) {
      if (this.showItem) {
        const data = await readCal(this.showItem)
        if (data.status) {
          this.list = data.data.list
        }
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
  height: 40vh;
  overflow: auto;
  display: flex;
  flex-flow: row wrap;
  .form-item {
    flex: 0 1 50%;
    margin-right: 0;
    .el-form-item__content {
      width: 140px;
    }
  }
}
</style>
