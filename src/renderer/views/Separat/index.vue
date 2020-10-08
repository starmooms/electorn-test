<template>
  <div class="separat-box">
    <div class="l-box">
      <div class="l-t-box">
        <div class="l-t-l">
          <ChannelInfo />
        </div>
        <div class="show-btn" @click="setShow('config')">
          <span>></span>
        </div>
        <div class="l-t-r" v-show="show.config"></div>
      </div>

      <div class="l-b-box"></div>
    </div>
    <div class="show-btn" @click="setShow('result')">
      <span>></span>
    </div>
    <div class="r-box" v-show="show.result">
      <Result />
    </div>
    <!-- <split-pane class="separat-main-box" split="vertical" :defaultPercent="76">
      <template slot="paneL">
        <split-pane
          class="separat-l-top-box"
          split="vertical"
          :defaultPercent="76"
        >
          <template slot="paneL">
            <div class="pane-box">
              <ChannelInfo />
            </div>
          </template>
          <template slot="paneR">
            <div class="right-container pane-container">
              4
            </div>
          </template>
        </split-pane>

        <div class="separat-l-bottom-box">
          3
        </div>
      </template>
      <template slot="paneR">
        <div class="right-container pane-container">
          <Result />
        </div>
      </template>
    </split-pane> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import SplitPane from '@/renderer/components/SplitPane/index.vue'
import ChannelInfo from './components/ChannelInfo.vue'
import Result from './components/Result.vue'

@Component({
  components: {
    SplitPane,
    ChannelInfo,
    Result
  }
})
export default class Separat extends Vue {
  @Prop({ type: String }) className!: string

  show = {
    result: true,
    config: true
  }

  setShow(key: string) {
    if (this.show[key] !== void 0) {
      this.$set(this.show, key, !this.show[key])
    }
  }

  mounted() {
    document.title = '容量分选'
  }
}
</script>
<style lang="scss" scoped>
.separat-main-box {
  height: 100vh;
  .separat-l-top-box {
    height: 72vh;
  }
  .separat-l-bottom-box {
    border-top: 1px solid #ccc;
  }
}

.separat-box {
  display: flex;
  height: 100%;
  .l-box {
    flex: 1;
    display: flex;
    flex-flow: column;
    .l-t-box {
      display: flex;
      flex: 1;
      .l-t-l {
        flex: 1;
      }
      .l-t-r {
        flex-basis: 400px;
      }
    }
    .l-b-box {
      flex-basis: 260px;
      border-top: 2px solid #ccc;
    }
  }
  .r-box {
    flex-basis: 400px;
  }
}

.show-btn {
  height: 100%;
  background-color: #f8f8f9;
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 10px;
  text-align: center;
  transition: all 0.2s;
  box-sizing: border-box;
  &:hover {
    // box-shadow: 0 0 2px #989898;
    border: 1px solid #989898;
  }
}

.pane-box {
  height: 100%;
  overflow: auto;
}
</style>
<style>
#defalut {
  padding: 0;
  height: 100%;
}
</style>
