<template>
  <div id="nav-bar">
    <nav>
      <ul class="nav-list">
        <li
          v-for="menu in menuList"
          :key="menu.name"
          class="nav-item"
          :class="{ active: menu.name === activeMenu }"
        >
          <router-link :to="menu.path">
            <svg-icon
              v-if="menu.meta.icon"
              :icon-class="menu.meta.icon"
            ></svg-icon>
            {{ menu.meta.title }}
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { HomeRouter } from '@/renderer/router/index'

@Component({
  name: 'NavBar'
})
export default class NavBar extends Vue {
  menuList = HomeRouter

  get activeMenu() {
    return this.$route.name
  }
}
</script>

<style lang="scss">
$subnav-bgCl: rgba(0, 0, 0, 0.75);
$subnav-borderCl: #6b6b6b;
$subnav-fontCl: #fff;

#nav-bar {
  width: 200px;
  overflow: auto;
  color: $subnav-fontCl;
  background: $subnav-bgCl;

  .nav-item {
    line-height: 40px;
    color: #ccc;
    border-bottom: 1px solid #797979;
    transition: all 0.3s;

    a {
      display: block;
      padding-left: 10px;
    }

    &.active {
      color: #fff;
      background-color: #606266;
    }

    &:hover {
      color: #fff;
    }
  }
}
</style>
