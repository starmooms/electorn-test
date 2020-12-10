<template>
  <div class="calibrate-container">
    <div class="calibrate-l">
      <cal-config
        ref="calConfig"
        :show-run-config="showRunConfig"
        @toolCalStart="toolCalStart"
      />
    </div>
    <div class="calibrate-r">
      <el-tabs v-model="activeTab">
        <el-tab-pane
          v-for="item in tabList"
          :key="item.name"
          :label="item.label"
          :name="item.name"
        ></el-tab-pane>
      </el-tabs>

      <div>
        <div v-show="activeTab === 'channelCal'" class="channel-cal">
          <cal-run
            ref="calRun"
            :cal-result-list="calResultList"
            @start="calStart"
            @stop="calStop"
            @clean="clean(1)"
          />
          <cal-re-check
            :recheck-result="recheckResult"
            @start="recheckStart"
            @stop="calStop"
            @clean="clean(5)"
          />
          <cal-result
            :cal-type-list="calTypeList"
            :result-list="resultList"
            @clean="clean(5, true)"
          />
        </div>
        <div v-show="activeTab === 'toolCal'" class="tool-cal">
          <!-- <tool-cal></tool-cal> -->
          <ToolCalTabel ref="toolCalTabel" />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import dayjs from 'dayjs'
import { calLeave, calStart, calStop, recheck } from '@/renderer/ipc/channel'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { CALIBRATE_TYPE } from '@/shared/config/calibrate'
import { createRange, deepClone, TIME_FORMAT } from '@/shared/utils'
import CalConfig from './components/CalConfig/index.vue'
import CalRun from './components/CalRun/index.vue'
import CalReCheck from './components/CalReCheck.vue'
import CalResult from './components/CalResult.vue'
import ToolCalTabel from './components/ToolCalTabel.vue'

@Component({
  name: 'Calibrate',
  components: {
    CalConfig,
    CalRun,
    CalReCheck,
    CalResult,
    ToolCalTabel
  }
})
export default class Calibrate extends Vue {
  $refs!: {
    calConfig: CalConfig
    calRun: CalRun
    toolCalTabel: ToolCalTabel
  }

  calTypeList = deepClone(CALIBRATE_TYPE)

  /** 当前运行信息 */
  info: CalibrateT.CalRunInfo | null = null

  calResultList: any[] = []
  recheckResult: any[] = []
  resultList: any[] = []
  resultMap: any = {}

  tabList = [
    { name: 'channelCal', label: '通道校准' },
    { name: 'toolCal', label: '工装校准' }
  ]
  activeTab = this.tabList[0].name

