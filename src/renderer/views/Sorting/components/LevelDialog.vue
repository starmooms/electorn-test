<template>
  <el-dialog
    class="center-dialog"
    title="分选条件"
    width="800px"
    :visible.sync="dialog"
    :close-on-click-modal="false"
  >
    <div class="level-main">
      <div class="main-l">
        <el-checkbox-group v-model="attrList">
          <el-checkbox
            class="level-check"
            v-for="item in attrAllList"
            :key="item.value"
            :label="item.value"
            :class="{ feature: item.style === 't' }"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="main-r">
        <div class="action-box">
          <el-button @click="addLevel" type="primary">添加等级</el-button>
        </div>
        <div class="tabel-box">
          <vxe-grid
            ref="xTable"
            border
            auto-resize
            show-overflow
            resizable
            :data="tableData"
            size="mini"
            height="400px"
            width="100%"
            :edit-config="{
              trigger: 'dblclick',
              mode: 'row',
              showIcon: false
            }"
          >
            <!-- eslint-disable -->
            <vxe-table-column type="seq" title="等级名" width="80"></vxe-table-column>
            <vxe-table-column v-for="config in tableColumn" :key="config.field" v-bind="config" ></vxe-table-column>
            <vxe-table-column field="desc" title="等级描述" width="100" :edit-render="{ name: 'input', immediate: true, attrs: { type: 'text' }}"></vxe-table-column>
            <vxe-table-column title="操作" width="80" show-overflow>
              <template v-slot="{ $rowIndex }">
                <vxe-button type="text" status="primary" @click="removeRow($rowIndex)">删除</vxe-button>
              </template>
            </vxe-table-column>
            <!-- <div v-for="item in tableAttrList" :key="item.value">
              <vxe-table-column type="b" :title="`${item.label}<`" width="80" ></vxe-table-column>
            </div> -->
            <!-- eslint-enable -->
          </vxe-grid>
        </div>
      </div>
    </div>

    <div class="dialog-footer" slot="footer">
      <div class="f-l">
        <!-- <el-button @click="dialogClose" type="primary">载入代码</el-button>
        <el-button type="primary">
          保存代码
        </el-button> -->
      </div>
      <div class="f-r">
        <el-button @click="dialogClose">取 消</el-button>
        <el-button type="primary" @click="dialogSave">
          保存
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { setStoreConfig } from '@/renderer/ipc/storeConfig'
import { deepClone } from '@/shared/utils'
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'
import { Table } from 'vxe-table'

@Component
export default class LevelDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean
  /** 当前实际的等级列表 */
  @Prop({
    type: Array,
    default() {
      return []
    }
  })
  levelList!: StoreT.LevelItem[]
  @Prop({
    type: Array,
    default() {
      return []
    }
  })
  levelAttr!: string[]

  $refs!: {
    xTable: Table
  }

  attrList: string[] = []
  attrAllList = [
    { label: '容量', value: 'vol' },
    { label: '时间', value: 'stepTime' },
    { label: '电量', value: 'epower' },
    { label: '开压', value: 'startU' },
    { label: '终压', value: 'endU' },
    { label: '均压', value: 'avgU' },
    { label: '终流', value: 'endI' },
    { label: '恒流比', value: 'curIRate' },
    { label: 'T1', value: 't1', style: 't' },
    { label: 'C1', value: 'c1', style: 't' },
    { label: 'T2', value: 't2', style: 't' },
    { label: 'C2', value: 'c2', style: 't' },
    { label: 'T3', value: 't3', style: 't' },
    { label: 'C3', value: 'c3', style: 't' },
    { label: 'T4', value: 't4', style: 't' },
    { label: 'C4', value: 'c4', style: 't' },
    { label: 'T5', value: 't5', style: 't' },
    { label: 'C5', value: 'c5', style: 't' }
  ]
  tableColumn: any[] = []
  tableData: StoreT.LevelItem[] = []

  scrollEndTimer: any = null

  get tableAttrList() {
    return this.attrAllList.filter(item => {
      return this.attrList.includes(item.value)
    })
  }

  @Watch('tableAttrList')
  changeColumn() {
    const list: any[] = []
    const commmonData = {
      width: '80px',
      'edit-render': {
        name: 'input',
        immediate: true,
        controls: false,
        attrs: { type: 'float' }
      }
    }
    this.tableAttrList.forEach(item => {
      list.push(
        {
          title: `${item.label}>=`,
          field: `${item.value}_min`,
          ...commmonData
        },
        {
          title: `${item.label}<`,
          field: `${item.value}_max`,
          ...commmonData
        }
      )
    })
    this.tableColumn = list
    this.$nextTick(() => {
      this.$refs.xTable.refreshColumn()
    })
  }

  @Watch('dialog')
  changeDialog(v) {
    if (v === true) {
      this.createTabel()
      if (this.tableData.length === 0) {
        this.addLevel()
        this.addLevel()
        this.addLevel()
      }
    }
  }

  /** 表格滚动到最后一行 */
  scrollEnd() {
    this.$nextTick(() => {
      clearTimeout(this.scrollEndTimer)
      this.scrollEndTimer = setTimeout(() => {
        this.$refs.xTable.scrollToRow(this.tableData[this.tableData.length - 1])
      })
    })
  }

  /** 根据levelList生成tabel */
  createTabel() {
    this.attrList = deepClone(this.levelAttr)

    // 补充缺少的属性
    const noAttr = this.attrAllList.filter(item => {
      return !this.attrList.includes(item.value)
    })
    const noAttrData: any = {}
    noAttr.forEach(item => {
      noAttrData[`${item.value}_min`] = null
      noAttrData[`${item.value}_max`] = null
    })

    this.tableData = this.levelList.map(item => {
      return {
        ...deepClone(item),
        ...noAttrData
      }
    })
  }

  /** 添加一条等级 */
  async addLevel() {
    const obj: any = {}
    this.attrAllList.forEach(item => {
      obj[`${item.value}_min`] = null
      obj[`${item.value}_max`] = null
    })
    const len = this.tableData.length + 1
    this.tableData.push({
      desc: `等级${len}`,
      ...obj
    })
    this.scrollEnd()
  }

  removeRow(index: number) {
    this.tableData.splice(index, 1)
  }

  levelFormat() {
    return this.tableData.map((item, index) => {
      const attrData = {}
      this.attrList.forEach(attr => {
        ;['_min', '_max'].forEach(keyB => {
          const key = `${attr}${keyB}`
          if (item[key] !== null && item[key] !== '') {
            const data = Number(item[key])
            item[key] = isNaN(data) ? null : data
          }
          attrData[key] = item[key]
        })
      })
      const data = {
        id: index + 1,
        desc: item.desc,
        ...attrData
      }
      return data
    })
  }

  dialogClose() {
    this.dialog = false
  }

  async dialogSave() {
    const data = await setStoreConfig({
      type: 'sorting',
      key: '',
      data: {
        levelAttr: this.attrList,
        levelList: this.levelFormat()
      }
    })
    if (data.status) {
      this.$emit('changeConfig')
      this.dialog = false
    }
  }
}
</script>
<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: space-between;
}

.level-main {
  display: flex;

  .main-l {
    flex: 0 0 150px;

    .level-check {
      display: block;

      &.feature {
        display: inline-block;
      }
    }
  }

  .main-r {
    flex: 1 1 auto;
    overflow: auto;

    .action-box {
      margin-bottom: 10px;
    }
    // width: 408px;
    // .tabel-box {
    //   width: 200px;
    // }
  }
}
</style>
