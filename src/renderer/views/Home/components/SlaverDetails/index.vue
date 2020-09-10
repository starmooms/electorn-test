<template>
  <div class="slaver-details">
    <el-row class="channel-list" :gutter="20">
      <el-col :span="6" v-for="channel in slaver.list" :key="channel.id">
        <div class="item">
          <div class="title-box">
            <p class="tit">通道{{ channel.id + 1 }}</p>
            <el-button
              class="refresh-btn"
              type="primary"
              icon="el-icon-refresh"
            >
              刷新
            </el-button>
          </div>

          <div class="msg-box">
            <div class="msg-l">
              <span class="i-txt">电流：100</span>
              <span class="u-txt">电压：100</span>
            </div>
            <div class="msg-r">
              <el-tag class="now-step" type="success" effect="dark">
                恒流充电
              </el-tag>
            </div>
          </div>

          <div class="step-box">
            
          </div>

        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class SlaverDetails extends Vue {
  @Prop({ type: Object }) slaver!: Port.SlaverItem

  /** 获取工步列表 */
  getWorkerSteps() {
    console.log(this.slaver)
  }

  mounted() {
    this.getWorkerSteps()
  }
}
</script>

<style lang="scss" scoped>
.slaver-details {
  margin-bottom: 20px;
  height: 400px;

  .channel-list {
    display: flex;
    flex-flow: row wrap;
    .item {
      border: 1px solid #ccc;
      background-color: #dcdcdc;
      margin-top: 20px;
      padding: 4px;

      .title-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #ccc;
        padding-bottom: 4px;
        .tit {
          margin: 0;
        }
        .refresh-btn {
          padding: 4px;
        }
      }

      .msg-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        padding-top: 6px;
        font-weight: bold;
        p {
          margin: 0;
        }
        .i-txt {
          margin-right: 10px;
        }
        .now-step {
          font-size: 14px;

          letter-spacing: 2px;
        }
      }

      /* &:last-child(4) {
        margin: 20px 0;
      } */
      /* flex: auto;
      min-width: 21%;
      margin: 0 20px;
      box-sizing: border-box;
      border: 1px solid #ddd; */
    }
  }
}
</style>
