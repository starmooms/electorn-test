<template>
  <TitleBox size="mini" name="工装校准">
    <el-form :model="form" class="demo-form-inline" label-width="80px">
      <el-form-item label="校准类型">
        <el-select v-model="form.calType" placeholder="请选择校准类型">
          <el-option
            v-for="item in calTypeList"
            :key="item.type"
            :value="item.type"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="电流范围">
        <el-select v-model="form.iRange" placeholder="请选择电流范围">
          <el-option
            v-for="item in iRangeList"
            :key="item.id"
            :value="item.id"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="电压范围">
        <el-select v-model="form.uRange" placeholder="请选择电压范围">
          <el-option
            v-for="item in uRangeList"
            :key="item.id"
            :value="item.id"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <ChannelSelect
        v-model="form.channel"
        ch-type="channel"
        :multiple="true"
      />
    </el-form>
    <div>
      <el-button type="primary" @click="start">开始校准</el-button>
    </div>
  </TitleBox>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import {
  CALIBRATE_TYPE,
  I_TOOL_RANGE_OPTS,
  U_TOOL_RANGE_OPTS
} from '@/shared/config/calibrate'
import { deepClone } from '@/shared/utils'
import { sortForNumber } from '@/renderer/utils/util'
import ChannelSelect from '../ChannelSelect.vue'

@Component({
  components: {
    ChannelSelect
  }
})
export default class ToolCalConfig extends Vue {
  form = {
    calType: null as null | string,
    iRange: null,
    uRange: null,
    channel: []
  }
  claType = []
  calTypeList = deepClone(CALIBRATE_TYPE)
  uRangeList = deepClone(U_TOOL_RANGE_OPTS)
  iRangeList = deepClone(I_TOOL_RANGE_OPTS)

  get selectType() {
    return this.form.calType
      ? this.calTypeList.find(item => item.type === this.form.calType)
      : null
  }

  get selectRangeType() {
    return this.selectType ? this.selectType.rangeType : null
  }

  start() {
    if (!this.selectType || !this.selectRangeType) {
      return this.$message.error('请选选择校准类型')
    } else if (this.form.channel.length === 0) {
      return this.$message.error('请选选择校准通道')
    }

    const rangeType = this.selectRangeType
    const key = rangeType === 'A' ? 'i' : 'u'
    const name = rangeType === 'A' ? '电流' : '电压'
    const rangeId = this.form[`${key}Range`] as number
    if (rangeId === null) {
      return this.$message.error(`未选择${name}范围`)
    }
    const rangeItem = this[`${key}RangeList`].find(item => item.id === rangeId)
    if (!rangeItem) {
      return this.$message.error(`rangeId ${rangeId} undefined`)
    }
    this.$emit('toolCalStart', {
      selectType: this.selectType,
      selectRange: rangeItem,
      channelIds: sortForNumber(this.form.channel).slice()
    })
  }
}
</script>
