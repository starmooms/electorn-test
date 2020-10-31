<template>
  <div class="recheck">
    <div class="cal-action-box">
      <p class="title">复检</p>
      <el-form class="step-leng" label-width="80px">
        <div class="recheck-form-item">
          <el-form-item class="step-item" label="电流步长">
            <el-select v-model="reCheckForm.IStep" placeholder="请选择">
              <el-option
                v-for="item in IStepOpts"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="复检范围">
            <div class="range-item">
              <el-input v-model="reCheckForm.IStart"></el-input>
              <span class="unit">A</span>
              <span class="line">——</span>
              <el-input v-model="reCheckForm.IEnd"></el-input>
              <span class="unit">A</span>
            </div>
          </el-form-item>
        </div>

        <div class="recheck-form-item">
          <el-form-item class="step-item" label="电压步长">
            <el-select v-model="reCheckForm.UStep" placeholder="请选择">
              <el-option
                v-for="item in UStepOpts"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="复检范围">
            <div class="range-item">
              <el-input v-model="reCheckForm.UStart"></el-input>
              <span class="unit">V</span>
              <span class="line">——</span>
              <el-input v-model="reCheckForm.UEnd"></el-input>
              <span class="unit">V</span>
            </div>
          </el-form-item>
        </div>
      </el-form>
      <div>
        <div class="action-btn-box">
          <el-button type="primary">复检</el-button>
          <el-button type="primary">停止</el-button>
          <el-button type="primary">导出</el-button>
          <el-button type="primary">清除</el-button>
        </div>
      </div>
    </div>

    <vxe-grid
      border
      auto-resize
      show-overflow
      resizable
      ref="xTabel"
      :data="reCheckList"
      size="mini"
      max-width="160px"
      height="240px"
    >
      <!-- eslint-disable -->
      <vxe-table-column field="time" title="复检时间" width="160"></vxe-table-column>
      <vxe-table-column field="masterId" title="机柜号" width="80">
        <template v-slot="{ row }">{{ row.masterId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="slaverId" title="从控号" width="80">
        <template v-slot="{ row }">{{ row.slaverId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="channelId" title="通道号" width="80">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calModel" title="复检模块" width="80"></vxe-table-column>
      <vxe-table-column field="calType" title="复检类型" min-width="80"></vxe-table-column>
      <vxe-table-column field="point" title="复检点" width="80"></vxe-table-column>
      <vxe-table-column field="actual" title="实际值" width="80"></vxe-table-column>
      <vxe-table-column field="samp" title="采样值" width="80"></vxe-table-column>
      <vxe-table-column field="diff" title="误差值" width="80"></vxe-table-column>
      <vxe-table-column field="result" title="测试结果" width="80"></vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class CalReCheck extends Vue {
  reCheckForm = {
    IStep: null,
    IStart: null,
    IEnd: null,
    UStep: null,
    UStart: null,
    UEnd: null
  }
  IStepOpts = [200]
  UStepOpts = [200]

  reCheckList = [
    {
      time: '01:01:01',
      masterId: 0,
      slaverId: 0,
      channelId: 0,
      calModel: '333',
      calType: '充电电流',
      point: '1v',
      actual: 0.1,
      samp: 0.2,
      diff: 2,
      result: ''
    }
  ]
}
</script>

<style lang="scss" scoped>
.recheck {
  .step-leng {
    margin: 0 20px;
    .recheck-form-item {
      width: 450px;
      display: flex;
      margin-bottom: 10px;
      ::v-deep .el-input__inner {
        padding: 0 6px;
      }
      .step-item {
        margin-right: 16px;
      }
      .range-item {
        display: flex;
        .el-input {
          width: 52px;
        }
        .unit {
          margin: 0 4px;
        }
        .line {
          margin: 0px 10px;
        }
      }
    }
    .el-form-item {
      margin-bottom: 0;
      // &:nth-last-child(1) {
      //   margin-bottom: 0;
      // }
    }
  }
}
</style>