  /** 显示 校准运行设置 */
  get showRunConfig() {
    return this.activeTab === 'channelCal'
  }

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
    await calStop()
  }

  /** 复检开始 */
  async recheckStart(recheckForm: CalibrateTR.RecheckSumbitForm) {
    const config = this.$refs.calConfig.getForm()
    if (config.status) {
      const calType = this.$refs.calRun.getCalType()
      if (calType === false) return

      const iRange = createRange(
        recheckForm.IStart,
        recheckForm.IEnd,
        recheckForm.IStep
      )
      const uRange = createRange(
        recheckForm.UStart,
        recheckForm.UEnd,
        recheckForm.UStep
      )
      if (iRange.length === 0) {
        return this.$message.error('电流范围为0')
      } else if (uRange.length === 0) {
        return this.$message.error('电压范围为0')
      }

      const result = await recheck({
        config: config.form,
        calType,
        recheckForm,
        iRange,
        uRange
      })
      if (result.status) {
        this.$message.success('复检启动成功')
        this.recheckResult = []
        this.resetResultList(config.form, iRange, uRange)
        SettingStatus.getUserConfg()
      }
    }
  }

  /** 重置复检结果数据 */
  resetResultList(
    config: CalibrateT.CalConfSubmitForm,
    iRange: number[],
    uRange: number[]
  ) {
    const { masterId, slaverId, channelId } = config
    const resultList: any[] = []
    const resultMap: any = {}
    const calTypeItem = {}
    CALIBRATE_TYPE.forEach(item => {
      calTypeItem[`calType_${item.type}`] = null
      calTypeItem[`calType_result_${item.type}`] = {
        result: [],
        rangeKey: item.rangeType === 'A' ? 'iRange' : 'uRange'
      }
    })
    channelId.forEach(chId => {
      const item = {
        masterId,
        slaverId,
        channelId: chId,
        ...deepClone(calTypeItem),
        time: dayjs().format(TIME_FORMAT),
        iRange,
        uRange
      }
      resultMap[`${masterId}_${slaverId}_${chId}`] = item
      resultList.push(item)
    })
    this.resultList = resultList
    this.resultMap = resultMap
  }

  /** 复检结果统计 */
  handleResult(list: any[]) {
    list.forEach(item => {
      const { masterId, slaverId, channelId, calType, pointName } = item
      const chResult = this.resultMap[`${masterId}_${slaverId}_${channelId}`]
      if (chResult) {
        const status = item.status
        const chTypeResult = chResult[`calType_result_${calType}`]
        chTypeResult.result.push({
          point: pointName,
          status
        })

        if (chResult[`calType_${calType}`] === null) {
          if (status === false) {
            chResult[`calType_${calType}`] = false
          } else if (
            chTypeResult.result.length ===
            chResult[chTypeResult.rangeKey].length
          ) {
            // 统计结果，等于总统计长度时, 判断是否全部为true
            const hasError = chTypeResult.result.find(
              item => item.status === false
            )
            chResult[`calType_${calType}`] = hasError ? false : true
          }
        }
      }
    })
  }

  /** 清除 */
  clean(runType: 1 | 5, isResult = false) {
    if (this.info && this.info.isRun && this.info.runType === runType) {
      return this.$message.warning(`${this.info.runTypeName} 正在运行无法清除`)
    }
    if (runType === 1) {
      this.calResultList = []
    } else if (runType === 5) {
      if (isResult) {
        this.resultList = []
        this.resultMap = {}
        return
      }
      this.recheckResult = []
    }
  }

  getToolIp() {
    return this.$refs.calConfig.getToolIp()
  }

  toolCalStart(data: CalibrateTR.ToolCalCreateCal) {
    this.$refs.toolCalTabel.createCal(data)
  }

  mounted() {
    this.$command.on({
      eventName: '/calibrate/pointResult',
      onEmit: data => {
        this.info = data.info
        if (data.type === 'calRunResult') {
          this.calResultList = this.calResultList.concat(data.data)
        } else if (data.type === 'calRecheckResult') {
          const list = data.data
          this.handleResult(list)
          this.recheckResult = this.recheckResult.concat(list)
        } else if (data.type === 'error') {
          this.$notify.error({
            title: '错误',
            message: data.data,
            duration: 0
          })
        } else if (data.type === 'msg') {
          this.$notify.success({
            title: '提示',
            message: data.data,
            duration: 3000
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

  /** 离开页面前如果还在运行 */
  async isRunLeave(next: any) {
    if (this.info && this.info.isRun) {
      const runTypeName = this.info.runTypeName
      const confirm = await this.$elConfirm(
        `${runTypeName}正在运行，退出页面将关闭${runTypeName}？`,
        {
          userReversal: true
        }
      )
      if (!confirm) return
    }
    await calLeave()
    next()
  }

  async beforeRouteLeave(to, form, next) {
    this.isRunLeave(next)
  }
}
</script>

<style lang="scss" scoped>
.calibrate-container {
  display: flex;

  .calibrate-r {
    flex: 1 1 auto;
    margin-left: 40px;
    overflow: hidden;
  }

  .cal-action-box {
    display: flex;
    margin-top: 14px;
    margin-bottom: 8px;
  }
}
</style>
<style lang="scss">
.calibrate-container {
  .cal-action-box {
    display: flex;
    margin-top: 14px;
    margin-bottom: 8px;

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

  .status-icon {
    font-size: 18px;

    &.success {
      color: #67c23a;
    }

    &.error {
      color: #f56c6c;
    }
  }
}
</style>
