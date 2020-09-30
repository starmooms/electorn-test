<template>
  <div :class="{ hidden: hidden }" class="pagination-container">
    <el-pagination
      :background="background"
      :current-page.sync="currentPage"
      :page-size.sync="pageSize"
      :layout="layout"
      :page-sizes="pageSizes"
      :total="total"
      v-bind="$attrs"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop, PropSync } from 'vue-property-decorator'
import { scrollTo } from '@/renderer/utils/scrollTo'

@Component({
  components: {}
})
export default class Pagination extends Vue {
  @Prop({ type: Number, required: true }) total!: number
  @PropSync('page', { type: Number, default: 1 }) currentPage!: number
  @PropSync('limit', { type: Number, default: 20 }) pageSize!: number
  @Prop({ type: Boolean, default: true }) background!: boolean
  @Prop({ type: Boolean, default: true }) autoScroll!: boolean
  @Prop({ type: Boolean, default: false }) hidden!: boolean
  @Prop({ type: String, default: 'total, sizes, prev, pager, next, jumper' })
  layout!: string
  @Prop({
    type: Array,
    default() {
      return [10, 20, 30, 50]
    }
  })
  pageSizes!: []

  handleSizeChange(val) {
    this.$emit('pagination', { page: this.currentPage, limit: val })
    if (this.autoScroll) {
      console.log('??')
      scrollTo()
    }
  }

  handleCurrentChange(val) {
    this.$emit('pagination', { page: val, limit: this.pageSize })
    if (this.autoScroll) {
      console.log('??')
      scrollTo()
    }
  }
}
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 32px 16px;
}
.pagination-container.hidden {
  display: none;
}
</style>
