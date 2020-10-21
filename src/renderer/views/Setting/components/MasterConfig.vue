<template>
  <div>
    <el-dialog
      title="主控设置"
      width="1000px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <div>
        <div class="action-box">
          <el-button type="primary" @click="addMasterOpen()">
            添加机柜
          </el-button>
        </div>
        <div class="table">
          <el-table
            border
            class="min-el-tabel border-el-table"
            height="300px"
            :data="list"
          >
            <!-- <el-table-column type="index" label="序号" width="60" /> -->
            <!-- eslint-disable -->
            <el-table-column prop="masterId" label="机柜号" width="60">
              <template v-slot="{ row }">
                {{ `${row.masterId + 1}` }}
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" width="160" />
            <el-table-column prop="ip" label="操作" width="160">
              <template v-slot="{ row,$index }">
                <el-button type="text" @click="addMasterOpen(row)">编辑</el-button>
                <el-button type="text" @click="delMaster(row, $index)">删除</el-button>
              </template>
            </el-table-column>
            <!-- eslint-enabel -->
          </el-table>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="dialogClose">取 消</el-button>
      </div>
    </el-dialog>
    <add-master-dialog
      :show.sync="addMasterShow"
      :editMaster="editMaster"
      :ipList="list"
      @saveAdd="addMaster"
      @saveEdit="addMaster"
    />
  </div>
</template>

<script lang="ts">
import logger from '@/main/core/Logger'
import { delIpItem, getIpList } from '@/renderer/ipc/channel'
import { setStoreConfig } from '@/renderer/ipc/storeConfig'
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator'
import AddMasterDialog from './AddMasterDialog.vue'

@Component({
  components: {
    AddMasterDialog
  }
})
export default class MasterConfig extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  ipShow = false
  addMasterShow = false
  list: TcpRequestT.IpItem[] = []
  editMaster: TcpRequestT.IpItem | null = null

  addMasterOpen(item?: TcpRequestT.IpItem) {
    this.editMaster = item ? item : null
    this.addMasterShow = true
  }

  getIpListFormat() {
    return this.list.map(item => {
      return {
        masterId: item.masterId,
        ip: item.ip
      }
    })
  }

  /** 获取ip列表 */
  async getIpList() {
    const data = await getIpList()
    if (data.status) {
      this.list = data.data
    }
  }

  /** 添加新机柜 */
  async addMaster(result: TcpRequestT.IpItem) {
    this.list.push({
      ...result
    })
    const data = await setStoreConfig({
      type: 'userConfig',
      key: 'base.ipList',
      data: this.getIpListFormat()
    })
    if (data.status) {
      this.$message.success('添加成功')
    }
  }

  /** 删除机柜 */
  async delMaster(ipItem: TcpRequestT.IpItem, index: number) {
    const data = await delIpItem({
      ip: ipItem.ip,
      masterId: ipItem.masterId
    })
    if (data.status) {
      this.list.splice(index, 1)
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
