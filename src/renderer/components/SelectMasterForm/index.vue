<template>
  <el-form-item label="机柜">
    <div class="select-master">
      <el-col :span="20">
        <el-select
          :value="value"
          @change="emitSelect"
          multiple
          collapse-tags
          placeholder="请选择机柜"
        >
          <el-option
            v-for="item in staticMaster"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-button type="text" @click="selectAllMaster">全选</el-button>
      </el-col>
    </div>
  </el-form-item>
</template>
<script lang="ts">
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { Vue, Component, Model } from 'vue-property-decorator'

@Component
export default class SelectMasterForm extends Vue {
  @Model('change', { type: Array }) value!: number[]

  get staticMaster() {
    return ChannelStatus.staticChList.master
  }

  emitSelect(v: number[]) {
    this.$emit('change', v)
  }

  /** 全选 */
  selectAllMaster() {
    let value = this.value
    if (value.length === this.staticMaster.length) {
      value = []
    } else {
      value = this.staticMaster.map(item => item.id)
    }
    this.emitSelect(value)
  }
}
</script>
<style lang="scss" scoped>
.select-master {
  width: 260px;
}
</style>
