<template>
  <vxe-grid
    border
    auto-resize
    show-overflow
    resizable
    :data="tableData"
    size="mini"
    height="auto"
  >
    <!-- eslint-disable -->
    <vxe-table-column type="seq" title="序号" width="80"></vxe-table-column>
    <vxe-table-column field="masterId" title="主控号" width="80" ></vxe-table-column>
    <vxe-table-column field="slaverId" title="从控号" width="80" ></vxe-table-column>
    <vxe-table-column field="channelId" title="通道号" width="80" ></vxe-table-column>
    <vxe-table-column field="vol" title="容量" width="80"></vxe-table-column>
    <vxe-table-column field="epower" title="电量" width="80"></vxe-table-column>
    <vxe-table-column field="time" title="时间" width="80"></vxe-table-column>
    <vxe-table-column field="startU" title="开压" width="80"></vxe-table-column>
    <vxe-table-column field="endU" title="终压" width="80"></vxe-table-column>
    <vxe-table-column field="averageU" title="均压" width="80"></vxe-table-column>
    <vxe-table-column field="endI" title="终流" width="80"></vxe-table-column>
    <vxe-table-column field="curIRation" title="恒流比" width="80"></vxe-table-column>
    <vxe-table-column field="t1" title="T1" width="80"></vxe-table-column>
    <vxe-table-column field="c1" title="C1" width="80"></vxe-table-column>
    <vxe-table-column field="t2" title="T2" width="80"></vxe-table-column>
    <vxe-table-column field="c2" title="C2" width="80"></vxe-table-column>
    <vxe-table-column field="t3" title="T3" width="80"></vxe-table-column>
    <vxe-table-column field="c3" title="C3" width="80"></vxe-table-column>
    <vxe-table-column field="t4" title="T4" width="80"></vxe-table-column>
    <vxe-table-column field="c4" title="C4" width="80"></vxe-table-column>
    <vxe-table-column field="t5" title="T5" width="80"></vxe-table-column>
    <vxe-table-column field="c5" title="C5" width="80"></vxe-table-column>
    <!-- eslint-enable -->
  </vxe-grid>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class DetailsTabel extends Vue {
  // tableData = [
  //   {
  //     id: 10001,
  //     name: 'Test1',
  //     role: 'Develop',
  //     sex: 'Man',
  //     address: 'Shenzhen'
  //   },
  //   {
  //     id: 10002,
  //     name: 'Test2',
  //     role: 'Test',
  //     sex: 'Man',
  //     address: 'Guangzhou'
  //   },
  //   { id: 10003, name: 'Test3', role: 'PM', sex: 'Man', address: 'Shanghai' }
  // ]

  tableData = [
    {
      masterId: 0,
      slaverId: 0,
      channelId: 0,
      vol: 2.1,
      epower: 4.1,
      time: 10,
      startU: 30,
      endU: 40,
      averageU: 20,
      endI: 50,
      curIRation: 1.2,
      t1: 0,
      c1: 0,
      t2: 0,
      c2: 3,
      t3: 0,
      c3: 4,
      t4: 2,
      c4: 5,
      t5: 53,
      c5: 1
    }
  ]

  mounted() {
    const list: any = []
    const item = this.tableData[0]
    for (let i = 0; i < 5000; i++) {
      console.log(i)
      list.push({
        ...item,
        channelId: i
      })
    }
    this.$nextTick(() => {
      setTimeout(() => {
        this.tableData = list
      })
    })
  }
}
</script>
<style lang="scss" scoped></style>
