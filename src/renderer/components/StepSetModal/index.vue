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

      <title-box name="工步编辑">
        <el-button type="text" @click="stepsAdd">添加工步</el-button>
        <el-button type="text" @click="tplSaveOpen">保存工步模板</el-button>
        <el-button type="text" @click="tplUseOpen">应用工步模板</el-button>

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
              <el-button type="text" @click="stepsDel($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </title-box>

      <title-box name="保护参数">
        <el-form class="protect-form" :model="protectForm" label-width="200px">
          <el-form-item
            v-for="item in protectList"
            :key="item.index"
            :label="item.name"
          >
            <el-input v-model.number="protectForm[item.type]"></el-input>
          </el-form-item>
        </el-form>
      </title-box>

      <div slot="footer">
        <el-button @click="stepsDialog = false">取 消</el-button>
        <el-button type="primary" @click="stepsSubmit">
          确 定
        </el-button>
      </div>
    </el-dialog>
    <StepTplSave :show.sync="tplSaveShow" :list="stepsList"></StepTplSave>
    <StepTplUse :show.sync="tplUseShow" @tplUse="tplUse"></StepTplUse>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'
import { Port } from '@/types/Port'
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

@Component({
  components: {
    StepTplSave,
    StepTplUse,
    SelectMaster,
    SelectChannel
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

  list: Port.Item[] = []

  tplSaveShow = false
  tplUseShow = false

  stepsList: any[] = []
  stepsSelectOpts = getStepsOpts()
  stepsInputMap = getStepsInputMap()
  stepsId = 0

  protectList = deepClone(PROTECT)
  protectForm = GET_PROTECT_FORM()

  batchMasterId = 0
  batchSlaverId: number[] = []
  batchChannelId: number[] = []

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
    let masterId = 0
    let slaverId: number[] = []
    let channelId: number[] = []
    if (this.isBatch) {
      if (!this.batchMasterId && this.batchMasterId != 0) {
        msg = '请先选择机柜'
      } else if (this.batchSlaverId.length === 0) {
        msg = '请先选择从控'
      } else if (this.batchChannelId.length === 0) {
        msg = '请先选择通道'
      } else {
        masterId = this.batchMasterId
        slaverId = this.batchSlaverId
        channelId = this.batchChannelId
      }
    } else {
      if (!this.showItem) {
        msg = 'showItem 参数错误'
      } else {
        masterId = this.showItem.masterId
        slaverId = [this.showItem.slaverId]
        channelId = [this.showItem.channelId]
      }
    }

    let list: any = []
    if (!msg) {
      list = this.stepsList.filter(item => {
        if (item.name) {
          const hasNull = Object.keys(item.input).find(key => !item.input[key])
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
      this.$message.error('请正确设置工步')
      return
    }
    const data = await setSteps({
      path: this.portPath,
      list,
      masterId,
      slaverId,
      channelId,
      protect: this.protectForm
    })
    if (data.status) {
      this.$message.success('设置工步成功')
      this.closeModal()
    }
  }

  closeModal() {
    this.stepsDialog = false
  }

  @Watch('stepsDialog')
  stepsDialogChange(v) {
    if (v === true) {
      this.stepsList = []
      this.stepsAdd()
      // if (this.isBatch) {
      //   this.$refs.SelectChannel.reset()
      // }
    }
  }

  // @Watch('asyncShow')
  // asyncShowChange(v: boolean) {
  //   if (v) {
  //     this.stepsDialog = true
  //   }
  // }

  tplUseOpen() {
    this.tplUseShow = true
  }

  tplUse(list: any[]) {
    this.stepsList = list
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
}
</script>

<style lang="scss" scoped>
::v-deep .steps-add-dialog {
  min-width: 900px;

  .el-dialog__body {
    max-height: 60vh;
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
}
</style>
