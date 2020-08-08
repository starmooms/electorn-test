<template>
  <el-dialog
    title="编辑工步"
    custom-class="steps-add-dialog"
    :close-on-click-modal="false"
    :visible.sync="stepsDialog"
  >
    <el-button type="text" @click="stepsAdd">添加工步</el-button>

    <el-table :data="stepsList" height="40vh">
      <el-table-column type="index" label="步次" width="50"></el-table-column>
      <el-table-column label="工步类型" width="150">
        <template slot-scope="{ row, $index }">
          <el-select
            v-model="row.setId"
            placeholder="请选择"
            @change="stepItemIdChange($event, row, $index)"
          >
            <el-option
              v-for="item in stepsSelectList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.value === 'loop' && hasLoop"
            ></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="设置" min-width="400">
        <template
          slot-scope="{ row }"
          v-if="row.setId && stepsSelectMap[row.setId]"
        >
          <div class="input-box">
            <div
              v-for="inputType in stepsSelectMap[row.setId].input"
              :key="inputType"
              class="input-item"
            >
              {{ stepsInputMap[inputType].name }}：
              <el-input type="text" v-model.number="row[inputType]" />
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column width="100" label="操作">
        <template slot-scope="{ $index }">
          <el-button type="text" @click="stepsDel($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div slot="footer">
      <el-button @click="stepsDialog = false">取 消</el-button>
      <el-button type="primary" @click="stepsSave">
        确 定
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'
import { Port } from '@/types/Port'
import { getPortSelectList, getPortInputList } from '@/renderer/utils/getConfig'

@Component
export default class StepSetModal extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private stepsDialog!: boolean

  @Prop({ type: Object }) private nowPort!: Port.Item | null

  list: Port.Item[] = []

  // nowPort: Port.Item | null = null
  // stepsDialog = false
  stepsList: any[] = []
  stepsSelectList = getPortSelectList()
  stepsSelectMap: any = {}
  stepsInputMap: any = {}
  stepsId = 0

  get hasLoop() {
    return this.stepsList.find((item: any) => item.setId === 'loop')
      ? true
      : false
  }

  nowStepShow(portItem: any) {
    this.$command.send('/createdWin/port/workerSee', {
      path: portItem.path
    })
  }

  stepsSave() {
    if (this.nowPort) {
      const list = this.stepsList.filter(item => {
        if (item.setId) {
          const input = this.stepsSelectMap[item.setId].input
          if (input.length > 0) {
            const hasNull = input.find(i => !item[i])
            return !hasNull
          }
        }
        return false
      })
      if (list.length === 0) {
        this.$message.error('请正确设置工步')
        return
      }
      this.$message.info(JSON.stringify(list))
      this.$command.send('/port/writeWorkSteps', {
        path: this.nowPort.path,
        list
      })
    } else {
      this.$message.error('缺少串口')
    }
  }

  @Watch('stepsDialog')
  stepsDialogChange(v) {
    if (v === true) {
      this.stepsList = []
      this.stepsAdd()
    }
  }

  // @Watch('asyncShow')
  // asyncShowChange(v: boolean) {
  //   if (v) {
  //     this.stepsDialog = true
  //   }
  // }

  stepsAdd() {
    const obj: any = {
      id: ++this.stepsId,
      setId: null
    }
    Object.keys(this.stepsInputMap).forEach(key => {
      obj[key] = null
    })
    if (this.hasLoop) {
      this.stepsList.splice(this.stepsList.length - 1, 0, obj)
    } else {
      this.stepsList.push(obj)
    }
  }

  stepsDel(index: number) {
    this.stepsList.splice(index, 1)
  }

  stepItemIdChange(value, row, index) {
    const lastIndex = this.stepsList.length - 1
    if (value === 'loop' && index !== lastIndex) {
      this.stepsList.splice(index, 1)
      this.stepsList.push(row)
    }
  }

  getStepsList() {
    const obj: any = {}
    this.stepsSelectList.forEach(item => {
      obj[item.value] = {
        input: item.input
      }
    })
    this.stepsSelectMap = obj
    const inputAttr = getPortInputList()
    this.stepsInputMap = inputAttr.inputList
  }

  mounted() {
    this.getStepsList()
  }
}
</script>

<style lang="scss">
.steps-add-dialog {
  min-width: 900px;
  .input-box {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    .input-item {
      flex: 0 0 33.33%;
      margin: 10px 0;
      .el-input {
        width: 108px;
      }
    }
  }
}
</style>
