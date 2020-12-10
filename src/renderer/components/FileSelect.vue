<template>
  <div class="select-file" @click.stop="action">
    <slot>
      <el-button class="select-directory">
        <SvgIcon class="directory-icon" icon-class="filedir"></SvgIcon>
      </el-button>
    </slot>
  </div>
</template>

<script lang="ts">
import { remote, OpenDialogOptions } from 'electron'
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
  @Prop({
    type: Array,
    default() {
      return []
    }
  })
  readonly fileType!: string[]

  fileTypeList = {
    hex: { name: 'hex', extensions: ['bin', 'hex'] }
  }

  action() {
    if (this.isSave) {
      this.onSaveFolder()
    } else {
      this.onFolderClick()
    }
  }

  /** 保存文件目录 */
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

  /** 打开文件 */
  onFolderClick() {
    const properties: OpenDialogOptions['properties'] =
      this.openType === 'file'
        ? ['openFile']
        : ['openDirectory', 'createDirectory']

    let filters = [{ name: 'All Files', extensions: ['*'] }]
    if (this.fileType.length > 0) {
      filters = this.fileType.map(key => {
        return this.fileTypeList[key]
      })
    }

    remote.dialog
      .showOpenDialog(remote.getCurrentWindow(), {
        // defaultPath: this.path || remote.app.getPath('downloads'),
        properties: properties,
        filters
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
