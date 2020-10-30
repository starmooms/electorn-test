<template>
  <div>
    <el-dialog
      title="IP设置"
      width="1000px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <div v-loading="loading">
        <div class="action-box">
          <el-button type="primary" @click="addMasterOpen()">
            添加机柜
          </el-button>
          <el-button type="primary" @click="refreshConnect">
            刷新并联机
          </el-button>
        </div>
        <div class="ip-table">
          <el-table
            border
            class="min-el-tabel border-el-table"
            height="300px"
            :data="list"
            :row-class-name="tableRowClassName"
          >
            <!-- eslint-disable -->
            <el-table-column prop="masterId" label="机柜号" width="60">
              <template v-slot="{ row }">
                {{ `${row.masterId + 1}` }}
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" width="120" />
            <el-table-column prop="masterInfo.mask" label="掩码" width="120" />
            <el-table-column prop="masterInfo.gateway" label="网关" width="120" />
            <el-table-column prop="masterInfo.version" label="版本号" width="80" />
            <el-table-column prop="masterInfo.machineId" label="机身号" width="140" />
            <el-table-column prop="status" label="连接状态" min-width="170">
              <template v-slot="{ row }">
                {{statusMap[row.masterInfo.status]}}
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="操作" width="120">
              <template v-slot="{ row, $index }">
                <el-button type="text" @click="detailsOpen(row)" :disabled="row.masterInfo.status !== 2">查看</el-button>
                <el-button type="text" @click="addMasterOpen(row)" :disabled="row.masterInfo.status !== 2">编辑</el-button>
                <el-button type="text" @click="delMaster(row, $index)">删除</el-button>
              </template>
            </el-table-column>
            <!-- eslint-enabel -->
          </el-table>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="dialogClose">取 消</el-button>
        <!-- <el-button @click="dialogClose">保存并重置网口连接</el-button> -->
      </div>
    </el-dialog>
    <ip-edit
      :show.sync="addMasterShow"
      :editMaster="editMaster"
      :ipList="list"
      @saveAdd="addMaster"
      @saveEdit="editIp"
    />
    <DetailsInfo :show.sync="detailsShow" :masterInfo="detailsInfo" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync } from 'vue-property-decorator'
import IpEdit from './IpEdit.vue'
import DetailsInfo from './DetailsInfo.vue'
import { setStoreConfig } from '@/renderer/ipc/storeConfig'
import { getMasterInfoObj } from '@/shared/utils'
import {
  delIpItem,
  getIpList,
  refreshIpConnect,
  setMasterInfo
} from '@/renderer/ipc/channel'

@Component({
  components: {
    IpEdit,
    DetailsInfo
  }
})
export default class IpConfig extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  ipShow = false
  addMasterShow = false
  list: IpConfigT.IpTcpItem[] = []
  editMaster: IpConfigT.IpTcpItem | null = null
  statusMap = {
    '1': '未连接',
    '2': '连接成功',
    '3': '连接失败',
    '4': '连接成功，请求未返回超时'
  }
  loading = false

  // 查看详情
  detailsShow = false
  detailsInfo: null | IpConfigT.MasterInfo = null

  addMasterOpen(item?: IpConfigT.IpTcpItem) {
    this.editMaster = item ? item : null
    console.warn(this.editMaster)
    this.addMasterShow = true
  }

  detailsOpen(row: IpConfigT.IpTcpItem) {
    this.detailsInfo = row.masterInfo
    this.detailsShow = true
  }

  getIpListFormat() {
    this.list.sort((a, b) => a.masterId - b.masterId)
    return this.list.map(item => {
      return {
        masterId: item.masterId,
        ip: item.ip
      }
    })
  }

  tableRowClassName({ row }: any) {
    return `status_${row.masterInfo.status}`
  }

  /** 获取ip列表 */
  async getIpList() {
    try {
      this.loading = true
      const data = await getIpList()
      if (data.status) {
        this.list = data.data
        console.log(this.list)
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  /** 添加新机柜 */
  async addMaster(result: TcpRequestT.IpItem) {
    this.list.push({
      ...result,
      masterInfo: getMasterInfoObj()
    })
    const data = await setStoreConfig({
      type: 'userConfig',
      key: 'ipList',
      data: this.getIpListFormat()
    })
    if (data.status) {
      this.$message.success('添加成功')
    }
  }

  /** 编辑ip */
  async editIp(form: any) {
    if (this.editMaster) {
      const result = await setMasterInfo({
        masterId: this.editMaster.masterId,
        ipOld: this.editMaster.ip,
        machineId: this.editMaster.masterInfo.machineId,
        ...form
      })
      if (result.status) {
        const masterInfo = this.editMaster.masterInfo
        masterInfo.status = result.data.status
        this.editMaster.masterInfo = {
          ...masterInfo,
          ...form
        }
        this.$message.success('编辑成功')
      }
    }
  }

  /** 删除机柜 */
  async delMaster(ipItem: IpConfigT.IpTcpItem, index: number) {
    const data = await delIpItem({
      ip: ipItem.ip,
      masterId: ipItem.masterId
    })
    if (data.status) {
      this.list.splice(index, 1)
    }
  }

  /** 刷新连接 */
  async refreshConnect() {
    try {
      this.loading = true
      const data = await refreshIpConnect()
      if (data.status) {
        this.list = data.data
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  dialogClose() {
    this.dialog = false
  }

  mounted() {
    this.getIpList()
  }
}
</script>

<style lang="scss" scoped>
.action-box {
  margin-bottom: 20px;
}
.ip-table ::v-deep {
  .el-table--enable-row-hover .el-table__body tr:hover > td {
    background-color: transparent;
  }
  .el-table__row.status_3,
  .el-table__row.status_4 {
    background-color: #ffd2d2;
  }
  .el-table__row.status_1 {
    background-color: #e4e4e4;
  }
}
</style>
