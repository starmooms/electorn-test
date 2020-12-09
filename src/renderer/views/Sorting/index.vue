<template>
  <div class="sorting-box" v-loading="loading">
    <div class="l-box">
      <split-pane class="main-box" split="horizontal" :defaultPercent="76">
        <template slot="paneL">
          <div class="l-t-box">
            <div class="l-t-l">
              <ChannelInfo
                ref="channelInfo"
                :masterId="actionMasterId"
                :lampResult="lampResult"
              />
            </div>
            <div class="show-btn" @click="setShow('setting')">
              <span>></span>
            </div>
            <div class="l-t-r" v-show="show.setting">
              <sorting-setting
                :actionMasterId.sync="actionMasterId"
                :loading.sync="loading"
                @storingResult="storingResult"
              />
            </div>
          </div>
        </template>
        <template slot="paneR">
          <div class="l-b-box">
            <details-tabel ref="detailsTabel" />
          </div>
        </template>
      </split-pane>
    </div>
    <div class="show-btn" @click="setShow('result')">
      <span>></span>
    </div>
    <div class="r-box" v-show="show.result">
      <Result ref="result" :levelResult="levelResult" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import SplitPane from '@/renderer/components/SplitPane/index.vue'
import ChannelInfo from './components/ChannelInfo.vue'
import Result from './components/Result.vue'
import SortingSetting from './components/SortingSetting.vue'
import DetailsTabel from './components/DetailsTabel.vue'

@Component({
  components: {
    SplitPane,
    ChannelInfo,
    Result,
    SortingSetting,
    DetailsTabel
  }
})
export default class Sorting extends Vue {
  $refs!: {
    detailsTabel: DetailsTabel
    result: Result
    channelInfo: ChannelInfo
  }

  show = {
    result: true,
    setting: true
  }
  actionMasterId = null
  lampResult: null | SortingT.BoxLampResult = null

  levelResult: SortingT.LevelResult[] = []
  loading = false

  setShow(key: string) {
    if (this.show[key] !== void 0) {
      this.$set(this.show, key, !this.show[key])
    }
  }

  storingResult(data: SortingT.LevelEmitResult) {
    const xTabel = this.$refs?.detailsTabel?.$refs?.xTabel
    if (xTabel) {
      xTabel.reloadData(data.list)
    }
    this.levelResult = data.levelResultList
    this.lampResult = data.boxLampResult
    this.$refs.result.setBoxResult(data.boxResultList)
  }
}
</script>

<style lang="scss" scoped>
.sorting-box {
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
      width: 100%;
      height: 100%;
    }
  }

  .r-box {
    flex-basis: 400px;
  }
}

.show-btn {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 10px;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
  background-color: #f8f8f9;
  transition: all 0.2s;

  &:hover {
    border: 1px solid #989898;
  }
}
</style>
<style>
#defalut {
  height: 100%;
  padding: 0;
}
</style>
