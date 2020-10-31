<template>
  <el-form class="cal-config-box" label-width="80px">
    <title-box class="config-item" size="mini" name="工装设置">
      <el-form-item class="form-item" label="工装IP">
        <el-input v-model="form.toolIp"></el-input>
      </el-form-item>
      <!-- <div>
        <template v-if="deviceEdit.edit">
          <el-button type="primary" @click="deviceIpEditSave">
            保持
          </el-button>
          <el-button @click="deviceIpEditCanncel">取消</el-button>
        </template>
        <el-button v-else type="primary" @click="deviceIpEditSet">
          编辑
        </el-button>
      </div> -->
    </title-box>
    <title-box class="config-item" size="mini" name="设备">
      <el-form-item class="form-item" label="机柜">
        <el-select v-model="form.masterId" placeholder="请选择">
          <el-option
            v-for="item in channelList.master"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="form-item" label="丛控">
        <el-select v-model="form.slaverId" placeholder="请选择">
          <el-option
            v-for="item in channelList.slaver"
            :key="item.value"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item class="form-item" label="通道">
        <el-select
          v-model="form.channelId"
          multiple
          collapse-tags
          placeholder="请选择"
        >
          <el-option
            v-for="item in channelList.channel"
            :key="item.value"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>

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
    </title-box>
  </el-form>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { getStaticChList } from '@/shared/config/channel'
import {
  I_RANGE_OPTS,
  STANDARD_OPTS,
  U_RANGE_OPTS
} from '@/shared/config/calibrate'

@Component({})
export default class CalConfig extends Vue {
  form: CalibrateT.CalConfForm = {
    toolIp: '',
    masterId: null,
    slaverId: null,
    channelId: [],
    standard: null,
    uRangeId: 0,
    iRangeId: null
  }

  channelList = getStaticChList()
  standardOpts = STANDARD_OPTS
  uRangeOpts = U_RANGE_OPTS
  iRangeOpts = I_RANGE_OPTS

  // deviceEdit = {
  //   edit: false,
  //   deviceIp: this.form.deviceIp,
  //   last: this.form.deviceIp
  // }

  // /** 工装ip编辑打开、关闭 */
  // deviceIpEditSet() {
  //   const status = !this.deviceEdit.edit
  //   this.deviceEdit.edit = status
  // }

  // /** 工装ip取消编辑 */
  // deviceIpEditCanncel() {
  //   this.deviceEdit.deviceIp = this.deviceEdit.last
  //   this.deviceIpEditSet()
  // }

  // /** 工装ip保存编辑 */
  // deviceIpEditSave() {
  //   this.deviceEdit.last = this.deviceEdit.deviceIp
  //   this.deviceIpEditSet()
  // }

  mounted() {
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
  width: 300px;
  .config-item {
    width: 100%;
    .form-item {
      &:last-of-type {
        margin: 0;
      }
    }
  }
}
</style>
