<template>
  <div>
    <el-dialog
      title="添加机柜"
      width="420px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <el-form
        class="config-box"
        ref="addMasterForm"
        label-width="80px"
        :model="form"
        :rules="rules"
      >
        <el-form-item label="机柜号" prop="masterId">
          <el-input v-model.number="form.masterId"></el-input>
        </el-form-item>
        <el-form-item label="IP" prop="ip">
          <el-input v-model.trim="form.ip"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addMasterClose">取 消</el-button>
        <el-button type="primary" @click="addMasterSubmit">确定</el-button>
      </div>
    </el-dialog>
    <!-- <ip-config :show.sync="ipShow" /> -->
  </div>
</template>

<script lang="ts">
import { Form } from 'element-ui'
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'

@Component
export default class AddMasterDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean
  @Prop({ required: false })
  private editMaster!: TcpRequestT.IpItem

  @Prop({ type: Array, required: true })
  ipList!: TcpRequestT.IpItem[]

  $refs!: {
    addMasterForm: Form
  }

  form = {
    masterId: null as number | null,
    ip: null as string | null
  }

  rules = {
    masterId: [
      { required: true, type: 'number', message: '机柜号应为非空数字' },
      {
        validator: (rule: any, value: number, callback: any) => {
          const masterId = value - 1
          if (masterId < 0 || Math.floor(masterId) !== masterId) {
            callback(new Error('该机柜号应该为大于1的整数'))
            return
          }
          if (this.editMaster && this.editMaster.masterId !== masterId) {
            const has = this.ipList.find(item => {
              return masterId === item.masterId
            })
            if (has) {
              callback(new Error('该机柜号已存在'))
              return
            }
          }
          callback()
        }
      }
    ],
    ip: [
      { required: true, type: 'string', message: 'ip不能为空' },
      {
        validator: (rule: any, value: string, callback: any) => {
          const reg = /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/
          if (!reg.test(value)) {
            callback(new Error('IP格式错误'))
            return
          }
          callback()
        }
      }
    ]
  }

  @Watch('dialog')
  changeDialog(v: boolean) {
    if (v === true) {
      this.reset()
      if (this.editMaster) {
        this.form = {
          masterId: this.editMaster.masterId + 1,
          ip: this.editMaster.ip
        }
      }
    }
  }

  /** 重置 */
  reset() {
    this.$refs.addMasterForm.resetFields()
  }

  addMasterClose() {
    this.dialog = false
  }

  addMasterSubmit() {
    this.$refs.addMasterForm.validate(valid => {
      if (valid) {
        this.addMasterClose()
        const submit = {
          ip: this.form.ip,
          masterId: this.form.masterId! - 1
        }
        if (this.editMaster) {
          this.$emit('saveAdd', submit)
          return
        }
        this.$emit('saveEdit', submit)
      }
    })
  }
}
</script>
