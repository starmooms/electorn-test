<template>
  <div id="main">
    <nav-bar></nav-bar>
    <div id="main-left" class="nav-left">
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
  display: flex;
  height: 100%;
}

.nav-left {
  flex: 1;
  padding: 16px 20px;
  overflow: auto;
}
</style>
