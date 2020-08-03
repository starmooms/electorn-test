<template>
  <div id="defalut">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Default extends Vue {}
</script>

<style lang="scss">
#defalut {
  padding: 20px;
  margin: 0 auto;
}
</style>
