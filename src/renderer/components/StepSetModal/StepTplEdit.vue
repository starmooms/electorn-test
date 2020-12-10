<template>
  <div class="tpl-edit">
    <div class="data-save-box">
      <el-divider content-position="left">数据记录条件</el-divider>
      <el-form v-if="dataSave" class="data-save-form" :inline="true">
        <el-form-item
          v-for="item in dataSaveList"
          :key="item.index"
          class="data-save-item"
        >
          <div
            v-if="dataSave[item.type]"
            :class="{ disable: !dataSave[item.type].enable }"
          >
            <el-checkbox v-model="dataSave[item.type].enable" />
            <span class="lable">{{ item.label }}：</span>
            <el-input
              v-model.number="dataSave[item.type].value"
              class="data-save-input"
              :disabled="!dataSave[item.type].enable"
            />
            <span>{{ item.unit }}</span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <div class="data-feat-box">
      <el-divider content-position="left">特征电压参数</el-divider>
      <el-form v-if="features" class="data-feat-form" :inline="true">
        <el-form-item
          v-for="item in featuresList"
          :key="item.type"
          class="feat-form-item"
          :label="item.label"
        >
          <el-input v-model.number="features[item.type]" />
        </el-form-item>
      </el-form>
    </div>

    <div class="steps-edit-box">
      <el-divider content-position="left">工步编辑</el-divider>
      <div class="step-edit-set-box">
        <el-button type="primary" @click="stepsAdd">添加工步</el-button>
        <div v-if="showStartId" class="set-start">
          <span>设置第</span>
          <el-input v-model.number="startId" class="set-start-input" />
          <span>为起始工步</span>
        </div>
      </div>
      <div class="step-list-tabel">
        <el-table :data="stepsList">
          <el-table-column type="index" label="步次" width="50" />
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
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="设置" min-width="400">
            <template v-if="row.input" slot-scope="{ row }">
              <div class="input-box">
                <div
                  v-for="(value, key) in row.input"
                  :key="key"
                  class="input-item"
                >
                  <span class="input-name">
                    {{
                      `${stepsInputMap[key].name}(${stepsInputMap[key].unit})`
                    }}：
                  </span>
                  <el-input v-model.number="row.input[key]" type="text" />
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column width="100" label="操作">
            <template slot-scope="{ $index }">
              <el-button type="text" @click="stepsDel($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div>
      <el-divider content-position="left">保护参数</el-divider>
      <el-form
        v-if="protect"
        class="protect-form"
        :model="protect"
        label-width="200px"
      >
        <el-form-item
          v-for="item in protectList"
          :key="item.index"
          :label="item.name"
        >
          <el-input v-model.number="protect[item.type]" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getStepsOpts, getStepsInputMap } from '@/renderer/utils/getConfig'
import { PROTECT, GET_PROTECT_FORM } from '@/shared/config/port'
import { deepClone } from '@/shared/utils'

const { stepsSelectList, stepsRulseMap } = getStepsOpts()

@Component
export default class StepTplEdit extends Vue {
  @Prop({ type: Boolean, default: true }) showStartId!: boolean

  stepsList: any[] = []
  stepsSelectOpts = stepsSelectList
  stepsRulseMap = stepsRulseMap
  stepsInputMap = getStepsInputMap()
  stepsId = 0

  // 保护参数
  protectList = deepClone(PROTECT)
  protect: any = null

  // 记录条件
  dataSave: any = null
  dataSaveList = [
    {
      label: '时间',
      type: 'time',
      unit: 's'
    },
    {
      label: '电压间隔',
      type: 'U',
      unit: 'mV'
    },
    {
      label: '电流间隔',
      type: 'I',
      unit: 'mA'
    }
  ]

  // 特征电压参数
  features: ipcReq.Features | null = null
  featuresList = [
    { label: '#1(mV)', type: 'v1' },
    { label: '#2(mV)', type: 'v2' },
    { label: '#3(mV)', type: 'v3' },
    { label: '#4(mV)', type: 'v4' },
    { label: '#5(mV)', type: 'v5' }
  ]

  startId = 1

  /** 重置 */
  reset() {
    this.dataSave = {
      time: {
        enable: true,
        value: 1
      },
      U: {
        enable: false,
        value: null
      },
      I: {
        enable: false,
        value: null
      }
    }
    this.features = {
      v1: null,
      v2: null,
      v3: null,
      v4: null,
      v5: null
    }
    this.stepsList = []
    this.protect = GET_PROTECT_FORM()
    this.startId = 1
  }

  /** 添加工步 */
  stepsAdd() {
    const obj: any = {
      id: ++this.stepsId,
      type: '',
      name: '',
      input: {}
    }
    this.stepsList.push(obj)
  }

