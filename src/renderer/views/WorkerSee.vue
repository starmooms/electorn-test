<template>
  <div class="home">
    <el-divider content-position="left">串口</el-divider>

    <el-divider content-position="left">操作</el-divider>
    <el-button>开始</el-button>
    <el-button>暂停</el-button>
    <el-button>继续</el-button>
    <el-button>关闭</el-button>

    <el-divider content-position="left">当前工步</el-divider>
    <el-table border max-height="40vh" :data="nowStepList">
      <el-table-column label="工步信息" prop="msg"></el-table-column>
      <el-table-column label="工步限制条件" prop="limt"></el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class WorkerSee extends Vue {
  // 2
  nowStepDialog = false
  nowStepList = [
    {
      msg: '1.恒流充电：1000mA',
      limt: '12600mV'
    },
    {
      msg: '2.恒压充电：12600mV',
      limt: '30mA'
    },
    {
      msg: '3.静置10Min',
      limt: ''
    }
  ]

  nowStepShow() {
    this.nowStepDialog = true
  }
}
</script>

<style lang="scss">
.stepsAdd-dialog {
  min-width: 900px;
}
</style>
