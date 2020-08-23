<template>
  <el-radio-group class="master-group" v-model="activeId">
    <el-radio-button
      class="master-group-item"
      v-for="(master, mKey) in list"
      :key="mKey"
      :label="mKey"
    >
      {{ master.name }}
    </el-radio-button>
  </el-radio-group>
</template>

<script lang="ts">
import { Component, Vue, Watch, Model } from 'vue-property-decorator'
import { ChannelStatus } from '@/renderer/store/modules/Channel'

@Component
export default class SelectMaster extends Vue {
  @Model('change', { type: String }) readonly value!: string

  get list() {
    return ChannelStatus.list
  }

  activeId = ''

  @Watch('activeId')
  changeActiveId() {
    this.$emit('change', this.activeId)
  }

  @Watch('value')
  changeValue() {
    this.activeId = this.value
  }

  mounted() {
    this.activeId = this.value
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
    }
    &:nth-of-type(10n) {
      .el-radio-button__inner {
        border: none;
      }
    }

    .el-radio-button__inner {
      display: block;
      box-sizing: border-box;
      border: none;
      border-right: 1px solid #ccc;
    }
  }
}
</style>
