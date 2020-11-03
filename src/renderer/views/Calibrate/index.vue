<template>
  <div class="calibrate-container">
    <div class="calibrate-l">
      <cal-config ref="calConfig" />
    </div>
    <div class="calibrate-r">
      <div>
        <cal-run
          @start="calStart"
          @stop="calStop"
          :calResultList="calResultList"
        />
        <cal-re-check />
        <cal-result />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import CalConfig from './CalConfig.vue'
import CalRun from './CalRun.vue'
import CalReCheck from './CalReCheck.vue'
import CalResult from './CalResult.vue'
import { calStart, calStop } from '@/renderer/ipc/channel'

@Component({
  components: {
    CalConfig,
    CalRun,
    CalReCheck,
    CalResult
  }
})
export default class Calibrate extends Vue {
  $refs!: {
    calConfig: CalConfig
  }

  isRun = false
  calResultList: any[] = []

  /** 开始校准修调 */
  async calStart(startData: CalibrateTR.StartData) {
    const config = this.$refs.calConfig.getForm()

    if (config.status) {
      const data = await calStart({
        config: config.form,
        calType: startData.calType
      })
      if (data.status) {
        this.$message.success('校准启动成功')
        this.calResultList = []
      }
      console.log(config.form, startData)
    }
  }

  /** 停止校准 */
  async calStop() {
    const result = await calStop()
    if (result.status) {
      this.$message.success('校准停止成功')
    }
  }

  mounted() {
    this.$command.on({
      eventName: '/calibrate/pointResult',
      onEmit: data => {
        console.log(data)
        this.calResultList = this.calResultList.concat(data)
        // this.portList = data.list.map(item => {
        //   return {
        //     readTranslate: false,
        //     ...item
        //   }
        // })
      },
      vm: this
    })
  }

  beforeRouteLeave(to, form, next) {
    if (!this.isRun) next()
  }
}
</script>

<style lang="scss" scoped>
.calibrate-container {
  display: flex;
  .calibrate-l {
    // width: 400px;
    // background-color: red;
  }
  .calibrate-r {
    flex: 1 1 auto;
    margin-left: 40px;
    overflow: hidden;
  }
  .cal-action-box {
    display: flex;
    margin-bottom: 8px;
    margin-top: 14px;
  }
}
</style>
<style lang="scss">
.calibrate-container {
  .cal-action-box {
    display: flex;
    margin-bottom: 8px;
    margin-top: 14px;

    .title {
      margin: 0;
      margin-right: 20px;
    }

    .action-btn-box {
      display: flex;
      flex-flow: row wrap;
      width: 150px;
      .el-button {
        margin: 0;
        margin-bottom: 10px;
        &:nth-of-type(2n + 1) {
          margin-right: 20px;
        }
        &:last-child,
        &:nth-last-of-type(2) {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
