<template>
  <div>
    <el-dialog
      title="编辑工步"
      class="center-dialog"
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
import { setSteps } from '@/renderer/ipc/channel'
import StepTplSave from './StepTplSave.vue'
import StepTplUse from './StepTplUse.vue'
import SelectMaster from '@/renderer/components/SelectMaster.vue'
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import SelectChannel from '@/renderer/components/SelectChannel.vue'
import FileSelect from '@/renderer/components/FileSelect.vue'
import StepTplEdit from './StepTplEdit.vue'

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

  batchMasterId: number[] = []
  batchSlaverId: number[] = []
  batchChannelId: number[] = []

  startId: null | number = 1

  filePath = SettingStatus.historyFilePath
  tplData: any = null

  get channelList() {
    return ChannelStatus.list
  }

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
    }
  }

  /** 重置 */
  reset(resetChannel = true) {
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
}
</style>
