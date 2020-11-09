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
  @Prop({ type: String, default: '#main-left' }) autoScrollDom!: string

  scrollDom!: Element

  handleSizeChange(val) {
    this.$emit('pagination', { page: this.currentPage, limit: val })
    this.checkScroll()
  }

  handleCurrentChange(val) {
    this.$emit('pagination', { page: val, limit: this.pageSize })
    this.checkScroll()
  }

  checkScroll() {
    if (this.autoScroll) {
      const dom = this.getScrollDom()
      if (dom) {
        scrollTo({
          dom
        })
      }
    }
  }

  getScrollDom() {
    if (!this.scrollDom) {
      this.scrollDom = document.querySelector(`${this.autoScrollDom}`)!
    }
    return this.scrollDom
  }

  setScrollDom(dom: Element) {
    this.scrollDom = dom
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
