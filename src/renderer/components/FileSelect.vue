<template>
  <div class="select-file" @click.stop="action">
    <slot>
      <el-button class="select-directory">
        <svg-icon class="directory-icon" icon-class="filedir"></svg-icon>
      </el-button>
    </slot>
  </div>
</template>

<script lang="ts">
import { remote, OpenDialogOptions } from 'electron'
import { app } from 'electron'
import { Component, Vue, Model, Prop } from 'vue-property-decorator'

@Component
export default class FileSelect extends Vue {
  @Model('change', { type: String }) readonly path!: string
  @Prop({ type: String }) readonly openType!: string
  @Prop({ type: Boolean, default: false }) readonly isSave!: string
  @Prop({
    type: Array,
    default() {
      return [{ name: 'All', extensions: ['*'] }]
    }
  })
  readonly fileFilter!: Electron.FileFilter[]

  action() {
    if (this.isSave) {
      this.onSaveFolder()
    } else {
      this.onFolderClick()
    }
  }

  onSaveFolder() {
    remote.dialog
      .showSaveDialog(remote.getCurrentWindow(), {
        filters: this.fileFilter
      })
      .then(({ canceled, filePath }) => {
        if (canceled || !filePath) {
          return
        }
        this.$emit('saveFile', filePath)
        this.$emit('change', filePath)
      })
  }

  onFolderClick() {
    const properties: OpenDialogOptions['properties'] =
      this.openType === 'file'
        ? ['openFile']
        : ['openDirectory', 'createDirectory']

    remote.dialog
      .showOpenDialog(remote.getCurrentWindow(), {
        // defaultPath: this.path || remote.app.getPath('downloads'),
        properties: properties
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

<style lang="scss">
.directory-icon {
  font-size: 14px;
}
</style>
