<template>
  <el-form
    ref="elForm"
    class="cal-config-box"
    label-width="100px"
    :show-message="false"
    :hide-required-asterisk="true"
    :model="form"
    :rules="rules"
  >
    <TitleBox class="config-item" size="mini" name="工装设置">
      <el-form-item class="form-item" label="工装IP" prop="toolIp">
        <el-input v-model.trim="form.toolIp" />
      </el-form-item>
      <el-form-item class="form-item">
        <el-button
          :loading="toolIpLoading"
          type="primary"
          @click="checkToolIpConnect"
        >
          测试连接
        </el-button>
      </el-form-item>
    </TitleBox>

    <TitleBox
      v-show="showRunConfig"
      class="config-item"
      size="mini"
      name="设备"
    >
      <ChannelSelect v-model="form.masterId" ch-type="master" prop="masterId" />
      <ChannelSelect v-model="form.slaverId" ch-type="slaver" prop="slaverId" />
      <ChannelSelect
        v-model="form.channelId"
        ch-type="channel"
        multiple
        prop="channelId"
      />

      <el-form-item class="form-item" label="误差标准(A/V)" prop="standard">
        <el-input-number v-model.number="form.standard" :controls="false" />
      </el-form-item>

      <el-divider content-position="left">辅助设备</el-divider>
      <el-form-item class="form-item" label="电流量程" prop="iRangeId">
        <el-select v-model="form.iRangeId" placeholder="请选择">
          <el-option
            v-for="item in iRangeOpts"
            :key="item.label"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="form-item" label="电压量程" prop="uRangeId">
        <el-select v-model="form.uRangeId" placeholder="请选择">
          <el-option
            v-for="item in uRangeOpts"
            :key="item.label"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item class="form-item" label="采样时间(s)" prop="sampTime">
        <el-input-number v-model.number="form.sampTime" :controls="false" />
      </el-form-item>
    </TitleBox>

    <ToolCalConfig v-show="!showRunConfig" v-on="$listeners" />
  </el-form>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Form } from 'element-ui'
import { getStaticChList } from '@/shared/config/channel'
import {
  I_RANGE_OPTS,
  STANDARD_OPTS,
  U_RANGE_OPTS
} from '@/shared/config/calibrate'
import { deepClone } from '@/shared/utils'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { calCheckToolIp } from '@/renderer/ipc/channel'
import ToolCalConfig from './ToolCalConfig.vue'
import ChannelSelect from '../ChannelSelect.vue'
import { checkIp } from '@/renderer/utils/validator'

@Component({
  components: {
    ToolCalConfig,
    ChannelSelect
  }
})
export default class CalConfig extends Vue {
  @Prop({ type: Boolean, default: true }) showRunConfig!: boolean

  $refs!: {
    elForm: Form
  }

  channelList = getStaticChList()
  standardOpts = deepClone(STANDARD_OPTS)
  uRangeOpts = deepClone(U_RANGE_OPTS)
  iRangeOpts = deepClone(I_RANGE_OPTS)

  form: CalibrateT.CalConfForm = {
    toolIp: '',
    masterId: null,
    slaverId: null,
    channelId: [],
    standard: this.standardOpts[0],
    uRangeId: 0,
    iRangeId: 0,
    sampTime: 5
  }

  rules = {
    toolIp: [
      { required: true, type: 'string', message: `工装IP不能未空` },
      {
        validator: (rule: any, value: string, callback: any) => {
          if (!checkIp(value)) {
            callback(new Error(`工装IP格式错误`))
            return
          }
          callback()
        }
      }
    ],
    masterId: [{ required: true, type: 'number', message: '请选择机柜' }],
    slaverId: [{ required: true, type: 'number', message: '请选择丛控' }],
    channelId: [
      {
        validator: (rule: any, value: number[], callback: any) => {
          if (value.length === 0) {
            callback(new Error(`请选择通道`))
            return
          }
          callback()
        }
      }
    ],
    uRangeId: [{ required: true, type: 'number', message: '请填写电压量程' }],
    iRangeId: [{ required: true, type: 'number', message: '请填写电流量程' }],
    standard: [{ required: true, type: 'number', message: '请填写标准误差' }],
    sampTime: [{ required: true, type: 'number', message: '请填写采样时间' }]
  }

  toolIpLoading = false

  get config() {
    return SettingStatus.userConfig?.calibrateConfig?.config
  }

  validate() {
    return new Promise((resolve, reject) => {
      this.$refs.elForm.validate((valid, data) => {
        if (valid) {
          resolve(true)
        } else {
          const key1 = Object.keys(data)[0]
          const err = data[key1][0]?.message
          this.$message.info(err || '表单验证错误')
          resolve(false)
        }
      })
    })
  }

  async getForm() {
    const status = await this.validate()
    if (!status) return false
    const form = this.form
    form.channelId = form.channelId.sort((a, b) => a - b)
    return {
      status: true as true,
      form: form as CalibrateT.CalConfSubmitForm
    }
  }

  toolCalStart(data: any) {
    this.$emit('toolCalStart', data)
  }

  getToolIp() {
    const toolIp = this.form.toolIp
    if (!toolIp) {
      this.$message.info('请先填写工装IP')
      return false
    } else if (!checkIp(toolIp)) {
      this.$message.info('工装IP格式错误')
      return false
    }
    return toolIp
  }

  /** 测试工装ip连接 */
  async checkToolIpConnect() {
    if (this.toolIpLoading) return
    const ip = this.getToolIp()
    try {
      this.toolIpLoading = true
      if (ip) {
        const data = await calCheckToolIp(ip)
        if (data.status) {
          this.$message.success('连接成功')
        }
      }
    } finally {
      this.toolIpLoading = false
    }
  }

  mounted() {
    if (this.config) {
      this.form = {
        ...this.form,
        ...this.config
      }
    }
    if (this.form.channelId.length === 0) {
      this.form.channelId = this.channelList.channel.map(item => {
        return item.id
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.cal-config-box {
  width: 280px;

  .config-item {
    width: 100%;

    .form-item {
      &:last-of-type {
        margin: 0;
      }

      ::v-deep {
        .el-form-item__label {
          font-size: 13px;
        }

        .el-input-number .el-input__inner {
          text-align: left;
        }
      }
    }
  }
}
</style>
