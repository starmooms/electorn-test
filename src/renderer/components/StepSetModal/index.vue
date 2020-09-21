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

        <div class="data-save-box">
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
                      :disabled="item.value.type === 'loop' && hasLoop"
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
                      {{ stepsInputMap[key].name }}：
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
        </div>

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
import isEqual from 'lodash/isEqual'
import { deepClone } from '@/shared/utils'
import SelectMaster from '@/renderer/components/SelectMaster.vue'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { PROTECT, GET_PROTECT_FORM } from '@/shared/config/port'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import SelectChannel from '@/renderer/components/SelectChannel.vue'
import FileSelect from '@/renderer/components/FileSelect.vue'

@Component({
  components: {
    StepTplSave,
    StepTplUse,
    SelectMaster,
    SelectChannel,
    FileSelect
  }
})
export default class StepSetModal extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private stepsDialog!: boolean

  @Prop({ type: Boolean, default: false }) isBatch!: boolean
  @Prop({ type: Object }) private showItem!: any | null

  $refs!: {
    SelectChannel: SelectChannel
  }

  list: any[] = []

  tplSaveShow = false
  tplUseShow = false

  stepsList: any[] = []
  stepsSelectOpts = getStepsOpts()
  stepsInputMap = getStepsInputMap()
  stepsId = 0

  protectList = deepClone(PROTECT)
  protect: any = null

  batchMasterId = 0
  batchSlaverId: number[] = []
  batchChannelId: number[] = []

  dataSave: any = null
  dataSaveList = [
    {
      label: '时间',
      type: 'time',
      unit: 's'
    },
    {
      label: '电压间隔',
      type: 'U',
      unit: 'mV'
    },
    {
      label: '电流间隔',
      type: 'I',
      unit: 'mA'
    }
  ]
  startId: null | number = null

  filePath = ''

  get tplData() {
    return {
      stepsList: this.stepsList,
      protect: this.protect,
      dataSave: this.dataSave
    }
  }

  set tplData(tpl: any) {
    this.stepsList = tpl.stepsList
    this.protect = tpl.protect
    if (tpl.dataSave) {
      this.dataSave = tpl.dataSave
    }
    this.startId = null
  }

  get channelList() {
    return ChannelStatus.list
  }

  // get batchMaster() {
  //   return this.channelList[this.batchMasterId] || null
  // }

  get portPath() {
    return SettingStatus.portPath
  }

  get hasLoop() {
    return this.stepsList.find((item: any) => item.type === 'loop')
      ? true
      : false
  }

  async stepsSubmit() {
    let msg = ''
    let masterIds: number[] = []
    let slaverIds: number[] = []
    let channelIds: number[] = []
    if (this.isBatch) {
      if (!this.batchMasterId && this.batchMasterId != 0) {
        msg = '请先选择机柜'
      } else if (this.batchSlaverId.length === 0) {
        msg = '请先选择从控'
      } else if (this.batchChannelId.length === 0) {
        msg = '请先选择通道'
      } else {
        masterIds = [this.batchMasterId]
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

    let list: any = []
    if (!msg) {
      console.log(this.stepsList)
      list = this.stepsList.filter(item => {
        console.log(item)
        if (item.name) {
          const hasNull = Object.keys(item.input).find(
            key => !item.input[key] && item.input[key] !== 0
          )
          if (hasNull) {
            msg = '工步中有参数未设置'
          }
          console.log(hasNull)
          return !hasNull
        }
        return false
      })
    }
    if (msg) {
      this.$message.warning(msg)
      return
    }

    if (list.length === 0) {
      this.$message.error('请正确设置工步列表')
      return
    }
    if (!this.startId) {
      return this.$message.error('请设置起始工步')
    }
    if (!this.filePath) {
      return this.$message.error('请设置历史文件路径')
    }

    const startId = this.startId - 1
    if (!(startId <= this.stepsList.length)) {
      return this.$message.error('起始工步应该在当前工步列表范围内')
    }

    const confirm = await this.$elConfirm('确定应用并启动工步')
    if (confirm) {
      const data = await setSteps({
        path: this.portPath,
        stepsList: list,
        masterIds,
        slaverIds,
        channelIds,
        protect: this.protect,
        dataSave: this.dataSave,
        startId: startId,
        filePath: this.filePath
      })
      if (data.status) {
        this.$message.success('设置工步成功')
        this.closeModal()
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
      this.stepsAdd()
      // if (this.isBatch) {
      //   this.$refs.SelectChannel.reset()
      // }
    }
  }

  /** 重置 */
  reset() {
    this.dataSave = {
      time: {
        enable: true,
        value: 1
      },
      U: {
        enable: false,
        value: null
      },
      I: {
        enable: false,
        value: null
      }
    }
    this.stepsList = []
    this.protect = GET_PROTECT_FORM()
  }

  tplUseOpen() {
    this.tplUseShow = true
  }

  tplUse(tpl: any) {
    this.reset()
    this.tplData = tpl
  }

  tplSaveOpen() {
    if (this.stepsList.length === 0) {
      this.$message.warning('请先添加工步')
      return
    }
    this.tplSaveShow = true
  }

  stepsAdd() {
    const obj: any = {
      id: ++this.stepsId,
      type: '',
      name: '',
      input: {}
    }
    if (this.hasLoop) {
      this.stepsList.splice(this.stepsList.length - 1, 0, obj)
    } else {
      this.stepsList.push(obj)
    }
  }

  stepsDel(index: number) {
    this.stepsList.splice(index, 1)
  }

  stepItemIdChange(value, row, index) {
    const lastIndex = this.stepsList.length - 1
    const input = {}
    value.input.forEach(item => {
      input[item] = null
    })
    row.input = input
    row.type = value.type
    row.name = value.name
    if (value === 'loop' && index !== lastIndex) {
      this.stepsList.splice(index, 1)
      this.stepsList.push(row)
    }
  }

  mounted() {
    this.reset()
  }
}
</script>

<style lang="scss" scoped>
::v-deep .steps-add-dialog {
  min-width: 900px;

  .el-dialog__body {
    max-height: 76vh;
    overflow-y: auto;
    padding-top: 0;
  }

  .input-box {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    .input-item {
      flex: 0 0 33.33%;
      margin-bottom: 10px;
      &:nth-last-child(-n + 3) {
        margin-bottom: 0;
      }
      .el-input {
        width: 74px;
      }
    }
  }

  .slaver-select-list {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    .slaver-select-item {
      flex: 0 0 12.5%;
      margin-right: 0;
    }
  }

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
