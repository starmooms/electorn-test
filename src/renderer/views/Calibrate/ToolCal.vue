<template>
  <div class="tool-cal">
    <el-form :inline="true" :model="form" class="demo-form-inline">
      <el-form-item label="校准类型">
        <el-select v-model="form.calType" placeholder="请选择校准类型">
          <el-option
            v-for="item in calTypeList"
            :key="item.type"
            :value="item.type"
            :label="item.label"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="校准范围" v-show="selectRangeType">
        <el-select
          v-if="selectRangeType === 'A'"
          v-model="form.iRange"
          placeholder="请选择电流范围"
        >
          <el-option
            v-for="item in iRangeList"
            :key="item.id"
            :value="item.id"
            :label="item.label"
          ></el-option>
        </el-select>
        <el-select
          v-if="selectRangeType === 'V'"
          v-model="form.uRange"
          placeholder="请选择电压范围"
        >
          <el-option
            v-for="item in uRangeList"
            :key="item.id"
            :value="item.id"
            :label="item.label"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div>
      <el-button type="primary" @click="start">开始校准</el-button>
    </div>
    <ToolCalTabel ref="toolCalTabel" />
  </div>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import {
  CALIBRATE_TYPE,
  I_TOOL_RANGE_OPTS,
  U_TOOL_RANGE_OPTS
} from '@/shared/config/calibrate'
import CalTypeSelect from './components/CalTypeSelect.vue'
import ToolCalTabel from './components/ToolCalTabel.vue'
import { deepClone } from '@/shared/utils'

@Component({
  components: {
    CalTypeSelect,
    ToolCalTabel
  }
})
export default class ToolCal extends Vue {
  $refs!: {
    toolCalTabel: ToolCalTabel
  }

  form = {
    calType: null as null | string,
    iRange: null,
    uRange: null
  }
  claType = []
  calTypeList = deepClone(CALIBRATE_TYPE)
  uRangeList = deepClone(U_TOOL_RANGE_OPTS)
  iRangeList = deepClone(I_TOOL_RANGE_OPTS)

  get selectType() {
    return this.form.calType
      ? this.calTypeList.find(item => item.type === this.form.calType)
      : null
  }

  get selectRangeType() {
    return this.selectType ? this.selectType.rangeType : null
  }

  @Watch('form', { deep: true })
  a(v) {
    console.log(v)
  }

  start() {
    if (!this.selectType || !this.selectRangeType) {
      return this.$message.error('请选选择校准类型')
    }

    const rangeType = this.selectRangeType
    const key = rangeType === 'A' ? 'i' : 'u'
    const name = rangeType === 'A' ? '电流' : '电压'
    const rangeId = this.form[`${key}Range`] as number
    if (rangeId === null) {
      return this.$message.error(`未选择${name}范围`)
    }
    const rangeItem = this[`${key}RangeList`].find(item => item.id === rangeId)
    if (!rangeItem) {
      return this.$message.error(`rangeId ${rangeId} undefined`)
    }
    this.$refs.toolCalTabel.createCal({
      selectType: this.selectType,
      selectRange: rangeItem
    })
  }

  // mounted() {}
}
</script>
<style lang="scss" scoped>
.action-btn-box {
  display: inline-block;
}
</style>
