<template>
  <el-form class="cal-config-box" label-width="80px">
    <title-box class="config-item" size="mini" name="工装设置">
      <el-form-item class="form-item" label="工装IP">
        <el-input v-model="form.toolIp"></el-input>
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
    </title-box>

    <title-box
      v-show="showRunConfig"
      class="config-item"
      size="mini"
      name="设备"
    >
      <channel-select v-model="form.masterId" ch-type="master" />
      <channel-select v-model="form.slaverId" ch-type="slaver" />
      <channel-select v-model="form.channelId" ch-type="channel" multiple />

      <el-form-item class="form-item" label="误差标准">
        <el-select v-model="form.standard" placeholder="请选择">
          <el-option
            v-for="item in standardOpts"
            :key="item"
            :label="item"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-divider content-position="left">辅助设备</el-divider>
      <el-form-item class="form-item" label="电流量程">
        <el-select v-model="form.iRangeId" placeholder="请选择">
          <el-option
            v-for="item in iRangeOpts"
            :key="item.label"
            :label="item.label"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="form-item" label="电压量程">
        <el-select v-model="form.uRangeId" placeholder="请选择">
          <el-option
            v-for="item in uRangeOpts"
            :key="item.label"
            :label="item.label"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item class="form-item" label="采样时间(s)">
        <el-input v-model="form.sampTime"></el-input>
      </el-form-item>
    </title-box>

    <tool-cal-config v-show="!showRunConfig" v-on="$listeners" />
  </el-form>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
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

@Component({
  components: {
    ToolCalConfig,
    ChannelSelect
  }
})
export default class CalConfig extends Vue {
  @Prop({ type: Boolean, default: true }) showRunConfig!: boolean

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

  toolIpLoading = false

  get config() {
    return SettingStatus.userConfig?.calibrateConfig?.config
  }

  getForm() {
    const form = this.form
    const setError = (msg: string) => {
      this.$message.info(msg)
      return {
        status: false as false,
        form: form as CalibrateT.CalConfForm
      }
    }
    if (!form.toolIp) {
      return setError('请填写工装IP')
    } else if (form.masterId == null) {
      return setError('请选择机柜')
    } else if (form.slaverId == null) {
      return setError('请选择从控')
    } else if (form.channelId.length <= 0) {
      return setError('请选择通道')
    } else if (form.standard == null) {
      return setError('请选择标准误差')
    } else if (form.uRangeId == null) {
      return setError('请选择电压量程')
    } else if (form.uRangeId == null) {
      return setError('请选择电流量程')
    }
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
    if (!this.form.toolIp) {
      this.$message.info('请先填写工装IP')
      return false
    }
    return this.form.toolIp
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

      ::v-deep .el-form-item__label {
        font-size: 13px;
      }
    }
  }
}
</style>
