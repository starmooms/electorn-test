<template>
  <div id="nav-bar">
    <nav>
      <ul class="nav-list">
        <li class="nav-item">
          <router-link to="/">端口调试</router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  name: 'NavBar'
})
export default class NavBar extends Vue {}
</script>

<style lang="scss">
$subnav-bgCl: rgba(0, 0, 0, 0.75);
$subnav-borderCl: #6b6b6b;
$subnav-fontCl: #fff;

#nav-bar {
  background: $subnav-bgCl;
  color: $subnav-fontCl;
  width: 200px;
  overflow: auto;

  .nav-item {
    line-height: 40px;
    border-bottom: 1px solid #797979;
    color: #fff;
    a {
      display: block;
      padding-left: 10px;
    }
  }
}
</style>