  /** 删除工步 */
  stepsDel(index: number) {
    this.stepsList.splice(index, 1)
  }

  /** 根据选中的工步生成input */
  createInput(value: any) {
    const input = {}
    value.input.forEach(item => {
      input[item] = null
    })
    return input
  }

  /** 选择工步时 */
  stepItemIdChange(value, row) {
    row.input = this.createInput(value)
    row.type = value.type
    row.name = value.name
  }

  /** 获取工步列表 */
  async getTplData(checkStartId = true) {
    const stepsList: any[] = []
    let msg = ''
    const setError = (msg: string) => {
      this.$message.error(msg)
      return {
        data: null,
        status: false,
        msg
      }
    }

    /** 整理验证工步列表 */
    if (this.stepsList.length <= 0) {
      return setError('工步列表不能为空')
    }
    for (let i = 0; i < this.stepsList.length; i++) {
      const item = this.stepsList[i]
      if (item.name) {
        const hasNull = Object.keys(item.input).find(key => {
          const originVal = item.input[key]
          let val: number | null = Number(originVal)
          if (isNaN(val) || (!originVal && originVal !== 0)) {
            val = null
          }
          item.input[key] = val

          const valNull = val === null
          if (valNull) {
            const rules = this.stepsRulseMap?.[item.type]?.rules
            if (rules && rules.unReqire.includes(key)) {
              return false
            }
          }
          return valNull
        })
        if (hasNull) {
          msg = '工步中有参数未设置'
          break
        } else {
          stepsList.push({
            ...item,
            id: stepsList.length
          })
        }
      }
    }

    if (msg) return setError(msg)
    this.stepsList = stepsList

    /** 获取启动id */
    const startId = this.startId - 1
    if (checkStartId) {
      const maxStart = stepsList.length - 1
      if (!this.startId) {
        return setError('请设置起始工步')
      } else if (!(startId <= maxStart && startId >= 0)) {
        return setError('起始工步应该在当前工步列表范围内')
      }
    }

    return {
      status: true,
      msg,
      data: {
        startId: startId,
        stepsList,
        protect: this.protect,
        dataSave: this.dataSave,
        features: this.features!
      }
    }
  }

  /** 应用工步模板 */
  useTplData(tpl: any) {
    this.reset()
    ;['protect', 'dataSave', 'features'].forEach(key => {
      if (tpl[key]) {
        this[key] = deepClone(tpl[key])
      }
    })
    const selectMap = {}
    this.stepsSelectOpts.forEach(item => {
      selectMap[item.value.type] = this.createInput(item.value)
    })
    this.stepsList = tpl.stepsList.map(step => {
      const item = deepClone(step)
      item.input = {
        ...selectMap[item.type],
        ...item.input
      }
      return item
    })
  }

  mounted() {
    this.reset()
  }
}
</script>

<style lang="scss" scoped>
.tpl-edit {
  .protect-form {
    display: flex;
    flex-flow: row wrap;
  }

  .data-save-box {
    .data-save-item {
      margin-right: 32px;

      .disable {
        color: #adadad;
      }

      .lable {
        margin-left: 10px;
      }

      .data-save-input {
        width: 80px;
        margin-right: 4px;
      }
    }
  }

  .steps-edit-box {
    // margin: 20px 0;
    .step-edit-set-box {
      display: flex;
      margin: 10px 0;

      .set-start {
        margin-left: 10px;

        .set-start-input {
          display: inline;
          margin: 0 6px;

          ::v-deep .el-input__inner {
            width: 36px;
            padding: 0 4px;
          }
        }
      }
    }
  }

  .data-feat-box {
    .data-feat-form {
      display: flex;

      .feat-form-item {
        margin-right: 14px;
      }

      ::v-deep {
        .el-form-item__content {
          width: 80px;
        }
      }
    }
  }

  .step-list-tabel {
    background-color: #f5f7fa;

    ::v-deep {
      .el-table td,
      .el-table th {
        vertical-align: top;
      }

      .el-table,
      .el-table tr,
      .el-table th,
      .el-table--enable-row-transition .el-table__body td {
        background-color: transparent;
      }
    }

    .input-box {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      margin-bottom: -10px;

      .input-item {
        flex: 0 0 33.33%;
        margin-bottom: 10px;

        .input-name {
          display: inline-block;
          width: 90px;
          text-align: right;
        }
        // &:nth-last-child(-n + 3) {
        //   margin-bottom: 0;
        // }
        .el-input {
          width: 74px;
        }
      }
    }
  }
}

// .el-table__expanded-cell,
// .el-table .cell {
//   background-color: transparent;
// }
</style>
