<template>
  <el-form :inline="true" label-width="80px">
    <el-form-item label="机柜：">
      <el-input-number
        v-model="masterId"
        :min="1"
        :max="20"
        @change="changeData"
      ></el-input-number>
    </el-form-item>
    <el-form-item label="从控：">
      <el-input-number
        v-model="slaverId"
        :min="1"
        :max="32"
        @change="changeData"
      ></el-input-number>
    </el-form-item>
    <el-form-item label="通道：">
      <el-input-number
        v-model="channelId"
        :min="1"
        :max="8"
        @change="changeData"
      ></el-input-number>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import _debounce from 'lodash/debounce'

@Component
export default class ChPosition extends Vue {
  @Prop({
    type: Object,
    default() {
      return {
        masterId: 0,
        slaverId: 0,
        channelId: 0
      }
    }
  })
  position!: ipcReq.Position

  masterId = 0
  slaverId = 0
  channelId = 0

  changeDataHook!: any

  changeData() {
    this.changeDataHook()
  }

  setFromPostion() {
    this.masterId = this.position.masterId + 1
    this.slaverId = this.position.slaverId + 1
    this.channelId = this.position.channelId + 1
  }

  @Watch('position', { deep: true })
  changePostion() {
    this.setFromPostion()
  }

  mounted() {
    this.setFromPostion()
    this.changeDataHook = _debounce(() => {
      this.$emit('changeData', {
        masterId: this.masterId - 1,
        slaverId: this.slaverId - 1,
        channelId: this.channelId - 1
      })
    }, 400)
  }
}
</script>

<style lang="scss" scoped>
.el-input-number {
  width: 90px;
}
</style>
