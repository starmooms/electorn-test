<template>
  <div>
    <el-dialog
      title="编辑工步"
      custom-class="steps-add-dialog"
      :close-on-click-modal="false"
      :visible.sync="stepsDialog"
    >
      <template v-if="isBatch">
        <SelectChannel
          ref="SelectChannel"
          isCheckboxMaster
          :masterId.sync="batchMasterId"
          :slaverId.sync="batchSlaverId"
          :channelId.sync="batchChannelId"
        ></SelectChannel>
      </template>

      <title-box name="通道工步编辑">
        <div>
          <el-button type="primary" @click="tplSaveOpen">
            保存工步模板
          </el-button>
          <el-button type="primary" @click="tplUseOpen">应用工步模板</el-button>
        </div>

        <!-- <div class="data-save-box">
          <el-divider content-position="left">数据记录条件</el-divider>
          <el-form class="data-save-form" :inline="true" v-if="dataSave">
            <el-form-item
              class="data-save-item"
              v-for="item in dataSaveList"
              :key="item.index"
            >
              <div
                v-if="dataSave[item.type]"
                :class="{ disable: !dataSave[item.type].enable }"
              >
                <el-checkbox v-model="dataSave[item.type].enable"></el-checkbox>
                <span class="lable">{{ item.label }}：</span>
                <el-input
                  class="data-save-input"
                  :disabled="!dataSave[item.type].enable"
                  v-model.number="dataSave[item.type].value"
                ></el-input>
                <span>{{ item.unit }}</span>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div class="data-feat-box">
          <el-divider content-position="left">特征电压参数</el-divider>
          <el-form class="data-feat-form" :inline="true" v-if="features">
            <el-form-item
              class="feat-form-item"
              v-for="item in featuresList"
              :key="item.type"
              :label="item.label"
            >
              <el-input v-model.number="features[item.type]"></el-input>
            </el-form-item>
          </el-form>
        </div>

        <div class="steps-edit-box">
          <el-divider content-position="left">工步编辑</el-divider>
          <div class="step-edit-set-box">
            <el-button type="primary" @click="stepsAdd">添加工步</el-button>
            <div class="set-start">
              <span>设置第</span>
              <el-input
                class="set-start-input"
                v-model.number="startId"
              ></el-input>
              <span>为起始工步</span>
            </div>
          </div>
          <div class="table-wrapper">
            <el-table :data="stepsList">
              <el-table-column
                type="index"
                label="步次"
                width="50"
              ></el-table-column>
              <el-table-column label="工步类型" width="150">
                <template slot-scope="{ row, $index }">
                  <el-select
                    v-model="row.name"
                    placeholder="请选择"
                    value-key="name"
                    @change="stepItemIdChange($event, row, $index)"
                  >
                    <el-option
                      v-for="item in stepsSelectOpts"
                      :key="item.label"
                      :label="item.label"
                      :value="item.value"
                    ></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="设置" min-width="400">
                <template slot-scope="{ row }" v-if="row.input">
                  <div class="input-box">
                    <div
                      v-for="(value, key) in row.input"
                      :key="key"
                      class="input-item"
                    >
                      <span class="input-name">
                        {{
                          `${stepsInputMap[key].name}(${stepsInputMap[key].unit})`
                        }}：
                      </span>
                      <el-input type="text" v-model.number="row.input[key]" />
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column width="100" label="操作">
                <template slot-scope="{ $index }">
                  <el-button type="text" @click="stepsDel($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div>
          <el-divider content-position="left">保护参数</el-divider>
          <el-form
            v-if="protect"
            class="protect-form"
            :model="protect"
            label-width="200px"
          >
            <el-form-item
              v-for="item in protectList"
              :key="item.index"
              :label="item.name"
            >
              <el-input v-model.number="protect[item.type]"></el-input>
            </el-form-item>
          </el-form>
        </div> -->
        <step-tpl-edit ref="stepTplEdit" />

        <el-divider content-position="left">备注</el-divider>
        <el-form label-width="100px">
          <el-form-item label="历史文件路径">
            <el-input placeholder="" v-model="filePath">
              <file-select slot="append" v-model="filePath"></file-select>
            </el-input>
          </el-form-item>
        </el-form>
      </title-box>

      <div slot="footer">
        <el-button @click="stepsDialog = false">取 消</el-button>
        <el-button type="primary" @click="stepsSubmit">
          启动
        </el-button>
      </div>
    </el-dialog>
    <StepTplSave :show.sync="tplSaveShow" :tplData="tplData"></StepTplSave>
    <StepTplUse :show.sync="tplUseShow" @tplUse="tplUse"></StepTplUse>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'
