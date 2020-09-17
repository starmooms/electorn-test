<template>
  <el-button class="select-directory" @click.stop="onFolderClick">
    <svg-icon icon-class="filedir"></svg-icon>
  </el-button>
</template>

<script lang="ts">
import { remote } from 'electron'
import { Component, Vue, Model } from 'vue-property-decorator'

@Component
export default class FileSelect extends Vue {
  @Model('change', { type: String }) readonly path!: string

  onFolderClick() {
    remote.dialog
      .showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
      })
      .then(({ canceled, filePaths }) => {
        if (canceled || filePaths.length === 0) {
          return
        }
        const [path] = filePaths
        this.$emit('change', path)
      })
  }
}
</script>

<style lang="scss"></style>
