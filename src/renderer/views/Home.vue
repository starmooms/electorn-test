<template>
  <div class="home">
    <p>home</p>
    <svg-icon icon-class="batter"></svg-icon>
    <ContextMenu :target="contextMenuTarget" :show.sync="contextMenuVisible">
      <a href="3">3</a>
      <a href="3">3</a>
      <a href="3">3</a>
    </ContextMenu>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ContextMenu from '@/renderer/components/ContextMenu.vue'

@Component({
  name: 'Home',
  components: {
    ContextMenu
  }
})
export default class Home extends Vue {
  contextMenuTarget = document.body
  contextMenuVisible = false
}
</script>
