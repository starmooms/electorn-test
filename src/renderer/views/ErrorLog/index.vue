<template>
  <div>
    <h4>错误日志</h4>
    <el-table
      class="err-table"
      header-row-class-name="t-header"
      :data="errorList"
      height="80vh"
      border
      style="width: 800px;"
    >
      <el-table-column
        prop="createTimeStr"
        label="创建日期"
        width="180"
      ></el-table-column>
      <el-table-column label="错误类型" width="100">
        <template slot-scope="{ row }">
          {{ row.type === 'SampError' ? '采样错误' : '串口交互错误' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="errCode"
        label="错误码"
        width="60"
      ></el-table-column>
      <el-table-column prop="errMsg" label="错误信息"></el-table-column>
      <el-table-column label="机柜号" width="60">
        <template slot-scope="{ row }">
          {{ row.masterId != null ? row.masterId + 1 : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="从控号" width="60">
        <template slot-scope="{ row }">
          {{ row.slaverId != null ? row.slaverId + 1 : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="通道号" width="60">
        <template slot-scope="{ row }">
          {{ row.channelId != null ? row.channelId + 1 : '-' }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts">
import { getErrorLog } from '@/renderer/ipc/db'
import { Vue, Component } from 'vue-property-decorator'
@Component
export default class ErrorLog extends Vue {
  errorList: any[] = []

  async getErrorList() {
    const data = await getErrorLog()
    if (data.status) {
      this.errorList = data.data
    }
  }

  mounted() {
    this.getErrorList()
  }
}
</script>

<style lang="scss" scoped>
.err-table {
  height: 80vh;
}
::v-deep {
  .t-header {
    tr,
    th {
      background: #f5f7fa;
    }
  }
}
</style>
