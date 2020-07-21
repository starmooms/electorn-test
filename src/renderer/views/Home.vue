<template>
  <div class="home">
    <ul>
      <li v-for="item in list">
        {{item.path}}
        <span style="display:inline-block;">
          <el-input v-model.trim="item.value" />
        </span>
        <el-button @click="sendData(item)">发送消息</el-button>
      </li>
    </ul>
    <pre v-html="pre"></pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { ipcRenderer } from "electron";

@Component
export default class Home extends Vue {
  list: any[] = [];

  pre = "334";

  sendData(device: any) {
    ipcRenderer
      .invoke("writePort", {
        path: device.path,
        data: device.value
      })
      .then((data: any) => {
        this.pre += `${data}\n`;
      })
      .catch(err => {
        console.log(err);
        this.$message.error(err.message);
      });
  }

  mounted() {
    let i = 1;
    ipcRenderer.on("usbData", (event, data) => {
      console.log(data, i, "===>");
      i += 1;
      console.log(data);
      if (data) {
        if (data.type === "list") {
          this.list = data.list.map((device: any) => {
            device.value = "";
            return device;
          });
        }
      }
    });
    ipcRenderer.send("usbDetection", true);
  }

  destroy() {
    ipcRenderer.send("usbDetection", false);
  }
}
</script>
