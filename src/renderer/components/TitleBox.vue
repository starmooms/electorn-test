<template>
  <div class="title-box" :class="size">
    <p class="title-box-txt">{{ name }}</p>
    <slot></slot>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component
export default class TitleBox extends Vue {
  @Prop({ type: String, default: '' }) name!: ''
  @Prop({ type: String, default: '' }) size!: ''
}
</script>

<style lang="scss" scoped>
.title-box {
  position: relative;
  box-sizing: border-box;
  padding: 30px 20px 10px;
  margin-top: 30px;
  border: 1px solid $--border-color-base;

  .title-box-txt {
    position: absolute;
    top: 0;
    left: 20px;
    padding: 10px;
    margin: 0;
    background-color: #fff;
    transform: translate(0, -50%);
  }

  &.mini {
    padding: 18px 10px 10px;

    .title-box-txt {
      padding: 4px;
    }
  }

  /* .title-box-txt {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    transform: translate(0, -50%);
    margin: 0;
    padding-left: 20px;
    box-sizing: border-box;
    &:after,
    &:before {
      content: '';
      position: absolute;
      top: 50%;
      height: 1px;
      background: $--border-color-base;
    }
    &:before {
      width: 20px;
      left: 0;
    }
    &:after {
      width: 100%;
      right: 0;
    }
  } */
}
</style>
