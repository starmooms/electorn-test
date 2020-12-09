<template>
  <div
    :style="{ cursor, userSelect }"
    class="vue-splitter-container clearfix"
    @mouseup="onMouseUp"
    @mousemove="onMouseMove"
  >
    <pane
      class="splitter-pane splitter-paneL"
      :split="split"
      :style="{ [type]: percent + '%' }"
    >
      <slot name="paneL"></slot>
    </pane>

    <resizer
      :className="className"
      :style="{ [resizeType]: percent + '%' }"
      :split="split"
      @mousedown.native="onMouseDown"
      @click.native="onClick"
    ></resizer>

    <pane
      class="splitter-pane splitter-paneR"
      :split="split"
      :style="{ [type]: 100 - percent + '%' }"
    >
      <slot name="paneR"></slot>
    </pane>
    <div class="vue-splitter-container-mask" v-if="active"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import Pane from './Pane.vue'
import Resizer from './Resizer.vue'

@Component({
  components: {
    Pane,
    Resizer
  }
})
export default class SplitPane extends Vue {
  @Prop({
    validator(value) {
      return ['vertical', 'horizontal'].indexOf(value) >= 0
    },
    default: 'horizontal'
  })
  split!: string

  @Prop({ type: Number, default: 50 }) defaultPercent!: number
  @Prop({ type: Number, default: 10 }) minPercent!: number
  @Prop({ type: String, default: '' }) className!: string

  active = false
  hasMoved = false
  height = null
  percent = this.defaultPercent
  type = this.split === 'vertical' ? 'width' : 'height'
  resizeType = this.split === 'vertical' ? 'left' : 'top'

  get userSelect() {
    return this.active ? 'none' : ''
  }

  get cursor() {
    return this.active ? 'col-resize' : ''
  }

  onClick() {
    if (!this.hasMoved) {
      this.percent = 50
      this.$emit('resize')
    }
  }

  onMouseDown() {
    this.active = true
    this.hasMoved = false
  }

  onMouseUp() {
    this.active = false
  }

  onMouseMove(e) {
    if (e.buttons === 0 || e.which === 0) {
      this.active = false
    }

    if (this.active) {
      let offset = 0
      let target = e.currentTarget
      if (this.split === 'vertical') {
        while (target) {
          offset += target.offsetLeft
          target = target.offsetParent
        }
      } else {
        while (target) {
          offset += target.offsetTop
          target = target.offsetParent
        }
      }

      const currentPage = this.split === 'vertical' ? e.pageX : e.pageY
      const targetOffset =
        this.split === 'vertical'
          ? e.currentTarget.offsetWidth
          : e.currentTarget.offsetHeight
      const percent =
        Math.floor(((currentPage - offset) / targetOffset) * 10000) / 100

      if (percent > this.minPercent && percent < 100 - this.minPercent) {
        this.percent = percent
      }

      this.$emit('resize')
      this.hasMoved = true
    }
  }
}
</script>

<style lang="scss" scoped>
.clearfix::after {
  display: block;
  height: 0;
  clear: both;
  font-size: 0;
  visibility: hidden;
  content: ' ';
}

.vue-splitter-container {
  position: relative;
  height: 100%;
}

.vue-splitter-container-mask {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100%;
  height: 100%;
}
</style>
