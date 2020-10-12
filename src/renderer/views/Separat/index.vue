<template>
  <div class="separat-box">
    <div class="l-box">
      <split-pane class="main-box" split="horizontal" :defaultPercent="76">
        <template slot="paneL">
          <div class="l-t-box">
            <div class="l-t-l">
              <ChannelInfo />
            </div>
            <div class="show-btn" @click="setShow('setting')">
              <span>></span>
            </div>
            <div class="l-t-r" v-show="show.setting">
              <separat-setting />
            </div>
          </div>
        </template>
        <template slot="paneR">
          <div class="l-b-box">
            <details-tabel />
          </div>
        </template>
      </split-pane>
    </div>
    <div class="show-btn" @click="setShow('result')">
      <span>></span>
    </div>
    <div class="r-box" v-show="show.result">
      <Result />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import SplitPane from '@/renderer/components/SplitPane/index.vue'
import ChannelInfo from './components/ChannelInfo.vue'
import Result from './components/Result.vue'
import SeparatSetting from './components/SeparatSetting.vue'
import DetailsTabel from './components/DetailsTabel.vue'

@Component({
  components: {
    SplitPane,
    ChannelInfo,
    Result,
    SeparatSetting,
    DetailsTabel
  }
})
export default class Separat extends Vue {
  @Prop({ type: String }) className!: string

  show = {
    result: true,
    setting: true
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
.separat-box {
  display: flex;
  height: 100%;
  .l-box {
    flex: 1;
    // display: flex;
    // flex-flow: column;

    .l-t-box {
      display: flex;
      flex: 1;
      height: 100%;

      .l-t-l {
        flex: 1 1;
        overflow: auto;
      }

      .l-t-r {
        flex: 0 0 320px;
        overflow: auto;
      }
    }
    .l-b-box {
      height: 100%;
      width: 100%;
    }
  }
  .r-box {
    flex-basis: 400px;
  }
}

.show-btn {
  height: 100%;
  background-color: #f8f8f9;
  flex: 0 0 10px;
  width: 10px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s;
  box-sizing: border-box;
  cursor: pointer;
  &:hover {
    border: 1px solid #989898;
  }
}
</style>
<style>
#defalut {
  padding: 0;
  height: 100%;
}
</style>
