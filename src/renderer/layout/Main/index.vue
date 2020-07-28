<template>
  <div id="main">
    <nav-bar></nav-bar>
    <div class="nav-left">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NavBar from './components/NavBar.vue'

@Component({
  components: {
    NavBar
  }
})
export default class Main extends Vue {}
</script>

<style lang="scss">
#main {
  height: 100%;
  display: flex;
}
.nav-left {
  flex: 1;
  overflow: auto;
  padding: 10px 20px;
}
</style>
