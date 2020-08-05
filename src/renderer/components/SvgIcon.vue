<template>
  <svg :class="svgClass" aria-hidden="true" v-on="$listeners">
    <use :href="iconName" />
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  name: 'SvgIcon'
})
export default class SvgIcon extends Vue {
  @Prop({ type: String, required: true }) private iconClass!: string
  @Prop({ type: String }) private className!: string

  private get iconName() {
    return `#icon-${this.iconClass}`
  }
  private get svgClass() {
    return this.className ? `svg-icon${this.className} ` : 'svg-icon'
  }
}
</script>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  mask-size: cover !important;
  display: inline-block;
}
</style>
