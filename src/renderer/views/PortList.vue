<template>
  <div class="home">
    <el-table :data="list" stripe border style="width: 100%">
      <el-table-column
        prop="path"
        label="串口"
        min-width="200"
      ></el-table-column>
      <el-table-column fixed="right" label="操作" width="200">
        <template slot-scope="{ row }">
          <!-- <el-button @click="openPort(scope.row)" type="text">
            打开串口
          </el-button> -->
          <el-button type="text" @click="nowStepShow(row)">
            查看当前工步
          </el-button>
          <el-button type="text" @click="stepsShow">
            编辑工步
          </el-button>
        </template>
      </el-table-column>
      <!-- <el-table-column prop="name" label="姓名" width="180"></el-table-column>
      <el-table-column prop="address" label="地址"></el-table-column> -->
    </el-table>

    <el-dialog
      title="编辑工步"
      custom-class="stepsAdd-dialog"
      :close-on-click-modal="false"
      :visible.sync="stepsDialog"
    >
      <el-button type="text" @click="stepsAdd">添加工步</el-button>

      <el-table :data="stepsList" height="40vh">
        <el-table-column type="index" label="步次" width="50"></el-table-column>
        <el-table-column label="工步类型" min-width="150">
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
        <el-table-column
          width="100"
          v-for="item in setsInputList"
          :key="item.keys"
          :label="item.name"
        >
          <template slot-scope="{ row }">
            <div>
              <el-input
                type="text"
                v-model.number="row[item.key]"
                :disabled="
                  stepsSelectInput[row.setId]
                    ? !stepsSelectInput[row.setId].includes(item.key)
                    : true
                "
              />
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
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class PortList extends Vue {
  list: any[] = []

  // 1
  setsInputList = [
    { name: '时间(秒)', key: 'time' },
    { name: '电压(mV)', key: 'U' },
    { name: '电流(mA)', key: 'I' },
    { name: '功率(W)', key: 'P' },
    { name: '电阻(mΩ)', key: 'M' }
  ]
  stepsDialog = false
  stepsList: any[] = []
  stepsSelectList: any[] = []
  stepsSelectInput: any = {
    ICi: ['U', 'I']
  }
  stepsId = 0

  nowStepShow(portItem: any) {
    this.$command.send('/createdWin/port/workerSee', {
      path: portItem.path
    })
  }

  stepsSave() {
    const list = this.stepsList.filter(item => {
      if (item.setId) {
        const input = this.stepsSelectInput[item.setId]
        if (input.length > 0) {
          const hasNull = input.find(i => !item[i])
          return !hasNull
        }
      }
      return false
    })
    if (list.length === 0) {
      this.$message.error('请正确设置工步')
    }
    this.$message.info(JSON.stringify(list))
  }

  stepsShow() {
    this.stepsList = []
    this.stepsAdd()
    this.stepsDialog = true
  }

  stepsAdd() {
    const obj: any = {
      id: ++this.stepsId,
      setId: null
    }
    this.setsInputList.forEach(item => {
      return (obj[item.key] = null)
    })
    this.stepsList.push(obj)
  }

  stepsDel(index: number) {
    console.log(index)
    this.stepsList.splice(index, 1)
  }

  openPort(device: any) {
    ipcRenderer.send('createdWin', {
      type: 'portWin',
      path: '/a' + device.path
    })
  }

  async getStepsList() {
    const data = await this.$command.invoke('/port/setpsList')
    if (data.status) {
      this.stepsSelectList = data.data
      const obj: any = {}
      this.stepsSelectList.forEach(item => {
        obj[item.value] = item.input
      })
      this.stepsSelectInput = obj
      console.log(this.stepsSelectInput)
    }
  }

  mounted() {
    this.$command.register({
      eventName: 'usbData',
      onEmit: data => {
        if (data) {
          if (data.type === 'list') {
            this.list = data.list
          }
        }
      },
      vm: this
    })
    this.$command.send('usbDetection', true)
    this.getStepsList()
  }

  beforeDestroy() {
    this.$command.send('usbDetection', false)
  }
}
</script>

<style lang="scss">
.stepsAdd-dialog {
  min-width: 900px;
}
</style>
