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
.splitter-pane-resizer {
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: absolute;
  /* opacity: 0.2; */
  z-index: 6;
  -moz-background-clip: padding;
  -webkit-background-clip: padding;
  background-clip: padding-box;
  background-color: #f8f8f9;
  border-color: #dcdee2;
  border-style: solid;
  border-width: 0;
}

$pandw: 6px;
$pand-icon-h: 32px;

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
  border-top-width: 1px;
  border-bottom-width: 1px;
  cursor: row-resize;

  .split-trigger-bar-con {
    left: 50%;
    transform: translateX(-50%);
    width: $pand-icon-h;
    .split-trigger-bar {
      width: 1px;
      height: $pandw - 2;
      float: left;
      margin-left: 3px;
    }
  }
}

.splitter-pane-resizer.vertical {
  width: $pandw;
  height: 100%;
  margin-left: -($pandw/2);
  border-left-width: 1px;
  border-right-width: 1px;
  z-index: 2;
  cursor: col-resize;

  .split-trigger-bar-con {
    top: 50%;
    transform: translateY(-50%);
    height: $pand-icon-h;
    .split-trigger-bar {
      width: $pandw - 2;
      height: 1px;
      float: left;
      margin-top: 3px;
    }
  }
}
</style>
