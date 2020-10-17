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
            v-for="(item, index) in 32"
            :key="item"
            :class="{
              action: actionList[cIndex]
                ? actionList[cIndex].indexOf(index) >= 0
                : false
            }"
          ></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ChannelInfo extends Vue {
  @Prop({ type: Number, default: 0 }) masterId!: number
  list: any = null

  get actionList() {
    return this.list && this.list[this.masterId] ? this.list[this.masterId] : {}
  }

  /** 设置结果 */
  setBoxResult(boxRestul: SortingT.BoxLampResult) {
    const list: any = {}
    Object.entries(boxRestul).forEach(master => {
      Object.entries(master[1]).forEach(slaver => {
        if (!list[master[0]]) {
          list[master[0]] = {}
        }
        const m = list[master[0]]
        slaver[1].forEach(channelId => {
          if (!m[channelId]) {
            m[channelId] = []
          }
          const c = m[channelId]

          c.push(Number(slaver[0]))
        })
      })
    })
    this.list = list
    console.log(this.list)
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
