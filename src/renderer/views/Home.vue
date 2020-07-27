<template>
  <div class="home">
    <ul>
      <li v-for="(item, index) in list" :key="index">
        {{ item.path }}
        <el-button @click="openPort(item)">打开串口</el-button>
        <span style="display:inline-block;">
          <el-input v-model.trim="item.value" />
        </span>
        <el-button @click="sendData(item)">发送消息</el-button>
      </li>
    </ul>
    <button @click="to">跳转</button>
    <pre v-html="pre"></pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class Home extends Vue {
  list: any[] = []

  pre = '33433'

  to() {
    this.$router.push({
      name: 'About'
    })
  }

  sendData(device: any) {
    ipcRenderer
      .invoke('writePort', {
        path: device.path,
        data: device.value
      })
      .then((data: any) => {
        this.pre += `${data}\n`
      })
      .catch(err => {
        console.log(err)
        this.$message.error(err.message)
      })
  }

  openPort(device: any) {
    ipcRenderer.send('createdWin', {
      type: 'portWin',
      path: device.path
    })
  }

  mounted() {
    console.log(this.$route)
    console.log(this.$router)
    ipcRenderer.on('usbData', (event, data) => {
      if (data) {
        if (data.type === 'list') {
          console.log(data)
          this.list = data.list.map((device: any) => {
            device.value = ''
            return device
          })
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
