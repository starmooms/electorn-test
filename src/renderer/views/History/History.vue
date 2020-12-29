<template>
  <HistoryMain ref="historyMain" @refresh="refresh" @changePosition="refresh" />
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import HistoryMain from './HistoryMain.vue'

@Component({
  components: {
    HistoryMain
  }
})
export default class History extends Vue {
  $refs!: {
    historyMain: HistoryMain
  }

  /** 打开数据库 */
  openDb(filePath: string | null) {
    this.$refs.historyMain.openDb(filePath)
  }

  /** 获取通道数据 */
  getSampData() {
    this.$refs.historyMain.getSampData()
  }

  changeFileHandle() {
    this.$command.on({
      eventName: '/history/changeFile',
      onEmit: async (opt: any) => {
        if (opt.filePath) {
          this.openDb(opt.filePath)
        }
      },
      vm: this
    })
  }

  refresh() {
    this.getSampData()
  }

  mounted() {
    this.openDb(this.$route.params.filePath)
    this.changeFileHandle()
  }
}
</script>
