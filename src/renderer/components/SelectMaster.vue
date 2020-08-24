<template>
  <div :is="groupName.group" class="master-group" v-model="activeId">
    <component
      class="master-group-item"
      :is="groupName.item"
      v-for="(master, mKey) in list"
      :key="mKey"
      :label="labelKey ? mKey : master.id"
    >
      {{ master.name }}
    </component>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Model, Prop } from 'vue-property-decorator'
import { ChannelStatus } from '@/renderer/store/modules/Channel'

@Component({
  name: 'select-master'
})
export default class SelectMaster extends Vue {
  @Model('change', { type: [Array, String, Number] }) readonly value!:
    | string
    | string[]
  @Prop({ type: Boolean, default: false }) isCheckbox!: boolean
  @Prop({ type: Boolean, default: false }) labelKey!: boolean

  get list() {
    return ChannelStatus.list
  }

  get groupName() {
    return this.isCheckbox
      ? { group: 'ElCheckboxGroup', item: 'ElCheckboxButton' }
      : { group: 'ElRadioGroup', item: 'ElRadioButton' }
  }

  activeId: string | string[] = this.isCheckbox ? [] : ''

  @Watch('activeId')
  changeActiveId() {
    this.$emit('change', this.activeId)
  }

  @Watch('value')
  changeValue() {
    this.activeId = this.value
  }

  mounted() {
    this.changeValue()
  }
}
</script>

<style lang="scss" scoped>
.master-group ::v-deep {
  display: flex;
  flex-flow: row wrap;
  border: 1px solid #ccc;
  border-bottom: none;

  .master-group-item {
    flex: 10%;

    &:nth-of-type(10n + 1):after {
      content: '';
      position: absolute;
      bottom: 0;
      width: 1000%;
      height: 1px;
      background: #ccc;
      z-index: 99;
      pointer-events: none;
    }
    &:nth-of-type(10n) {
      .el-radio-button__inner,
      .el-checkbox-button__inner {
        border: none;
      }
    }

    .el-radio-button__inner,
    .el-checkbox-button__inner {
      display: block;
      box-sizing: border-box;
      border: none;
      border-right: 1px solid #ccc;
      border-radius: 0;
    }
  }
}
</style>
