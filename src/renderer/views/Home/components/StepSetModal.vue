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
        <template slot-scope="{ row }">
          <el-select v-model="row.setId" placeholder="请选择">
            <el-option
              v-for="item in stepsSelectList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
              v-for="item in stepsSelectMap[row.setId].input"
              :key="item"
              class="input-item"
            >
              {{ stepsInputMap[item].name }}：
              <el-input type="text" v-model.number="row[item]" />
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
import { Component, Vue } from 'vue-property-decorator'
import { Port } from '@/types/Port'
import { getPortSelectList, getPortInputList } from '@/renderer/utils/getConfig'

@Component
/** 工步编辑弹框 */
export default class StepSetModal extends Vue {
  list: Port.Item[] = []

  nowPort: Port.Item | null = null
  stepsDialog = false
  stepsList: any[] = []
  stepsSelectList = getPortSelectList()
  stepsSelectMap: any = {}
  stepsInputMap: any = {}
  stepsId = 0

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
    }
  }

  stepsShow(portItem: Port.Item) {
    this.nowPort = portItem
    this.stepsList = []
    this.stepsAdd()
    this.stepsDialog = true
  }

  stepsAdd() {
    const obj: any = {
      id: ++this.stepsId,
      setId: null
    }
    Object.keys(this.stepsInputMap).forEach(key => {
      obj[key] = null
    })
    this.stepsList.push(obj)
  }

  stepsDel(index: number) {
    this.stepsList.splice(index, 1)
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
