<template>
  <div class="content-menu-box" @contextmenu="contextMenuHandler($event)">
    <slot></slot>
    <div
      class="right-mouse-menu"
      @mouseup.stop
      @contextmenu.stop
      @click="clickDocumentHandler"
      :style="style"
      v-if="show"
    >
      <slot name="menu"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
@Component({
  name: 'context-menu'
})
export default class ContextMenu extends Vue {
  @Prop() private target!: null | Element
  // @Prop({ type: Boolean, default: false }) public show!: boolean
  // @PropSync('show', { type: Boolean, default: false }) public syncShow!: boolean

  static currentContext: any = null
  static id = 0

  private ctxId = (ContextMenu.id += 1)
  private triggerShowFn: any = null
  private triggerHideFn: any = null
  private x = 0
  private y = 0
  // private binded = false
  private show = false

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

  // @Watch('target')
  // private targetChange() {
  //   this.bindEvents()
  // }

  private contextMenuHandler(e: MouseEvent) {
    console.log(ContextMenu.currentContext)
    this.x = e.clientX
    this.y = e.clientY
    this.show = true
    if (
      ContextMenu.currentContext &&
      ContextMenu.currentContext.id !== this.ctxId
    ) {
      ContextMenu.currentContext.triggerHideFn()
    }
    // e.preventDefault()
  }

  private clickDocumentHandler() {
    this.show = false
  }

  // private bindEvents() {
  //   this.$nextTick(() => {
  //     if (!this.target || this.binded) return
  //     this.triggerShowFn = this.contextMenuHandler.bind(this)
  //     this.target.addEventListener('contextmenu', this.triggerShowFn)
  //     this.binded = true
  //   })
  // }

  // private unbindEvents() {
  //   if (!this.target) return
  //   this.target.removeEventListener('contextmenu', this.triggerShowFn)
  // }

  private bindHideEvents() {
    this.triggerHideFn = this.clickDocumentHandler.bind(this)
    ContextMenu.currentContext = {
      id: this.ctxId,
      triggerHideFn: this.triggerHideFn
    }
    console.log('设置', this.ctxId)
    document.addEventListener('mouseup', this.triggerHideFn)
    document.addEventListener('mousewheel', this.triggerHideFn)
  }

  private unbindHideEvents() {
    if (
      ContextMenu.currentContext &&
      ContextMenu.currentContext.id === this.ctxId
    ) {
      ContextMenu.currentContext = null
    }
    document.removeEventListener('mouseup', this.triggerHideFn)
    document.removeEventListener('mousewheel', this.triggerHideFn)
  }

  // private mounted() {
  //   this.bindEvents()
  // }

  // private destroy() {
  //   this.unbindEvents()
  // }
}
</script>
<style lang="scss" scoped>
$bcl: hsla(0, 0%, 100%, 0.12);

.right-mouse-menu {
  position: fixed;
  background: #fff;
  border: solid 1px rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  z-index: 999;
  background-color: rgba(28, 28, 28, 0.9);
  color: #fff;
  a {
    min-width: 40px;
    display: block;
    padding: 4px 12px;
    line-height: 24px;
    font-size: 12px;
    border-bottom: 1px solid $bcl;
    &:hover {
      background-color: $bcl;
    }
  }
}
</style>
