<template>
  <div>
    <div>
      <el-checkbox v-if="isCheckbox" v-model="masterAll">
        全选
      </el-checkbox>
    </div>
    <div
      v-if="list"
      :is="groupName.group"
      class="master-group"
      v-model="activeId"
    >
      <component
        class="master-group-item"
        :is="groupName.item"
        v-for="(master, mKey) in list"
        :key="mKey"
        :label="labelKey ? mKey : master.id"
        :disabled="!master.isConnect"
      >
        {{ master.name }}
      </component>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Model, Prop } from 'vue-property-decorator'
import { ChannelStatus } from '@/renderer/store/modules/Channel'

@Component({
  name: 'select-master'
})
export default class SelectMaster extends Vue {
  @Model('change', { type: [Array, Number] }) readonly value!: number | number[]
  @Prop({ type: Boolean, default: false }) isCheckbox!: boolean
  @Prop({ type: Boolean, default: false }) labelKey!: boolean

  get masterAll() {
    return this.isCheckbox
      ? (this.value as number[]).length === this.connectList.length
      : false
  }

  set masterAll(v: boolean) {
    this.activeId = v ? this.connectList.map(item => item.id) : []
  }

  get list() {
    return ChannelStatus.masterChStatusList
  }

  get connectList() {
    return this.list.filter(item => item.isConnect)
  }

  get groupName() {
    return this.isCheckbox
      ? { group: 'ElCheckboxGroup', item: 'ElCheckboxButton' }
      : { group: 'ElRadioGroup', item: 'ElRadioButton' }
  }

  activeId: number | number[] | null = this.isCheckbox ? [] : null
  listId: number[] = []

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
  border-bottom: 0;

  .master-group-item {
    flex: 10%;

    &:nth-of-type(10n + 1)::after {
      position: absolute;
      bottom: 0;
      z-index: 99;
      width: 1000%;
      height: 1px;
      pointer-events: none;
      content: '';
      background: #ccc;
    }

    &:nth-of-type(10n) {
      .el-radio-button__inner,
      .el-checkbox-button__inner {
        border: 0;
      }
    }

    .el-radio-button__inner,
    .el-checkbox-button__inner {
      box-sizing: border-box;
      display: block;
      border: 0;
      border-right: 1px solid #ccc;
      border-radius: 0;
      transition: none;
    }
  }
}
</style>
