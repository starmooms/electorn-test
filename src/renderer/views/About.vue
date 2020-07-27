<template>
  <div class="about" v-if="port">
    <h1>{{ port.path }}</h1>
    <input type="text" @keyup.enter="sendMsg" v-model.trim="value" />
    <el-button @click="sendMsg">发送消息</el-button>
    <pre>
      {{ pre }}
    </pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class About extends Vue {
  pre = 'start'
  port: { path: string } | null = null
  value = ''
  path = ''

  async getPort() {
    if (this.path) {
      this.port = await ipcRenderer.invoke(`getPort:${this.path}`)
      ipcRenderer.on(`portData:${this.path}`, (event, data) => {
        this.pre += data
      })
    }
    console.log(this.port)
  }

  sendMsg() {
    if (this.path && this.value) {
      ipcRenderer.send(`write:${this.path}`, this.value)
    }
  }

  mounted() {
    // console.log('??')
    this.path = this.$route.params.path
    if (this.path) {
      this.getPort()
    } else {
      this.$message.error('缺少PATH')
    }

    // ipcRenderer.send('usbDetection', true)
  }
}
</script>
