<template>
  <div class="set-channel">
    <el-dialog
      title="提示"
      :show-close="false"
      :visible.sync="show"
      width="400px"
    >
      <el-form :inline="true">
        <el-form-item v-if="isSingle" label="选择开始工步">
          <el-select
            v-model="startId"
            class="step-select"
            placeholder="请选择工步"
            width="400"
          >
            <el-option
              v-for="item in stepList"
              :key="item.id"
              :label="item.msg"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-else>
          <el-form-item label="请填写开始工步id">
            <el-input
              v-model.number="startId"
              placeholder="开始工步id"
            ></el-input>
          </el-form-item>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="close">取 消</el-button>
        <el-button type="primary" @click="setStart">
          确 定
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { getWorkStep, setChannelStatus } from '@/renderer/ipc/channel'
import { stepListSimple } from '@/renderer/utils/util'

@Component({
  name: 'SetChannelStatus'
})
export default class SetChannelStatus extends Vue {
  show = false
  isSingle = false
  startId: null | number = null
  stepList: {
    id: number
    msg: string
  }[] = []
  params!: ipcReq.SetStatus | null

  open(params, isSingle = false) {
    this.params = params
    this.isSingle = isSingle
    this.startId = null
    this.show = true
  }

  close() {
    this.show = false
    this.isSingle = false
    this.params = null
    this.stepList = []
  }

  async setStart() {
    if (this.startId === null) {
      const msg = this.isSingle ? '请先选择开始工步' : '请先填写工步id'
      return this.$message.error(msg)
    }

    let startId = Number(this.startId)
    if (this.isSingle !== true) {
      if (!(startId >= 1)) {
        this.startId = null
        return this.$message.error('请填写正确的工步id')
      }
      startId = startId - 1
    }

    await this.setStatus({
      ...this.params,
      startId: startId
    })
  }

  /** 发送通道状态 */
  private async setStatus(params: any) {
    setChannelStatus(params)
    this.close()
    this.$emit('openSysLog')
    // const data = await setChannelStatus(params)
    // if (data.status) {
    //   Vue.prototype.$message.success(`成功`)
    //   this.close()
    // }
  }

  async changeStatus(data: any) {
    const { params, isSingle } = data
    if (params.status === 'start') {
      if (isSingle) {
        const { masterId, slaverId, channelId } = params
        const getStepData = await getWorkStep({
          // path: params.path,
          masterId: masterId,
          slaverId: slaverId,
          channelId: [channelId]
        })
        if (!getStepData.status) return
        const stepData = getStepData.data.stepData[channelId]
        const { stepList } = stepListSimple(stepData)
        if (stepList.length <= 0) {
          this.$message.error(
            `${masterId + 1}-${slaverId + 1}-${channelId + 1}工步不存在`
          )
          return
        }
        this.stepList = stepList
        this.open(params, true)
      } else {
        this.open(params, false)
      }
    } else {
      this.setStatus(params)
    }
  }
}
</script>

<style lang="scss" scoped>
.set-channel {
  min-width: 360px;

  .step-select {
    width: 190px;
  }
}
</style>
