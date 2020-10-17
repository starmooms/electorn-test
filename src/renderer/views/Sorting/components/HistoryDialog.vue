<template>
  <div>
    <el-dialog
      class="center-dialog auto-height"
      title="选择历史数据"
      width="1000px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <div class="history-container">
        <el-form :inline="true">
          <el-form-item label="启动时间" class="filter-box">
            <el-date-picker
              v-model="filterDate"
              type="daterange"
              start-placeholder="大于等于"
              end-placeholder="小于"
            ></el-date-picker>
          </el-form-item>
          <el-form-item label="启动ID">
            <el-input
              placeholder="启动ID输入"
              @keyup.enter.native="onSearch"
              v-model="filterFileId"
            ></el-input>
          </el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form>
        <el-table
          v-loading="loading"
          ref="historyTabel"
          :data="list"
          stripe
          style="width: 100%"
          height="52vh"
          border
        >
          <!-- eslint-disable -->
            <el-table-column label="序号" width="80">
              <template slot-scope="{row}">
                <div>
                  <el-checkbox :value="row.id === projectId" :label="row.id" @change="setHistory(row)"></el-checkbox>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="fileId" label="启动ID" width="160" show-overflow-tooltip></el-table-column>
            <el-table-column prop="masterIdShowStr" label="机柜号" width="80" show-overflow-tooltip></el-table-column>
            <el-table-column prop="slaverIdShowStr" label="丛控号" width="80" show-overflow-tooltip></el-table-column>
            <el-table-column prop="channelIdShowStr" label="通道号" width="80" show-overflow-tooltip></el-table-column>
            <el-table-column prop="startTime" label="启动时间" width="140"></el-table-column>
            <el-table-column prop="endTime" label="结束时间" width="140"></el-table-column>
            <el-table-column prop="filePath" label="文件路径" show-overflow-tooltip></el-table-column>
            <!-- eslint-enable -->
        </el-table>

        <pagination
          class="history-page"
          ref="Pagination"
          v-show="total > 0"
          :total="total"
          :page.sync="listQuery.page"
          :limit.sync="listQuery.limit"
          @pagination="getList"
        />
      </div>
      <div slot="footer">
        <el-button @click="dialogClose">取 消</el-button>
        <el-button type="primary" @click="dialogSubmit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator'
import Pagination from '@/renderer/components/Pagination/index.vue'
import mainDb from '@/renderer/Db/mainDb'
import { dateFormat, idListFormat } from '@/renderer/utils/util'
import dayjs from 'dayjs'

@Component({
  components: {
    Pagination
  }
})
export default class HistoryDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  $refs!: {
    Pagination: Pagination
    historyTabel: any
  }

  total = 200
  listQuery = {
    page: 1,
    limit: 20
  }
  db!: mainDb
  list: Db.RHistoryItem[] = []
  loading = false

  filterDate: Date[] = []
  filterFileId = ''

  /** */
  selectHistory: Db.RHistoryItem | null = null

  /** 获取工程id */
  get projectId() {
    return this.selectHistory ? this.selectHistory.id : null
  }

  /** 打开弹框时 */
  @Watch('dialog')
  changeDialog(v) {
    if (v === true) {
      this.selectHistory = null
      this.setDom()
    }
  }

  dialogClose() {
    this.dialog = false
  }

  /** 保存已选 */
  dialogSubmit() {
    this.$emit('save', this.selectHistory)
    this.dialogClose()
  }

  /** 创建数据库 */
  async createDb() {
    this.db = new mainDb()
    await this.db.connect()
  }

  /** 关闭数据库 */
  async closeDb() {
    if (this.db) {
      await this.db.close()
    }
  }

  /** 获取请求参数 */
  getParams() {
    let startTime = 0
    let endTime = 0
    if (this.filterDate && this.filterDate.length >= 2) {
      ;[startTime, endTime] = this.filterDate.map(item => {
        return dayjs(item).valueOf()
      })
    }
    return {
      startTime,
      endTime,
      fileId: this.filterFileId,
      ...this.listQuery
    }
  }

  /** 请求列表 */
  async getList() {
    try {
      this.loading = true
      const data = await this.db.getHistoryList(this.getParams())
      this.total = data.total
      this.list = data.list.map(item => {
        item.startTime = dateFormat(item.startTime)
        item.endTime = dateFormat(item.endTime)
        ;['masterId', 'slaverId', 'channelId'].forEach(idKey => {
          const idResult = idListFormat(item[`${idKey}s`])
          item[`${idKey}Arr`] = idResult.idArr
          item[`${idKey}ShowStr`] = idResult.idShowArr
        })
        return item
      })
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  /** 设置分页切换时滚动的dom */
  setDom() {
    this.$nextTick(() => {
      this.$refs.Pagination.setScrollDom(
        this.$refs.historyTabel.$el.querySelector('.el-table__body-wrapper')
      )
    })
  }

  /** 选择/取消选择 历史 */
  setHistory(row: Db.RHistoryItem) {
    this.selectHistory = this.projectId === row.id ? null : row
  }

  onSearch() {
    this.listQuery.page = 1
    this.getList()
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
.filter-box {
  margin-bottom: 20px;
}
.history-page {
  padding: 0;
  margin-top: 20px;
}
// .history-container {
//   display: flex;
//   flex-flow: column;
//   overflow: hidden;
// }
</style>
