<template>
  <div class="slaver-details">
    dd
    <el-row class="thend-list" :gutter="10">
      <el-col
        class="thend-item"
        v-for="channel in channelList"
        :key="channel.id"
        :span="6"
      >
        <div class="thend-wrap" v-loading="channel.loading">
          <!-- <ul class="tag-box">
            <li
              v-for="(tag, index) in tagList"
              :key="index"
              :class="channel.tag === index"
            >
              <a href="javascript:;" @click="channelTagChange(channel, index)">
                {{ tag }}
              </a>
            </li>
          </ul> -->
          <div class="tag-container">
            <div class="thend-item-box">
              <samp-chart size="min"></samp-chart>
              <!-- <TrendChart
                class="chart-item"
                ref="TrendChart"
                :channelId="channel.id"
                size="min"
              ></TrendChart> -->
            </div>
            <!-- <div class="spam-table-box" v-if="channel.tag === 1">
              <RecycleScroller
                class="spam-table"
                :items="channel.sampData"
                :item-size="32"
                key-field="createTime"
                :ref="`spam-table-${channel.id}`"
              >
                <template #before>
                  <div class="spam-item">
                    <div class="samp-w-box">
                      <div class="spam-text date-r">日期</div>
                      <div class="spam-text u-r">电压</div>
                      <div class="spam-text i-r">电流</div>
                      <div class="spam-text status-r">执行工步</div>
                      <div class="spam-text workeId-r">工步ID</div>
                    </div>
                    <div
                      v-if="channel.sampData.length === 0"
                      style="text-align: center;padding:10px;"
                    >
                      暂无数据
                    </div>
                  </div>
                </template>
                <div class="samp-w-box">
                  <div class="spam-text date-r">日期</div>
                  <div class="spam-text u-r">电压</div>
                  <div class="spam-text i-r">电流</div>
                  <div class="spam-text status-r">执行工步</div>
                  <div class="spam-text workeId-r">工步ID</div>
                </div>
                <template v-slot="{ item }">
                  <div class="spam-item">
                    <div class="samp-w-box">
                      <div class="spam-text date-r">
                        <span>{{ item.createTime }}</span>
                      </div>
                      <div class="spam-text u-r">{{ item.U }}</div>
                      <div class="spam-text i-r">{{ item.I }}</div>
                      <div class="spam-text status-r">
                        {{ item.workerStatus }}
                      </div>
                      <div class="spam-text workeId-r">
                        {{ item.workerId }}
                      </div>
                    </div>
                  </div>
                </template>
              </RecycleScroller>
            </div>
            <div
              class="spam-worker-step"
              v-if="channel.tag === 2"
              style="width:100%;height:100%;overflow:auto;"
            >
              <p class="steps-now">当前工步：{{ channel.workerIdNow + 1 }}</p>
              <p class="steps-now">当前工步状态：{{ channel.workerStatus }}</p>
              <div style="width:600px;">
                <el-table border :data="channel.nowStepList">
                  <el-table-column label="工步信息">
                    <template slot-scope="{ row }">
                      <span class="step-now-icon">
                        {{ row.id === channel.workerIdNow ? '*' : '' }}
                      </span>
                      <span>{{ row.msg }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="工步工作条件">
                    <template slot-scope="{ row }">
                      <el-tag
                        :disable-transitions="true"
                        effect="dark"
                        class="tag-item"
                        v-for="item in row.worker"
                        :key="item.label"
                      >
                        {{ item.label }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="工步限制条件" prop="limt">
                    <template slot-scope="{ row }">
                      <el-tag
                        effect="dark"
                        class="tag-item"
                        :disable-transitions="true"
                        v-for="item in row.limt"
                        :key="item.label"
                      >
                        {{ item.label }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div> -->
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import SampChart from '@/renderer/components/SampChart.vue'
import command from '@/renderer/command'
import { RecycleScroller } from 'vue-virtual-scroller'

@Component({
  components: {
    SampChart
  }
})
export default class SlaverDetails extends Vue {
  @Prop({ type: Object }) channelList: any
}
</script>

<style lang="scss" scoped>
.slaver-details {
  height: 100%;
}
.thend-list {
  overflow: hidden;
  .thend-item {
    padding: 10px;
    .thend-wrap {
      border: 1px solid #ccc;
    }
    .tag-box {
      display: flex;
      border-bottom: 1px solid #ccc;
      margin: 0;
      li {
        padding: 0 10px;
        line-height: 24px;
        border-right: 1px solid #ccc;
      }
    }
    .tag-container {
      height: 320px;
      overflow: hidden;
      position: relative;
    }
    .thend-item-box {
      height: 100%;
      padding: 10px 0;
      box-sizing: border-box;
      margin-bottom: 20px;
    }
    .chart-item {
      width: 100%;
      height: 300px;
    }

    .spam-table-box {
      height: 100%;
      width: 100%;
      overflow-y: auto;

      // .smap-wrap {
      //   width: 500px;
      // }

      // .samp-fix-box {
      //   position: relative;
      //   .samp-fix-header {
      //     height: 32px;
      //     .samp-item {
      //       position: absolute;
      //       top: 0;
      //       left: 0;
      //     }
      //   }
      // }

      .spam-table {
        height: 100%;
        margin: 0;
        width: 100%;
      }
      $w: 504px;
      ::v-deep .vue-recycle-scroller__slot {
        position: sticky;
        top: 0;
        z-index: 99;
        .samp-w-box {
          background-color: #fff;
        }
      }
      ::v-deep .vue-recycle-scroller__item-wrapper {
        width: $w;
      }

      // .samp-header {
      //   height: 32px;
      //   .samp-w-box {
      //     position: absolute;
      //     top: 0;
      //     left: 0;
      //   }
      // }
      // .samp-scroll {
      //   height: 288px;
      // }
      .spam-item {
        height: 32px;
        line-height: 32px;
        align-items: center;
        width: 100%;
        .samp-w-box {
          width: $w;
          border-bottom: 1px solid #ccc;
          box-sizing: border-box;
          display: flex;
          position: relative;
        }

        .spam-text {
          margin-right: 10px;
          padding-left: 7px;
          box-sizing: border-box;
          &.date-r {
            flex: 1;
            span {
              position: absolute;
              top: 0;
              left: 0;
              padding: inherit;
            }
          }
          &.u-r,
          &.i-r {
            width: 56px;
          }
          &.status-r {
            width: 140px;
          }
          &.workeId-r {
            width: 60px;
          }
        }
      }
    }
  }
}

.time-tag {
  display: flex;
  align-items: center;
  margin-top: 20px;
  .time-tag-item {
    margin-right: 14px;
  }
}
</style>
