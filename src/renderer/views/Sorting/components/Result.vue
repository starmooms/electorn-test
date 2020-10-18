<template>
  <div class="sorting-result">
    <el-table
      border
      class="min-el-tabel border-el-table"
      height="300px"
      :data="levelResult"
    >
      <!-- <el-table-column type="index" label="序号" width="60" /> -->
      <el-table-column prop="id" label="等级" width="60" />
      <el-table-column prop="desc" label="等级描述" />
      <el-table-column prop="num" label="电池个数" width="80" />
      <el-table-column prop="total" label="电池总数" width="80" />
      <el-table-column prop="percent" label="比例" width="80" />
    </el-table>
    <div class="total-tabel">
      <el-table
        border
        class="min-el-tabel border-el-table"
        height="300px"
        :data="totalResult"
      >
        <el-table-column prop="masterName" label="柜号" width="60" />
        <el-table-column prop="num" label="电池个数" width="80" />
        <el-table-column prop="total" label="电池总数" width="80" />
        <el-table-column prop="percent" label="比例" />
      </el-table>
    </div>
  </div>
</template>

<script lang="ts">
import { getPercent } from '@/renderer/utils/util'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ChannelInfo extends Vue {
  @Prop({ type: Array, required: true }) levelResult!: SortingT.LevelResult[]

  totalResult: SortingT.BoxResult[] = []

  /** 设置机柜结果 */
  setBoxResult(boxResutl: SortingT.BoxResult[]) {
    const totalRow: SortingT.BoxResult = {
      masterId: -1,
      masterName: '合计',
      num: 0,
      total: 0,
      percent: ''
    }
    boxResutl.forEach(item => {
      totalRow.num += item.num
      totalRow.total += item.total
    })
    totalRow.percent = getPercent(totalRow.num, totalRow.total)
    this.totalResult = [totalRow, ...boxResutl]
  }
}
</script>
<style lang="scss" scoped>
.sorting-result {
  width: 500px;
  box-sizing: border-box;
  padding: 10px;
}

.total-tabel {
  margin-top: 40px;
}
</style>

<style lang="scss">
.min-el-tabel {
  td,
  th {
    padding: 0;
  }
  .cell {
    white-space: nowrap;
  }
}

.border-el-table {
  &.el-table--border,
  &.el-table--group {
    border: 1px solid #b3b3b3;
  }
}
</style>