import { getStepsOpts, getStepsInputMap } from '@/renderer/utils/getConfig'
import { setSteps } from '@/renderer/ipc/channel'
import StepTplSave from './StepTplSave.vue'
import StepTplUse from './StepTplUse.vue'
import { deepClone } from '@/shared/utils'
import SelectMaster from '@/renderer/components/SelectMaster.vue'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { PROTECT, GET_PROTECT_FORM } from '@/shared/config/port'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import SelectChannel from '@/renderer/components/SelectChannel.vue'
import FileSelect from '@/renderer/components/FileSelect.vue'
import StepTplEdit from './StepTplEdit.vue'

const { stepsSelectList, stepsRulseMap } = getStepsOpts()

@Component({
  components: {
    StepTplSave,
    StepTplUse,
    SelectMaster,
    SelectChannel,
    FileSelect,
    StepTplEdit
  }
})
export default class StepSetModal extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private stepsDialog!: boolean

  @Prop({ type: Boolean, default: false }) isBatch!: boolean
  @Prop({ type: Object }) private showItem!: any | null

  $refs!: {
    SelectChannel: SelectChannel
    stepTplEdit: StepTplEdit
  }

  list: any[] = []

  tplSaveShow = false
  tplUseShow = false

  // stepsList: any[] = []
  // stepsSelectOpts = stepsSelectList
  // stepsRulseMap = stepsRulseMap

  // stepsInputMap = getStepsInputMap()
  // stepsId = 0

  // protectList = deepClone(PROTECT)
  // protect: any = null

  batchMasterId: number[] = []
  batchSlaverId: number[] = []
  batchChannelId: number[] = []

  // dataSave: any = null
  // dataSaveList = [
  //   {
  //     label: '时间',
  //     type: 'time',
  //     unit: 's'
  //   },
  //   {
  //     label: '电压间隔',
  //     type: 'U',
  //     unit: 'mV'
  //   },
  //   {
  //     label: '电流间隔',
  //     type: 'I',
  //     unit: 'mA'
  //   }
  // ]
  startId: null | number = 1

  // // 特征电压参数
  // features: ipcReq.Features | null = null
  // featuresList = [
  //   { label: '#1(mV)', type: 'v1' },
  //   { label: '#2(mV)', type: 'v2' },
  //   { label: '#3(mV)', type: 'v3' },
  //   { label: '#4(mV)', type: 'v4' },
  //   { label: '#5(mV)', type: 'v5' }
  // ]

  filePath = SettingStatus.historyFilePath
  tplData: any = null

  // get defaultFilePath() {
  //   return SettingStatus.historyFilePath
  // }

  // get tplData() {
  //   return {
  //     stepsList: this.stepsList,
  //     protect: this.protect,
  //     dataSave: this.dataSave,
  //     features: this.features
  //   }
  // }

  // set tplData(tpl: any) {
  //   this.stepsList = tpl.stepsList
  //   this.protect = tpl.protect
  //   if (tpl.dataSave) {
  //     this.dataSave = tpl.dataSave
  //   }
  //   if (tpl.features) {
  //     this.features = tpl.features
  //   }
  // }

  get channelList() {
    return ChannelStatus.list
  }

  // get batchMaster() {
  //   return this.channelList[this.batchMasterId] || null
  // }

  /** 获取模板内容 */
  async getTplData(checkStartId = true) {
    if (!this.$refs.stepTplEdit) {
      this.$message.error('模板组件未初始化')
      return null
    }
    const tplRestul = await this.$refs.stepTplEdit.getTplData(checkStartId)
    return tplRestul.data
  }

  async stepsSubmit() {
    let msg = ''
    let masterIds: number[] = []
    let slaverIds: number[] = []
    let channelIds: number[] = []
    if (this.isBatch) {
      if (this.batchMasterId.length === 0) {
        msg = '请先选择机柜'
      } else if (this.batchSlaverId.length === 0) {
        msg = '请先选择从控'
      } else if (this.batchChannelId.length === 0) {
        msg = '请先选择通道'
      } else {
        masterIds = this.batchMasterId
        slaverIds = this.batchSlaverId
        channelIds = this.batchChannelId
      }
    } else {
      if (!this.showItem) {
        msg = 'showItem 参数错误'
      } else {
        masterIds = this.showItem.masterIds
        slaverIds = this.showItem.slaverIds
        channelIds = this.showItem.channelIds
      }
    }

    if (msg) {
      return this.$message.warning(msg)
    }
    if (!this.$refs.stepTplEdit) {
      return this.$message.warning('模板组件未初始化')
    } else if (!this.filePath) {
      return this.$message.error('请设置历史文件路径')
    }
    const tpl = await this.getTplData()
    if (tpl) {
      const confirm = await this.$elConfirm('确定应用并启动工步')
      if (confirm) {
        const data = await setSteps({
          stepsList: tpl.stepsList,
          masterIds,
          slaverIds,
          channelIds,
          protect: tpl.protect,
          dataSave: tpl.dataSave,
          startId: tpl.startId,
          features: tpl.features,
          filePath: this.filePath
        })
        if (data.status) {
          this.closeModal()
          this.$emit('openSysLog')
        }
        // if (data.status) {
        //   this.$message.success('设置工步成功')
        //   this.closeModal()
        // }
      }
    }
  }

  closeModal() {
    this.stepsDialog = false
  }

  @Watch('stepsDialog')
  stepsDialogChange(v) {
    if (v === true) {
      this.reset()
      // this.stepsAdd()
      // if (this.isBatch) {
      //   this.$refs.SelectChannel.reset()
      // }
    }
  }

  /** 重置 */
  reset(resetChannel = true) {
    // this.dataSave = {
    //   time: {
    //     enable: true,
    //     value: 1
    //   },
    //   U: {
    //     enable: false,
    //     value: null
    //   },
    //   I: {
    //     enable: false,
    //     value: null
    //   }
    // }
    // this.features = {
    //   v1: null,
    //   v2: null,
    //   v3: null,
    //   v4: null,
    //   v5: null
    // }
    // this.stepsList = []
    // this.protect = GET_PROTECT_FORM()
    if (this.$refs.stepTplEdit) {
      this.$refs.stepTplEdit.reset()
    }
    this.startId = 1
    if (this.$refs.SelectChannel && resetChannel) {
      this.$refs.SelectChannel.reset()
    }
  }

  tplUseOpen() {
    this.tplUseShow = true
  }

  tplUse(tpl: any) {
    this.reset(false)
    this.$refs.stepTplEdit.useTplData(tpl)
  }

  async tplSaveOpen() {
    const tpl = await this.getTplData(false)
    if (tpl) {
      this.tplData = tpl
      this.tplSaveShow = true
    }
  }

  mounted() {
    this.reset()
  }
}
</script>

