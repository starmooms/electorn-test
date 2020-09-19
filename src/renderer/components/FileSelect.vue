<template>
  <div class="select-file" @click.stop="onFolderClick">
    <slot>
      <el-button class="select-directory">
        <svg-icon class="directory-icon" icon-class="filedir"></svg-icon>
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

  onFolderClick() {
    const properties: OpenDialogOptions['properties'] =
      this.openType === 'file'
        ? ['openFile']
        : ['openDirectory', 'createDirectory']

    remote.dialog
      .showOpenDialog({
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
