<template>
  <div :class="classes">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class Pane extends Vue {
  @Prop({ type: String }) className!: string
  classes = [(this.$parent as any).split, this.className].join(' ')
  percent = 50
}
</script>

<style scoped>
.splitter-pane.vertical {
  position: absolute;
  height: 100%;
  box-sizing: border-box;
}
.splitter-pane.horizontal {
  position: absolute;
  width: 100%;
}

.splitter-pane.vertical.splitter-paneL {
  left: 0px;
  padding-right: 3px;
}

.splitter-pane.vertical.splitter-paneR {
  right: 0px;
  padding-left: 3px;
}

.splitter-pane.horizontal.splitter-paneL {
  top: 0px;
}

.splitter-pane.horizontal.splitter-paneR {
  bottom: 0px;
  padding-top: 3px;
}
</style>
