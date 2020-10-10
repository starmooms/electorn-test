<template>
  <el-dialog
    class="center-dialog"
    title="分选条件"
    width="800px"
    :visible.sync="dialog"
    :close-on-click-modal="false"
  >
    <span>这是一段信息</span>
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
        <div class="action-box"></div>
        <div class="tabel-box">
          <vxe-grid
            ref="xTable"
            border
            auto-resize
            show-overflow
            resizable
            :data="tableData"
            size="mini"
            height="600px"
            width="100%"
          >
            <!-- eslint-disable -->
            <vxe-table-column type="seq" title="序号" width="80"></vxe-table-column>
            <vxe-table-column v-for="config in tableColumn" :key="config.id" v-bind="config" ></vxe-table-column>
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
        <el-button @click="dialogClose" type="primary">载入代码</el-button>
        <el-button type="primary">
          保存代码
        </el-button>
      </div>
      <div class="f-r">
        <el-button @click="dialogClose">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">
          保存
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator'
import { Table } from 'vxe-table'

@Component
export default class LevelDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  $refs!: {
    xTable: Table
  }

  attrList: string[] = []
  attrAllList = [
    { label: '容量', value: 'vol' },
    { label: '时间', value: 'time' },
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

  get tableAttrList() {
    return this.attrAllList.filter(item => {
      return this.attrList.includes(item.value)
    })
  }

  tableColumn: any[] = []

  @Watch('tableAttrList')
  c(v) {
    const list: any[] = []
    this.tableAttrList.forEach(item => {
      list.push(
        {
          id: `${item.value}_min`,
          title: `${item.label}>=`,
          width: '80px'
        },
        {
          id: `${item.value}_max`,
          title: `${item.label}<`,
          width: '80px'
        }
      )
    })
    this.tableColumn = list
    this.$nextTick(() => {
      this.$refs.xTable.refreshColumn()
    })
  }

  tableData = []

  dialogClose() {
    this.dialog = false
  }

  dialogSave() {
    this.dialog = true
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
    // width: 408px;
    // .tabel-box {
    //   width: 200px;
    // }
  }
}
</style>
