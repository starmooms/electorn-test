<template>
  <div class="calibrate-container">
    <div class="calibrate-l">
      <cal-config />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import CalConfig from './CalConfig.vue'

@Component({
  components: {
    CalConfig
  }
})
export default class Calibrate extends Vue {}
</script>

<style lang="scss" scoped>
.calibrate-container {
  display: flex;
  .calibrate-l {
    // width: 400px;
    // background-color: red;
  }
}
</style>
