<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class Home extends Vue {
  list: any[] = []

  pre = '33433'
  port: any = null

  async getPort() {
    this.port = await ipcRenderer.invoke('getPort')
    console.log(this.port)
  }

  mounted() {
    console.log('??')
    console.log(this.$route.params.path)
    this.getPort()
    // ipcRenderer.on('data', (event, data) => {
    //   if (data) {
    //     if (data.type === 'list') {
    //       console.log(data)
    //       this.list = data.list.map((device: any) => {
    //         device.value = ''
    //         return device
    //       })
    //     }
    //   }
    // })
    // ipcRenderer.send('usbDetection', true)
  }
}
</script>
