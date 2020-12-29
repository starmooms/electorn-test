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
  box-sizing: border-box;
  height: 100%;
}

.splitter-pane.horizontal {
  position: absolute;
  width: 100%;
}

.splitter-pane.vertical.splitter-paneL {
  left: 0;
  padding-right: 3px;
}

.splitter-pane.vertical.splitter-paneR {
  right: 0;
  padding-left: 3px;
}

.splitter-pane.horizontal.splitter-paneL {
  top: 0;
}

.splitter-pane.horizontal.splitter-paneR {
  bottom: 0;
  padding-top: 3px;
}
</style>
