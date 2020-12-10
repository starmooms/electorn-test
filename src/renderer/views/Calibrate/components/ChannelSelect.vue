<template>
  <el-form-item class="form-item" :label="selectName">
    <div class="select-container">
      <el-select
        :multiple="multiple"
        collapse-tags
        :placeholder="`请选择${selectName}`"
        :value="value"
        @change="changeVal"
      >
        <el-option
          v-for="item in chList"
          :key="item.value"
          :label="item.name"
          :value="item.id"
          :disabled="!item.isConnect"
        />
      </el-select>
      <el-button
        v-if="multiple"
        type="text"
        class="select-all"
        @click="setSelectAll"
      >
        全选
      </el-button>
    </div>
  </el-form-item>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { CHANNEL_NUM } from '@/shared/config/channel'
type Val = null | number | number[]

@Component
export default class ChannelSelect extends Vue {
  @Model('change', { type: [Number, Array], required: false })
  private value!: Val

  @Prop({
    validator(value) {
      return ['master', 'slaver', 'channel'].indexOf(value) >= 0
    },
    required: true
  })
  private chType!: 'master' | 'slaver' | 'channel'

  @Prop({ type: Boolean, default: false })
  private multiple!: boolean

  private get chList() {
    return this.chType === 'master'
      ? ChannelStatus.masterChStatusList
      : ChannelStatus.staticChList[this.chType]
    // const list = ChannelStatus.staticChList[this.chType]
    // if (this.chType === 'master') {
    //   return list.filter(item => {
    //     return ChannelStatus.masterConnectList.some(item => item.id)
    //   })
    // }
    // return list
  }

  private get selectName() {
    return CHANNEL_NUM[this.chType].name
  }

  private get selectAll() {
    if (this.multiple && Array.isArray(this.value) && this.chList) {
      return this.value.length === this.chList.length
    }
    return false
  }

  private set selectAll(status: boolean) {
    if (status && this.multiple && this.chList) {
      this.changeVal(this.chList.map(item => item.id))
    } else if (!status) {
      this.changeVal([])
    }
    return
  }

  private setSelectAll() {
    this.selectAll = !this.selectAll
  }

  private changeVal(val: Val) {
    this.$emit('change', val)
  }
}
</script>
<style lang="scss" scoped>
.select-container {
  display: flex;

  .select-all {
    margin-left: 12px;
    white-space: nowrap;
  }
}
</style>
