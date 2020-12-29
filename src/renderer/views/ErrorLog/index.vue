<template>
  <div>
    <h4>错误日志</h4>
    <el-button
      class="refresh-btn"
      type="primary"
      icon="el-icon-refresh"
      @click="getList"
    >
      刷新
    </el-button>
    <el-button class="refresh-btn" type="primary" @click="deleteOpen">
      批量删除
    </el-button>
    <div v-loading="loading">
      <el-table :data="list" stripe style="width: 100%;" border>
        <!-- eslint-disable -->
        <el-table-column prop="id" label="id" width="80"></el-table-column>
        <el-table-column prop="masterId" label="机柜" width="46"></el-table-column>
        <el-table-column prop="slaverIds" label="丛控" width="46"></el-table-column>
        <el-table-column prop="channelIds" label="通道" width="46"></el-table-column>
        <el-table-column prop="typeStr" label="错误类型" width="140"></el-table-column>
        <el-table-column prop="action" label="控制命令" width="200" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="errCodeStr" label="错误信息" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="80">
          <template v-slot="{row}">
            <el-button
              class="delete-btn"
              type="text"
              @click.native.prevent="deleteLog({id: row.id})">
              删除
            </el-button>
          </template>
        </el-table-column>
        <!-- eslint-enable -->
      </el-table>
    </div>

    <Pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <DeleteDialog :show.sync="deleteShow" @delete="deleteLog" />
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Pagination from '@/renderer/components/Pagination/index.vue'
import DeleteDialog from './components/DeleteDialog.vue'
import mainDb from '@/renderer/Db/mainDb'
import { ERROR_STATUS } from '@/shared/config/port'

@Component({
  components: {
    Pagination,
    DeleteDialog
  }
})
export default class ErrorLog extends Vue {
  errorList: any[] = []
  total = 200
  listQuery = {
    page: 1,
    limit: 20
  }
  db!: mainDb
  list: Db.RErrorItem[] = []
  loading = false

  deleteShow = false

  deleteOpen() {
    this.deleteShow = true
  }

  async createDb() {
    this.db = new mainDb()
    await this.db.connect()
  }

  setId(data: Db.ErrorItem, key: string) {
    if (typeof data[key] === 'string') {
      data[key] = data[key]
        .split(',')
        .map(id => {
          return Number(id) + 1
        })
        .join(',')
    }
  }

  async getList() {
    if (this.loading) return
    try {
      this.loading = true
      const data = await this.db.getErrorList(this.listQuery)
      this.total = data.total
      this.listQuery.page = data.page
      this.list = data.list.map(item => {
        item.masterId = Number(item.masterId) + 1
        this.setId(item, 'slaverIds')
        this.setId(item, 'channelIds')
        return {
          ...item,
          typeStr: item.type === 1 ? '通讯错误' : '实时数据错误列表',
          errCodeStr: ERROR_STATUS[item.errCode]
        }
      })
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

  async deleteLog(params: DbErrorT.DeleteParams) {
    try {
      if (!this.db) {
        return this.$message.error('数据库未初始化连接')
      }
      let msg = '确定删除'
      if (params.startTime && params.endTime) {
        msg += `创建日期 </br> ${params.startTime} - ${params.endTime} </br> 的错误记录？`
      } else if (params.id !== void 0) {
        msg += ` id=${params.id} 的错误记录？`
      }
      const status = await this.$elConfirm(msg, {
        type: 'info',
        dangerouslyUseHTMLString: true
      })
      if (!status) return

      await this.db.deleteErrorLog(params)
      this.$message.success('删除成功')
      this.getList()
    } catch (err) {
      console.error(err)
      this.$message.error(err.message)
    }
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
.refresh-btn {
  margin-bottom: 10px;
}

.delete-btn {
  padding: 0;
}
</style>
