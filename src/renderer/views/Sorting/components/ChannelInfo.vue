<template>
  <div class="channel-info">
    <div class="channel-slaver-box">
      <ul class="channel-row-box">
        <li class="channel-row" v-for="item in 32" :key="item">
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>
    <div class="channel-channel-box">
      <div
        class="channel-id-item"
        v-for="(channelId, cIndex) in 8"
        :key="channelId"
      >
        <div class="channel-id">{{ channelId }}</div>

        <ul class="channel-row-box">
          <li
            class="channel-row channel-status"
            v-for="(item, sindex) in 32"
            :key="item"
            :class="{
              action: actionList[sindex]
                ? actionList[sindex].indexOf(cIndex) >= 0
                : false
            }"
          ></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class ChannelInfo extends Vue {
  @Prop({ type: Number, default: null }) masterId!: number | null
  @Prop({
    type: Object,
    default: null
  })
  lampResult!: SortingT.BoxLampResult

  @Watch('lampResult')
  c(v) {
    console.log(v)
  }

  get actionList() {
    return this.lampResult &&
      this.masterId !== null &&
      this.lampResult[this.masterId]
      ? this.lampResult[this.masterId]
      : {}
  }
}
</script>
<style lang="scss" scoped>
.channel-info {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
  padding: 4px;
  box-sizing: border-box;
}

.channel-slaver-box {
  margin-left: 20px;
  margin-bottom: 6px;
  line-height: 14px;
  .channel-row {
    text-align: center;
  }
}

.channel-channel-box {
  flex: 1;
  display: flex;
  flex-flow: column;
  .channel-id-item {
    flex: 1;
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    .channel-id {
      width: 20px;
      text-align: center;
    }
    .channel-row-box {
      flex: 1 0;
      height: 100%;
      .channel-status {
        height: 100%;
        box-sizing: border-box;
        border: 1px solid #333;
        &.action {
          background-color: red;
        }
      }
    }
  }
}

.channel-row-box {
  display: flex;
  margin: 0;
  .channel-row {
    flex: 1 1;
    margin-left: 2px;
    overflow: hidden;
    &:nth-child(9n) {
      margin-left: 6px;
    }
  }
}
</style>
