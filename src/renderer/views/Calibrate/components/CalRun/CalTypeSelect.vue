<template>
  <el-checkbox-group
    class="type-select"
    v-model="selectType"
    @change="changeType"
    size="mini"
  >
    <el-checkbox
      v-for="item in calTypeList"
      :key="item.type"
      :label="item.type"
    >
      {{ item.label }}
    </el-checkbox>
  </el-checkbox-group>
</template>
<script lang="ts">
import { Vue, Component, Model, Watch } from 'vue-property-decorator'
import { deepClone } from '@/shared/utils'
import { CALIBRATE_TYPE } from '@/shared/config/calibrate'

@Component
export default class CalTypeSelect extends Vue {
  @Model('change', { type: Array })
  calType!: string[]
  calTypeList = deepClone(CALIBRATE_TYPE)

  selectType = this.calType

  changeType(v) {
    this.$emit('change', v)
  }

  @Watch('calType')
  changeCalType() {
    this.selectType = this.calType
  }
}
</script>
<style lang="scss" scoped>
.type-select {
  display: flex;
  flex-flow: row wrap;
  width: 200px;
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
</style>
