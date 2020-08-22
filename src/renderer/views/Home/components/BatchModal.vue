<template>
  <div>
    <el-dialog class="batch-dialog" :visible.sync="diolog">
      <el-transfer
        v-model="value"
        :data="list"
        :titles="['可选机柜', '已选机柜']"
      >
        <div class="right-footer" slot="right-footer">
          <el-button>启动</el-button>
        </div>
        <div class="left-footer" slot="left-footer"></div>
      </el-transfer>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { Vue, Component, PropSync, Watch } from 'vue-property-decorator'

@Component
export default class BatchModal extends Vue {
  @PropSync('show', { type: Boolean, required: true }) diolog!: boolean
  type = ''

  list: any[] = []
  value: number[] = []

  data() {
    const generateData = () => {
      const data: any[] = []
      for (let i = 1; i <= 15; i++) {
        data.push({
          key: i,
          label: `备选项 ${i}`,
          disabled: i % 4 === 0
        })
      }
      return data
    }
    return {
      data: generateData(),
      value: []
    }
  }

  open(type: string, data: any) {
    this.type = ''
    this.value = []
    switch (type) {
      case 'master':
        this.type = 'master'
        this.list = Object.keys(data).map(key => {
          const val = data[key]
          return {
            key: val.id,
            label: val.name
          }
        })
        break
      default:
        return false
    }
  }

  // @Watch('showSync')
  // changeShow(){

  // }
}
</script>

<style lang="scss" scoped>
.batch-dialog {
}
</style>
