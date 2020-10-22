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
    <div v-loading="loading">
      <el-table :data="list" stripe style="width: 100%" border>
        <el-table-column prop="id" label="id" width="80"></el-table-column>
        <el-table-column
          prop="masterId"
          label="机柜"
          width="80"
        ></el-table-column>
        <el-table-column
          prop="slaverIds"
          label="丛控"
          width="80"
        ></el-table-column>
        <el-table-column
          prop="channelIds"
          label="通道"
          width="80"
        ></el-table-column>
        <el-table-column
          prop="typeStr"
          label="错误类型"
          width="200"
        ></el-table-column>
        <el-table-column prop="errCodeStr" label="错误信息"></el-table-column>
        <el-table-column
          prop="createdTime"
          label="创建时间"
          width="180"
        ></el-table-column>
      </el-table>
    </div>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Pagination from '@/renderer/components/Pagination/index.vue'
import mainDb from '@/renderer/Db/mainDb'
import { ERROR_STATUS } from '@/shared/config/port'

@Component({
  components: {
    Pagination
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
    try {
      this.loading = true
      const data = await this.db.getErrorList(this.listQuery)
      this.total = data.total
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
/* .err-table {
  height: 80vh;
} */
// ::v-deep {
//   .t-header {
//     tr,
//     th {
//       background: #f5f7fa;
//     }
//   }
// }

// .virtual-table {
//   border: 1px solid #dcdfe6;
//   .th-item {
//     display: flex;
//     align-items: center;
//     &.even {
//       background-color: #f5f7fa;
//     }
//     .th-td {
//       flex: none;
//       box-sizing: border-box;
//       padding-left: 10px;
//       border-right: 1px solid #dcdfe6;
//       border-bottom: 1px solid #dcdfe6;
//       font-size: 12px;
//       position: relative;
//       height: 32px;
//       line-height: 32px;
//       /* &:after {
//         content: '';
//         position: absolute;
//         top: 0;
//         right: 0;
//         width: 1px;
//         height: 100%;
//         background: #dcdfe6;
//       } */
//       &:last-child {
//         border-right: none;
//       }

//       .td-text {
//         line-height: 1.2;
//         width: 100%;
//         word-wrap: break-word;
//         word-break: break-all;
//       }
//     }
//   }

//   .th-head {
//     .th-item {
//       padding-right: 8px;
//     }
//   }

//   .th-body {
//     height: 80vh;
//   }
// }

// .err-table {
//   .th-item {
//     .td-date {
//       width: 160px;
//     }
//     .td-err-type {
//       flex-basis: 80px;
//     }
//     .td-err-code,
//     .td-id {
//       flex-basis: 80px;
//     }
//     .td-err-msg {
//       flex: auto;
//     }
//     .td-action {
//       width: 160px;
//     }
//   }
// }
</style>
