<template>
  <div class="home">
    <el-table :data="list" stripe border style="width: 100%">
      <el-table-column prop="path" label="串口"></el-table-column>
      <el-table-column fixed="right" label="操作" width="200">
        <template slot-scope="scope">
          <el-button @click="openPort(scope.row)" type="text">
            打开串口
          </el-button>
          <el-button type="text" @click="stepsShow(scope.row)">
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

      <el-table :data="stepsList">
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
        <el-table-column label="恒流(mA)" width="200">
          <template slot-scope="{ row }">
            <input type="text" v-model.number="row.current" />
          </template>
        </el-table-column>
        <el-table-column label="恒压(mV)" width="200">
          <template slot-scope="{ row }">
            <input type="text" v-model.number="row.voltage" />
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
    <div style="height:900px;"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class Home extends Vue {
  list: any[] = []

  a = ''
  stepsDialog = false
  stepsList: any[] = []
  stepsSelectList = [
    {
      label: '恒流充电',
      value: 0
    },
    {
      label: '恒压充电',
      value: 1
    }
  ]
  stepsId = 0

  // sendData(device: any) {
  //   ipcRenderer
  //     .invoke('writePort', {
  //       path: device.path,
  //       data: device.value
  //     })
  //     .then((data: any) => {
  //       this.pre += `${data}\n`
  //     })
  //     .catch(err => {
  //       console.log(err)
  //       this.$message.error(err.message)
  //     })
  // }

  stepsSave() {
    const list = this.stepsList.filter(item => {
      return item.setId != null && (item.current || item.voltage)
    })
    if (list.length === 0) {
      this.$message.error('请正确设置工步')
    }
    this.$message.info(JSON.stringify(list))
  }

  stepsShow() {
    this.stepsListCreated()
    this.stepsDialog = true
  }

  stepsAdd() {
    this.stepsList.push({
      id: ++this.stepsId,
      voltage: null,
      current: null,
      setId: null
    })
  }

  stepsListCreated() {
    this.stepsList = []
    let i = 0
    while (i < 8) {
      ++i
      this.stepsAdd()
    }
  }

  openPort(device: any) {
    ipcRenderer.send('createdWin', {
      type: 'portWin',
      path: device.path
    })
  }

  mounted() {
    ipcRenderer.on('usbData', (event, data) => {
      if (data) {
        if (data.type === 'list') {
          console.log(data)
          this.list = data.list
        }
      }
    })
    ipcRenderer.send('usbDetection', true)
  }

  destroy() {
    ipcRenderer.send('usbDetection', false)
  }
}
</script>

<style lang="scss">
.stepsAdd-dialog {
  min-width: 800px;
}
</style>
