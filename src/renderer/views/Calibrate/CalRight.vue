<template>
  <div class="cal-right">
    <div class="cal-action-box">
      <div>
        <el-checkbox-group class="mode-select" v-model="calType" size="mini">
          <el-checkbox
            v-for="item in calTypeList"
            :key="item.type"
            :label="item.type"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="action-btn-box">
        <el-button type="primary">修调</el-button>
        <el-button type="primary">停止</el-button>
        <el-button type="primary">导出</el-button>
        <el-button type="primary">清除</el-button>
      </div>
    </div>

    <div>
      <vxe-grid
        border
        auto-resize
        show-overflow
        resizable
        ref="xTabel"
        :data="calDataList"
        size="mini"
        max-width="160px"
        height="240px"
      >
        <!-- eslint-disable -->
      <vxe-table-column field="time" title="修调时间" width="160"></vxe-table-column>
      <vxe-table-column field="masterId" title="机柜号" width="80">
        <template v-slot="{ row }">{{ row.masterId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="slaverId" title="从控号" width="80">
        <template v-slot="{ row }">{{ row.slaverId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="channelId" title="通道号" width="80">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calModel" title="修调模块" width="80"></vxe-table-column>
      <vxe-table-column field="calType" title="修调类型" min-width="80"></vxe-table-column>
      <vxe-table-column field="pointOne" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="pointOneActual" title="实际值" width="80"></vxe-table-column>
      <vxe-table-column field="pointOneSamp" title="采样值" width="80"></vxe-table-column>
      <vxe-table-column field="pointTwo" title="修调点" width="80"></vxe-table-column>
      <vxe-table-column field="pointTwoActual" title="实际值" width="80"></vxe-table-column>
      <vxe-table-column field="pointTwoSamp" title="采样值" width="80"></vxe-table-column>
      <vxe-table-column field="a" title="A" width="80"></vxe-table-column>
      <vxe-table-column field="b" title="B" width="80"></vxe-table-column>
      <!-- eslint-enable -->
      </vxe-grid>
    </div>

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

    <!-- <ReCheckTabel /> -->

    <div class="cal-action-box">
      <p class="title">检测结果</p>
      <div class="action-box">
        <el-button type="primary">清空</el-button>
      </div>
    </div>
    <cal-result />
  </div>
</template>
<script lang="ts">
import { CALIBRATE_TYPE } from '@/shared/config/calibrate'
import { deepClone } from '@/shared/utils'
import { Vue, Component, Watch } from 'vue-property-decorator'
// import ReCheckTabel from './ReCheckTabel.vue'
// import CalResult from './CalResult.vue'

@Component({
  components: {
    // ReCheckTabel,
    // CalResult
  }
})
export default class CalRight extends Vue {
  calType = []
  calTypeList = deepClone(CALIBRATE_TYPE)
  calDataList = []

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

  @Watch('model')
  a(v) {
    console.log(v)
  }

  mounted() {
    console.log(this.calTypeList)
  }
}
</script>

<style lang="scss" scoped>
.cal-right {
  .cal-action-box {
    display: flex;
    margin-bottom: 8px;
    margin-top: 14px;
    .mode-select {
      width: 200px;
      display: flex;
      flex-flow: row wrap;
      margin-right: 20px;
      .el-checkbox {
        flex: 0 0 50%;
        margin-right: 0;
        margin-bottom: 10px;
        &:nth-of-type(2n) {
          margin-right: 0;
        }
      }
    }

    .action-btn-box {
      display: flex;
      flex-flow: row wrap;
      width: 150px;
      .el-button {
        margin: 0;
        margin-bottom: 10px;
        &:nth-of-type(2n + 1) {
          margin-right: 20px;
        }
        &:last-child,
        &:nth-last-of-type(2) {
          margin-bottom: 0;
        }
      }
    }

    .title {
      margin: 0;
      margin-right: 20px;
    }
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
}
</style>
