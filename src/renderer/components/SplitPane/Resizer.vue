<template>
  <div :class="classes">
    <div class="split-trigger-bar-con">
      <i class="split-trigger-bar"></i>
      <i class="split-trigger-bar"></i>
      <i class="split-trigger-bar"></i>
      <i class="split-trigger-bar"></i>
      <i class="split-trigger-bar"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class Resizer extends Vue {
  @Prop({ type: String }) split!: string
  @Prop({ type: String }) className!: string

  classes = ['splitter-pane-resizer', this.split, this.className].join(' ')
}
</script>

<style lang="scss" scoped>
$pandw: 6px;
$pand-icon-h: 32px;

.splitter-pane-resizer {
  position: absolute;

  /* opacity: 0.2; */
  z-index: 6;
  box-sizing: border-box;
  background-color: #f8f8f9;
  background-clip: padding;
  background-clip: padding-box;
  border-color: #dcdee2;
  border-style: solid;
  border-width: 0;
}

.split-trigger-bar-con {
  position: absolute;

  .split-trigger-bar {
    background: rgba(23, 35, 61, 0.25);
  }
}

.splitter-pane-resizer.horizontal {
  width: 100%;
  height: $pandw;
  margin-top: -($pandw/2);
  cursor: row-resize;
  border-top-width: 1px;
  border-bottom-width: 1px;

  .split-trigger-bar-con {
    left: 50%;
    width: $pand-icon-h;
    transform: translateX(-50%);

    .split-trigger-bar {
      float: left;
      width: 1px;
      height: $pandw - 2;
      margin-left: 3px;
    }
  }
}

.splitter-pane-resizer.vertical {
  z-index: 2;
  width: $pandw;
  height: 100%;
  margin-left: -($pandw/2);
  cursor: col-resize;
  border-right-width: 1px;
  border-left-width: 1px;

  .split-trigger-bar-con {
    top: 50%;
    height: $pand-icon-h;
    transform: translateY(-50%);

    .split-trigger-bar {
      float: left;
      width: $pandw - 2;
      height: 1px;
      margin-top: 3px;
    }
  }
}
</style>
