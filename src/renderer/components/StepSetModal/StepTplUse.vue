<template>
  <el-dialog
    title="工步模板"
    :close-on-click-modal="false"
    :visible.sync="dialog"
    width="600px"
  >
    <el-table :data="list" border height="30vh">
      <el-table-column label="模板名称" prop="name">
        <template slot-scope="{ row }">
          <div class="name-box">
            <template v-if="row.edit">
              <el-input class="edit-input" v-model.trim="row.name" />
              <el-button
                class="cancel-btn"
                type="warning"
                @click="cancelEdit(row)"
              >
                取消
              </el-button>
            </template>
            <span v-else>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240px">
        <template slot-scope="{ row, $index }">
          <el-button v-if="row.edit" type="success" @click="saveEdit(row)">
            确定
          </el-button>
          <el-button v-else type="primary" @click="row.edit = true">
            模板名称
          </el-button>
          <el-button type="success" @click="stepsTplUse(row)">
            应用
          </el-button>
          <el-button type="danger" @click="delTpl(row, $index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div slot="footer">
      <el-button @click="closeModal">取 消</el-button>
    </div>
  </el-dialog>
</template>
<script lang="ts">
import { Vue, Component, PropSync, Emit, Watch } from 'vue-property-decorator'
import {
  getStoreConfig,
  delStoreConfig,
  setStoreConfig
} from '@/renderer/ipc/storeConfig'
import { typedKeys } from '@/shared/utils'

@Component
export default class StepTplUse extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  list: any = []

  @Emit('tplUse')
  stepsTplUse(item: any) {
    this.closeModal()
    return item.tplData
  }

  async getList() {
    const data = await getStoreConfig({
      type: 'workStepTpl',
      key: 'tplList'
    })
    if (data.status) {
      const listMap = data.data
      this.list = typedKeys(listMap).map(key => {
        const item = listMap[key]
        return {
          ...item,
          edit: false,
          originName: item.name
        }
      })
    }
  }

  @Watch('dialog')
  changeDialog(v: boolean) {
    if (v) {
      this.getList()
    }
  }

  async delTpl(item: any, index: number) {
    const data = await delStoreConfig({
      type: 'workStepTpl',
      data: {
        id: item.id
      }
    })
    if (data.status) {
      this.list.splice(index, 1)
    }
  }

  cancelEdit(item: any) {
    item.name = item.originName
    item.edit = false
  }

  async saveEdit(item: any) {
    const name = item.name
    if (!name) {
      return this.$message.info('模板名称不能为空')
    }
    const data = await setStoreConfig({
      type: 'workStepTpl',
      data: {
        id: item.id,
        name
      }
    })
    if (data.status) {
      item.originName = name
      this.$message.success('修改成功')
      item.edit = false
    }
  }

  closeModal() {
    this.dialog = false
  }
}
</script>
<style lang="scss" scoped>
.name-box {
  display: flex;
  .edit-input {
    margin-right: 14px;
  }
}
</style>
