<template>
  <div>
    <el-divider content-position="left">机柜升级</el-divider>
    <update-form :upgrade-type="1" @submit="submit" />
    <el-divider content-position="left">丛控升级</el-divider>
    <update-form :upgrade-type="2" @submit="submit" />
    <update-dialog
      :show.sync="updateShow"
      :title="updateName"
      :master-info="updateMasterInfo"
      :percent="updatePercent"
    />
  </div>
</template>
<script lang="ts">
import { ChannelStatus } from '@/renderer/store/modules/Channel'
import { Vue, Component } from 'vue-property-decorator'
import { upgradeStart } from '@/renderer/ipc/channel'
import UpdateDialog from './components/UpdateDialog.vue'
import UpdateForm from './components/UpdateForm.vue'

@Component({
  components: {
    UpdateDialog,
    UpdateForm
  }
})
export default class Upgrade extends Vue {
  updateShow = false
  updateType = 0
  updateMasterInfo = ''

  info: any = null

  get updatePercent() {
    return this.info ? Math.floor(this.info.percent * 100) : 0
  }

  get staticMaster() {
    return ChannelStatus.staticChList.master
  }

  get updateName() {
    return this.updateType === 1
      ? '机柜升级'
      : this.updateType === 2
      ? '丛控升级'
      : ''
  }

  async submit(params: ipcReq.UpgradeForm) {
    const result = await upgradeStart(params)
    if (result.status) {
      if (this.info) {
        this.info.percent = 0
      }
      this.updateMasterInfo = params.masterIds.map(i => i + 1).join('、')
      this.openUpgradeDialog(params.upgradeType)
    }
  }

  openUpgradeDialog(upgradeType: number) {
    this.updateType = upgradeType
    this.updateShow = true
  }

  closeAfterMessage(
    type: 'success' | 'warning' | 'info' | 'error',
    msg: string
  ) {
    setTimeout(() => {
      this.$elConfirm(msg, {
        type,
        showCancelButton: false
      }).finally(() => {
        this.updateShow = false
      })
    })
  }

  /** 接收消息 */
  onSend() {
    this.$command.on({
      eventName: '/boxUpdate/updateInfo',
      onEmit: data => {
        this.info = data.info

        if (data.type === 'success') {
          this.closeAfterMessage('success', `${this.updateName} 成功`)
        } else if (data.type === 'error') {
          this.closeAfterMessage('error', data.data)
        }

        if (!this.updateShow && this.info && this.info.isRun) {
          this.openUpgradeDialog(this.info.upgradeType)
        }
      },
      vm: this
    })
  }

  mounted() {
    this.onSend()
  }
}
</script>
<style lang="scss" scoped>
.limt-form-item {
  width: 420px;
}

.select-master {
  width: 246px;
}
</style>
