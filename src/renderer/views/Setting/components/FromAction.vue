<template>
  <div class="from-action">
    <el-button type="primary" @click="submit">保存{{ title }}</el-button>
    <el-button @click="reset">放弃</el-button>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, PropSync } from 'vue-property-decorator'
import { deepClone } from '@/shared/utils'

@Component
export default class FromAction extends Vue {
  @Prop({ type: String, default: '' }) title!: string
  @PropSync('data', {
    type: Object,
    default() {
      return {}
    }
  })
  dataSync!: any

  backup!: any

  update() {
    this.backup = deepClone(this.dataSync)
  }

  rollBack() {
    this.dataSync = deepClone(this.backup)
  }

  submit() {
    this.$emit('submit')
  }

  reset() {
    this.rollBack()
  }

  activated() {
    if (this.backup) {
      this.rollBack()
    }
  }
}
</script>
