<template>
  <div class="calibrate-container">
    <div class="calibrate-l">
      <cal-config ref="calConfig" />
    </div>
    <div class="calibrate-r">
      <div>
        <cal-run
          ref="calRun"
          @start="calStart"
          @stop="calStop"
          :calResultList="calResultList"
        />
        <cal-re-check
          @start="recheckStart"
          @stop="calStop"
          :recheckResult="recheckResult"
        />
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
import { calLeave, calStart, calStop, recheck } from '@/renderer/ipc/channel'
import { SettingStatus } from '@/renderer/store/modules/Setting'

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
    calRun: CalRun
  }

  isRun = false
  calResultList: any[] = []
  recheckResult: any[] = []

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
        SettingStatus.getUserConfg()
      }
    }
  }

  /** 停止校准 */
  async calStop() {
    const result = await calStop()
    if (result.status) {
      this.$message.success('校准停止成功')
    }
  }

  /** 复检开始 */
  async recheckStart(recheckForm: CalibrateTR.RecheckSumbitForm) {
    const config = this.$refs.calConfig.getForm()
    if (config.status) {
      const calType = this.$refs.calRun.getCalType()
      if (calType === false) return
      const result = await recheck({
        config: config.form,
        calType,
        recheckForm
      })
      if (result.status) {
        this.$message.success('复检启动成功')
        this.recheckResult = []
        SettingStatus.getUserConfg()
      }
    }
  }

  mounted() {
    this.$command.on({
      eventName: '/calibrate/pointResult',
      onEmit: data => {
        if (data.type === 'calRunResult') {
          this.calResultList = this.calResultList.concat(data.data)
        } else if (data.type === 'calRecheckResult') {
          this.recheckResult = this.recheckResult.concat(data.data)
        } else if (data.type === 'error') {
          this.$notify.error({
            title: '校准错误',
            message: data.data,
            duration: 0
          })
        } else if (data.type === 'msg') {
          this.$notify.success({
            title: '校准',
            message: data.data,
            duration: 0
          })
        }
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

  // /** 离开页面前 */
  // async beforeLeave(next: any) {
  //   try {
  //     const result = await calLeave()
  //     if(result.status){
  //       const data = result.data
  //       if(data.isCalRun) {
  //         const confirm = await this.$elConfirm('校准正在运行中,')
  //         if(confirm){

  //         }
  //       }
  //     }
  //   } catch (err) {
  //     console.error(err)
  //     next()
  //   }
  // }

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
