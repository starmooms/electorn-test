<template>
  <div>
    <title-box name="选择通道">
      <SelectMaster
        :isCheckbox="isCheckboxMaster"
        v-model="masterIdSync"
      ></SelectMaster>
      <el-divider content-position="left">从控</el-divider>
      <div class="slaver-select">
        <el-checkbox v-model="slaverAll">
          全选
        </el-checkbox>
        <el-checkbox-group class="slaver-select-list" v-model="slaverIdSync">
          <el-checkbox
            class="slaver-select-item"
            v-for="(item, index) in 32"
            :label="index"
            :key="item"
          >
            从控{{ item }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <el-divider content-position="left">通道</el-divider>
      <el-checkbox v-model="channelAll">
        全选
      </el-checkbox>
      <el-checkbox-group v-model="channelIdSync">
        <el-checkbox v-for="(item, index) in 8" :label="index" :key="item">
          通道{{ item }}
        </el-checkbox>
      </el-checkbox-group>
    </title-box>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, PropSync } from 'vue-property-decorator'
import SelectMaster from '@/renderer/components/SelectMaster.vue'

@Component({
  components: {
    SelectMaster
  }
})
export default class SelectChannel extends Vue {
  @Prop({ type: Boolean, default: false }) isCheckboxMaster!: boolean
  @PropSync('masterId', { type: [Object, Number, Array], required: false })
  masterIdSync!: number | number[] | null
  @PropSync('slaverId', { type: Array, required: true })
  slaverIdSync!: number[]
  @PropSync('channelId', { type: Array, required: true })
  channelIdSync!: number[]

  slaverList: number[] = []
  channelList: number[] = []

  get slaverAll() {
    return this.slaverIdSync.length === this.slaverList.length
  }

  set slaverAll(v: boolean) {
    this.slaverIdSync = v ? this.slaverList : []
  }

  get channelAll() {
    return this.channelIdSync.length === this.channelList.length
  }

  set channelAll(v: boolean) {
    this.channelIdSync = v ? this.channelList : []
  }

  // @Watch('masterIdSync')
  // changeMasterId() {
  //   this.reset()
  // }

  reset() {
    if (this.isCheckboxMaster) {
      this.masterIdSync = []
    } else {
      this.masterIdSync = null
    }
    this.slaverAll = true
    this.channelAll = true
  }

  mounted() {
    for (let i = 0; i < 32; i++) {
      this.slaverList.push(i)
    }
    for (let i = 0; i < 8; i++) {
      this.channelList.push(i)
    }
    this.reset()
  }
}
</script>

<style lang="scss" scoped>
::v-deep .slaver-select-list {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  .slaver-select-item {
    flex: 0 0 12.5%;
    margin-right: 0;
  }
}
</style>
