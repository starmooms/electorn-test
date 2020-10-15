<template>
  <div>
    <el-dialog
      class="center-dialog"
      title="选择历史数据"
      width="800px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <div class="history-container">
        <div v-loading="loading" class="box1">
          <el-table
            :data="list"
            stripe
            style="width: 100%"
            height="52vh"
            border
          >
            <!-- eslint-disable -->
            <el-table-column prop="id" label="序号" width="80"></el-table-column>
            <el-table-column prop="fileId" label="启动ID" width="180"></el-table-column>
            <el-table-column prop="masterIds" label="机柜号" width="180" show-overflow-tooltip></el-table-column>
            <el-table-column prop="slaverIds" label="丛控号" width="180" show-overflow-tooltip></el-table-column>
            <el-table-column prop="channelIds" label="通道号" width="180" show-overflow-tooltip></el-table-column>
            <!-- eslint-enable -->
          </el-table>
        </div>

        <pagination
          class="margin"
          v-show="total > 0"
          :total="total"
          :page.sync="listQuery.page"
          :limit.sync="listQuery.limit"
          @pagination="getList"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator'
import Pagination from '@/renderer/components/Pagination/index.vue'
import mainDb from '@/renderer/Db/mainDb'

@Component({
  components: {
    Pagination
  }
})
export default class HistoryDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  errorList: any[] = []
  total = 200
  listQuery = {
    page: 1,
    limit: 20
  }
  db!: mainDb
  list: Db.RErrorItem[] = []
  loading = false

  selectHistory: number | null = null

  async createDb() {
    this.db = new mainDb()
    await this.db.connect()
  }

  @Watch('dialog')
  changeDialog(v) {
    if (v === true) {
      this.selectHistory = null
    }
  }

  async getList() {
    try {
      this.loading = true
      const data = await this.db.getHistoryList(this.listQuery)
      this.total = data.total
      this.list = data.list
      console.log(data)
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  async init() {
    await this.createDb()
    this.getList()
  }

  mounted() {
    this.init()
  }

  beforeDestroy() {
    if (this.db) {
      this.db.close()
    }
  }
}
</script>
<style lang="scss" scoped>
// .history-container {
//   display: flex;
//   flex-flow: column;
//   overflow: hidden;
// }
</style>
