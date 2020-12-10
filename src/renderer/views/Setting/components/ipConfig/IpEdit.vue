<template>
  <div>
    <el-dialog
      :title="editMaster ? '编辑机柜' : '添加机柜'"
      width="420px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <!-- 添加ip -->
      <el-form
        v-if="!editMaster"
        ref="addIpForm"
        class="config-box"
        label-width="80px"
        :model="addForm"
        :rules="rules"
      >
        <el-form-item label="机柜号" prop="masterId">
          <el-input v-model.number="addForm.masterId" />
        </el-form-item>
        <el-form-item label="IP" prop="ip">
          <el-input v-model.trim="addForm.ip" />
        </el-form-item>
      </el-form>

      <!-- 编辑机柜 -->
      <el-form
        v-else
        ref="editForm"
        class="config-box"
        label-width="80px"
        :model="editForm"
        :rules="editRules"
      >
        <el-form-item label="IP" prop="ip">
          <el-input v-model.trim="editForm.ip" />
        </el-form-item>
        <el-form-item label="掩码" prop="mask">
          <el-input v-model.trim="editForm.mask" />
        </el-form-item>
        <el-form-item label="网关" prop="gateway">
          <el-input v-model.trim="editForm.gateway" />
        </el-form-item>
      </el-form>

      <div slot="footer">
        <el-button @click="close">取 消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </div>
    </el-dialog>
    <!-- <ip-config :show.sync="ipShow" /> -->
  </div>
</template>

<script lang="ts">
import { deepClone } from '@/shared/utils'
import { Form } from 'element-ui'
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'

const getIpRule = (name = 'IP') => {
  return [
    { required: true, type: 'string', message: `${name}不能为空` },
    {
      validator: (rule: any, value: string, callback: any) => {
        const reg = /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/
        if (!reg.test(value)) {
          callback(new Error(`${name}格式错误`))
          return
        }
        callback()
      }
    }
  ]
}

@Component
export default class IpEdit extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean
  @Prop({ required: false })
  private editMaster!: IpConfigT.IpTcpItem

  @Prop({ type: Array, required: true })
  ipList!: IpConfigT.IpTcpItem[]

  $refs!: {
    addIpForm: Form
    editForm: Form
  }

  addForm = {
    masterId: null as number | null,
    ip: null as string | null
  }

  editForm = {
    ip: null as string | null,
    mask: null as string | null,
    gateway: null as string | null
  }

  rules = {
    masterId: [
      { required: true, type: 'number', message: '机柜号应为非空数字' },
      {
        validator: (rule: any, value: number, callback: any) => {
          const masterId = value - 1
          console.log(this.editMaster)
          if (masterId < 0 || Math.floor(masterId) !== masterId) {
            callback(new Error('该机柜号应该为大于1的整数'))
            return
          }
          if (
            this.editMaster == null ||
            this.editMaster.masterId !== masterId
          ) {
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
    ip: getIpRule()
  }

  editRules = {
    ip: getIpRule(),
    mask: getIpRule('掩码'),
    gateway: getIpRule('网关')
  }

  @Watch('dialog')
  changeDialog(v: boolean) {
    if (v === true) {
      this.reset()
      if (this.editMaster) {
        ;['mask', 'gateway', 'ip'].forEach(key => {
          this.$set(this.editForm, key, this.editMaster.masterInfo[key])
        })
      }
    }
  }

  /** 重置 */
  reset() {
    if (this.$refs.addIpForm) {
      this.$refs.addIpForm.resetFields()
    }
  }

  /** 关闭弹框 */
  close() {
    this.dialog = false
  }

  /** 提交 */
  submit() {
    if (this.editMaster) {
      this.$refs.editForm.validate(valid => {
        if (valid) {
          const submit = deepClone(this.editForm)
          this.$emit('saveEdit', submit)
          this.close()
        }
      })
    } else {
      this.$refs.addIpForm.validate(valid => {
        if (valid) {
          const submit = deepClone(this.addForm)
          submit.masterId = submit.masterId! - 1
          this.$emit('saveAdd', submit)
          this.close()
        }
      })
    }
  }
}
</script>
