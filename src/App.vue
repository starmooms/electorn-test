<template>
  <div id="app">
    <el-dialog title="更新弹框" :visible.sync="dialogVisible" width="30%">
      <p>{{tips}}</p>
      <p>更新进度 {{downloadPercent}}</p>
    </el-dialog>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "App",
  data() {
    return {
      downloadPercent: 0,
      tips: "",
      dialogVisible: false
    };
  },
  components: {},
  mounted() {
    ipcRenderer.on("message", (event, text) => {
      console.log(arguments, text);
      if (text === "startUpdate") {
        this.dialogVisible = true;
        this.tips = "检测到新版本，正在下载……";
      } else if (text === "noUpdate") {
        this.$message("现在使用的就是最新版本，不用更新");
      } else {
        this.tips = text;
      }
    });
    ipcRenderer.on("downloadProgress", (event, progressObj) => {
      console.log(progressObj);
      this.downloadPercent = progressObj.percent || 0;
    });
    ipcRenderer.on("isUpdateNow", () => {
      ipcRenderer.send("isUpdateNow");
    });
  },
  destroyed() {
    ipcRenderer.removeAll(["message", "downloadProgress", "isUpdateNow"]);
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
