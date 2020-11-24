<template>
  <el-dialog width="600px" :visible.sync="dialog" :close-on-click-modal="false">
    <el-form :inline="true">
      <el-form-item label="创建时间" class="filter-box">
        <el-date-picker
          v-model="filterDate"
          type="datetimerange"
          start-placeholder="大于等于"
          end-placeholder="小于"
          value-format="yyyy-MM-dd HH:mm:ss"
        ></el-date-picker>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleDelete">删除</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
<script lang="ts">
import { Vue, Component, PropSync } from 'vue-property-decorator'

@Component
export default class DeleteDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  filterDate: string[] = []

  handleDelete() {
    console.log(this.filterDate)
    const [startTime, endTime] = this.filterDate
    if (!startTime || !endTime) {
      return this.$message.error('请选择起始和结束日期')
    }
    this.$emit('delete', {
      startTime,
      endTime
    })
  }
}
</script>
<style lang="scss" scoped></style>