<style lang="scss" scoped>
::v-deep .steps-add-dialog {
  min-width: 1000px;

  .el-dialog__body {
    max-height: 76vh;
    overflow-y: auto;
    padding-top: 0;
  }

  .el-table td,
  .el-table th {
    vertical-align: top;
  }

  .input-box {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    margin-bottom: -10px;
    .input-item {
      flex: 0 0 33.33%;
      margin-bottom: 10px;
      .input-name {
        display: inline-block;
        width: 90px;
        text-align: right;
      }
      // &:nth-last-child(-n + 3) {
      //   margin-bottom: 0;
      // }
      .el-input {
        width: 74px;
      }
    }
  }

  // .slaver-select-list {
  //   display: flex;
  //   flex-flow: row wrap;
  //   justify-content: flex-start;
  //   .slaver-select-item {
  //     flex: 0 0 12.5%;
  //     margin-right: 0;
  //   }
  // }

  .protect-form {
    display: flex;
    flex-flow: row wrap;
  }

  .data-save-box {
    .data-save-item {
      margin-right: 32px;
      .disable {
        color: #adadad;
      }
      .lable {
        margin-left: 10px;
      }
      .data-save-input {
        width: 80px;
        margin-right: 4px;
      }
    }
  }
}

.steps-edit-box {
  // margin: 20px 0;
  .step-edit-set-box {
    margin: 10px 0;
    display: flex;
    .set-start {
      margin-left: 10px;
      .set-start-input {
        display: inline;
        margin: 0 6px;
        ::v-deep .el-input__inner {
          width: 36px;
          padding: 0 4px;
        }
      }
    }
  }
}

.data-feat-box {
  .data-feat-form {
    display: flex;
    .feat-form-item {
      margin-right: 14px;
    }
    ::v-deep {
      .el-form-item__content {
        width: 80px;
      }
    }
  }
}

.table-wrapper {
  background-color: #f5f7fa;
}
.table-wrapper ::v-deep {
  .el-table,
  .el-table tr,
  .el-table th,
  .el-table--enable-row-transition .el-table__body td {
    background-color: transparent;
  }
}
.el-table__expanded-cell,
.el-table .cell {
  background-color: transparent;
}

::v-deep {
  .el-dialog {
    display: flex;
    flex-direction: column;
    margin: 0 !important;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    /*height:600px;*/
    max-height: calc(100% - 30px);
    max-width: calc(100% - 30px);
    .el-dialog__body {
      flex: 1;
      overflow: auto;
    }
  }
}
</style>
