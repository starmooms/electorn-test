<template>
  <div
    class="right-mouse-menu"
    :style="style"
    style="display: block;"
    v-show="syncShow"
    @mousedown.stop
    @contextmenu.prevent
  >
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, PropSync } from 'vue-property-decorator'
@Component({
  name: 'context-menu'
})
export default class ContextMenu extends Vue {
  @Prop() private target!: null | Element
  @PropSync('show', { type: Boolean }) private syncShow!: boolean

  private triggerShowFn: any = null
  private triggerHideFn: any = null
  private x = 0
  private y = 0
  private binded = false

  private get style() {
    return {
      left: `${this.x}px`,
      top: `${this.y}px`
    }
  }

  @Watch('show')
  private showChange(v: boolean) {
    if (v) {
      this.bindHideEvents()
    } else {
      this.unbindHideEvents()
    }
  }

  @Watch('target')
  private targetChange() {
    this.bindEvents()
  }

  private contextMenuHandler(e: MouseEvent) {
    this.x = e.clientX
    this.y = e.clientY
    this.syncShow = true
    e.preventDefault()
  }

  private clickDocumentHandler() {
    this.syncShow = false
  }

  private bindEvents() {
    this.$nextTick(() => {
      if (!this.target || this.binded) return
      this.triggerShowFn = this.contextMenuHandler.bind(this)
      this.target.addEventListener('contextmenu', this.triggerShowFn)
      this.binded = true
    })
  }

  private unbindEvents() {
    if (!this.target) return
    this.target.removeEventListener('contextmenu', this.triggerShowFn)
  }

  private bindHideEvents() {
    this.triggerHideFn = this.clickDocumentHandler.bind(this)
    document.addEventListener('mousedown', this.triggerHideFn)
    document.addEventListener('mousewheel', this.triggerHideFn)
  }

  private unbindHideEvents() {
    document.removeEventListener('mousedown', this.triggerHideFn)
    document.removeEventListener('mousewheel', this.triggerHideFn)
  }

  private mounted() {
    this.bindEvents()
  }

  private destroy() {
    this.unbindEvents()
  }
}
</script>
<style lang="scss" scoped>
.right-mouse-menu {
  position: fixed;
  background: #fff;
  border: solid 1px rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  z-index: 999;
  display: none;
}
</style>
