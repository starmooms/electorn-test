<template>
  <div id="app">
    <div id="nav">
      <h1>Electron TEST</h1>
      <el-dialog title="更新弹框" :visible.sync="dialogVisible" width="30%">
        <p>{{ tips }}</p>
        <p>更新进度 {{ downloadPercent }}</p>
      </el-dialog>
    </div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { ipcMain, ipcRenderer } from "electron";

@Component
export default class App extends Vue {
  dialogVisible = false;
  tips = "";
  downloadPercent = 0;

  mounted() {
    ipcRenderer.on("updateMsg", (event, text) => {
      if (text === "startUpdate") {
        this.dialogVisible = true;
        this.tips = "检测到新版本，正在下载……";
      } else if (text === "noUpdate") {
        this.$message("现在使用的就是最新版本");
      } else {
        this.tips = text;
      }
    });

    ipcRenderer.on("updateError", (event, msg) => {
      this.$message.error(msg);
    });

    ipcRenderer.on("downloadProgress", (event, progressObj) => {
      this.downloadPercent = progressObj.percent || 0;
    });

    ipcRenderer.on("downloaded", () => {
      ipcRenderer.send("isUpdateNow", "isUpdateNow");
    });
  }

  destroy() {
    ["message", "downloadProgress", "isUpdateNow"].forEach(item => {
      ipcRenderer.removeAllListeners(item);
    });
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}
</style>
