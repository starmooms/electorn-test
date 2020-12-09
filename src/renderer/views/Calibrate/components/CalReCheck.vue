<template>
  <div class="recheck">
    <div class="cal-action-box">
      <p class="title">复检</p>
      <el-form class="step-leng" label-width="80px" ref="stepForm">
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
          <el-button type="primary" @click="start">复检</el-button>
          <el-button type="primary" @click="stop">停止</el-button>
          <el-button type="primary">导出</el-button>
          <el-button type="primary" @click="clean">清除</el-button>
        </div>
      </div>
    </div>

    <vxe-grid
      border
      auto-resize
      show-overflow
      resizable
      ref="xTabel"
      :data="recheckResult"
      size="mini"
      max-width="160px"
      height="240px"
      class="recheck-table"
    >
      <!-- eslint-disable -->
      <vxe-table-column field="time" title="复检时间" width="135"></vxe-table-column>
      <vxe-table-column title="机柜号" width="60">
        <template v-slot="{ row }">{{ row.masterId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column title="从控号" width="60">
        <template v-slot="{ row }">{{ row.slaverId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column title="通道号" width="60">
        <template v-slot="{ row }">{{ row.channelId+1 }}</template>
      </vxe-table-column>
      <vxe-table-column field="calTypeName" title="复检类型" width="80"></vxe-table-column>
      <vxe-table-column field="pointName" title="复检点" width="80"></vxe-table-column>
      <vxe-table-column field="actual" title="实际值" width="90"></vxe-table-column>
      <vxe-table-column field="samp" title="采样值" width="90"></vxe-table-column>
      <vxe-table-column field="diff" title="误差值" width="80"></vxe-table-column>
      <vxe-table-column field="status" title="测试结果" min-width="80">
        <template v-slot="{ row }">
          <svg-icon v-if="row.status" class="status-icon success" icon-class="success"></svg-icon>
          <svg-icon v-else class="status-icon error" icon-class="cal-error"></svg-icon>
        </template>
      </vxe-table-column>
      <!-- eslint-enable -->
    </vxe-grid>
  </div>
</template>
<script lang="ts">
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class CalReCheck extends Vue {
  @Prop({ type: Array, required: true }) recheckResult!: any

  reCheckForm: CalibrateTR.RecheckForm = {
    IStep: null,
    IStart: null,
    IEnd: null,
    UStep: null,
    UStart: null,
    UEnd: null
  }
  IStepOpts = [200]
  UStepOpts = [500]

  get config() {
    return SettingStatus.userConfig?.calibrateConfig?.recheckForm
  }

  async start() {
    ;['IStart', 'IEnd', 'UStart', 'UEnd'].forEach(key => {
      const num = Number(this.reCheckForm[key])
      this.reCheckForm[key] = isNaN(num) ? null : num
    })
    const form = this.reCheckForm
    if (form.IStep === null) {
      return this.$message.error('请选择电流歩长')
    } else if (form.IStart === null) {
      return this.$message.error('请填写电流复检范围起始')
    } else if (form.IEnd === null) {
      return this.$message.error('请填写电流复检范围结束')
    } else if (form.IStart >= form.IEnd) {
      return this.$message.error('请填写电流复检范围起始应小于结束')
    } else if (form.UStep === null) {
      return this.$message.error('请选择电压歩长')
    } else if (form.UStart === null) {
      return this.$message.error('请填写电压复检范围起始')
    } else if (form.UEnd === null) {
      return this.$message.error('请填写电压复检范围结束')
    } else if (form.UStart >= form.UEnd) {
      return this.$message.error('请填写电压复检范围起始应小于结束')
    }
    this.$emit('start', form)
    return form as CalibrateTR.RecheckSumbitForm
    // this.$emit('start')
  }

  stop() {
    this.$emit('stop')
  }

  clean() {
    this.$emit('clean')
  }

  mounted() {
    if (this.config) {
      this.reCheckForm = {
        ...this.reCheckForm,
        ...this.config
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.recheck {
  .step-leng {
    margin: 0 20px;

    .recheck-form-item {
      display: flex;
      width: 450px;
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
          margin: 0 10px;
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

  .recheck-table {

  }
}
</style>
