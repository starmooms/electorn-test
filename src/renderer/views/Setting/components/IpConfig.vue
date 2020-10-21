<template>
  <div>
    <el-dialog
      class="center-dialog auto-height"
      title="IP设置"
      width="500px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <div>
        <div class="action-box">
          <el-button type="primary" @click="addIp">添加IP</el-button>
        </div>
        <vxe-table
          border
          show-overflow
          ref="xTable"
          class="my_table_insert"
          max-height="400vh"
          :data="ipConfigList"
          :edit-config="{ trigger: 'click', mode: 'cell' }"
        >
          <!-- eslint-disable -->
          <vxe-table-column field="ip" title="IP" :edit-render="{name: 'input', immediate: true, attrs: {type: 'text'}}"></vxe-table-column>
          <vxe-table-column title="操作" width="160">
            <template  v-slot="row">
              <el-button type="text" @click="delIp(row.$rowIndex)">删除</el-button>
            </template>
          </vxe-table-column>
          <!-- eslint-enable -->
        </vxe-table>
      </div>
      <div slot="footer">
        <el-button type="primary">测试连接</el-button>
        <el-button @click="dialogClose">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator'
import { Table } from 'vxe-table'

@Component
export default class IpConfig extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  $refs!: {
    xTable: Table
  }

  ipConfigList = [{ ip: '192.168.1.201' }]

  @Watch('dialog')
  changeShow(v: boolean) {
    // if (v === true) {
    // }
  }

  dialogClose() {
    this.dialog = false
  }

  /** 添加新ip */
  async addIp() {
    const newItem = {
      ip: ''
    }
    this.ipConfigList.push(newItem)
    // const { row: newRow } = await this.$refs.xTable.insertAt(newItem, -1)
    await this.$refs.xTable.setActiveCell(newItem, 'ip')
  }

  /** 删除ip */
  delIp(index: number) {
    this.ipConfigList.splice(index, 1)
  }

  
}
</script>

<style lang="scss" scoped>
.action-box {
  margin-bottom: 20px;
}
</style>
