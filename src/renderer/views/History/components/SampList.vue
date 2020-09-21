<template>
  <div class="samp-table virtual-table">
    <RecycleScroller
      class="th-body spam-table"
      ref="recycleScroller"
      key-field="sIndex"
      :items="list"
      :item-size="24"
    >
      <template #before>
        <div>
          <div class="th-head spam-head">
            <div class="th-item spam-item">
              <div class="th-td td-index"></div>
              <div class="th-td td-extend"></div>
              <div class="th-td td-u">电压</div>
              <div class="th-td td-i">电流</div>
              <div class="th-td td-work">执行工步</div>
              <div class="th-td td-work-id">工步ID</div>
              <div class="th-td td-date">日期</div>
            </div>
          </div>
          <div
            v-if="sampData.length === 0"
            style="text-align: center;padding:10px;"
          >
            暂无数据
          </div>
        </div>
      </template>
      <template v-slot="{ item, index }">
        <div class="th-item spam-item spam-step" v-if="item.type === 'step'">
          <div class="th-td td-index"></div>
          <div class="th-td td-extend">
            <svg-icon
              @click="stepSubSet(item, index)"
              class="icon"
              :icon-class="item.show ? 'extend-hide' : 'extend-show'"
            ></svg-icon>
          </div>

          <div class="th-td td-step-msg">
            {{ item.msg }}
          </div>
        </div>
        <div class="th-item spam-item" v-else :class="{ even: index % 2 }">
          <div class="th-td td-index">{{ item.sIndex }}</div>
          <div class="th-td td-extend"></div>
          <div class="th-td td-u">{{ item.U }}</div>
          <div class="th-td td-i">{{ item.I }}</div>
          <div class="th-td td-work">
            {{ item.workerName }}
          </div>
          <div class="th-td td-work-id">
            {{ item.stepId }}
          </div>
          <div class="th-td td-date">
            <span>{{ item.createTimeStr }}</span>
          </div>
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { RecycleScroller } from 'vue-virtual-scroller'

@Component({
  components: {
    RecycleScroller
  }
})
export default class SampList extends Vue {
  @Prop({ type: Array }) sampData!: any[]
  @Prop({ type: Array }) stepList!: any[]

  list: any[] = []

  @Watch('sampData')
  changeList() {
    let list: any[] = []
    this.stepList.forEach((item, index) => {
      console.log(item)
      const sub = this.sampData.slice(item.start, item.end)
      list.push({
        ...item,
        sIndex: `step-${index}`,
        type: 'step',
        show: true,
        subList: [],
        length: sub.length
      })
      list = list.concat(sub)
    })
    this.list = list
    console.log(this.list)
  }

  stepSubSet(step, index) {
    const status = !step.show
    if (status) {
      this.list.splice(index + 1, 0, ...step.subList)
    } else {
      const list = this.list.splice(index + 1, step.length)
      step.subList = list
    }
    step.show = status
  }

  mounted() {
    console.log(this.sampData)
  }
}
</script>

<style lang="scss" scoped>
$oBackground: #fffbf0;
$td-h: 24px;

.virtual-table {
  border: 1px solid #dcdfe6;
  .th-item {
    display: flex;
    align-items: center;
    &.even {
      background-color: #f5f7fa;
    }
    .th-td {
      flex: none;
      box-sizing: border-box;
      padding-left: 10px;
      border-right: 1px solid #dcdfe6;
      border-bottom: 1px solid #dcdfe6;
      font-size: 12px;
      position: relative;
      height: $td-h;
      line-height: $td-h;
      /* &:after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        background: #dcdfe6;
      } */
      &:last-child {
        border-right: none;
      }

      .td-text {
        line-height: 1.2;
        width: 100%;
        word-wrap: break-word;
        word-break: break-all;
      }
    }
  }

  // .th-head {
  //   .th-item {
  //     padding-right: 8px;
  //   }
  // }

  .th-body {
    height: 80vh;
  }
}

.samp-table {
  .th-item,
  ::v-deep
    .vue-recycle-scroller.direction-vertical
    .vue-recycle-scroller__item-wrapper {
    min-width: 600px;
  }

  ::v-deep .vue-recycle-scroller__slot {
    position: sticky;
    top: 0;
    z-index: 99;
  }
  .th-head {
    .th-item {
      background-color: #fff;
      .td-extend {
        background-color: transparent;
      }
    }
  }

  .th-item {
    padding-right: 0;
    .th-td {
      // flex: 1 0;
      // flex-grow: 1;
      // box-sizing: border-box;
    }
    .td-date {
      flex-grow: 1;
      min-width: 160px;
    }
    .td-index {
      width: 36px;
      text-align: center;
      padding-left: 0;
    }
    .td-u,
    .td-i,
    .td-work-id {
      width: 80px;
    }
    .td-work {
      width: 140px;
    }

    .td-extend {
      width: 24px;
      min-width: 24px;
      background-color: $oBackground;
      text-align: center;
      padding-left: 0;
    }
    .td-step-msg {
      flex-grow: 1;
    }
  }

  .spam-step {
    background-color: $oBackground;
    display: flex;
    .td-extend {
      .icon {
        cursor: pointer;
      }
    }
  }
}
.table-box {
  min-width: 400px;
}

// .samp-data-tab {
//   max-width: 600px;
//   border: 1px solid #dcdfe6;
//   overflow: auto;

//   .spam-item {
//     height: 32px;
//     line-height: 32px;
//     box-sizing: border-box;
//     min-width: 580px;
//     border-bottom: 1px solid #dcdfe6;
//     .samp-w-box {
//       display: flex;
//       .spam-text {
//         border-right: 1px solid #dcdfe6;
//         padding-left: 10px;
//         box-sizing: border-box;
//         &:last-child {
//           border-right: none;
//         }
//       }
//       .date-item {
//         min-width: 200px;
//       }
//       .u-r,
//       .i-r,
//       .workeId-r {
//         min-width: 80px;
//       }
//       .status-r {
//         min-width: 140px;
//       }
//     }
//   }

//   .spam-table {
//     height: 60vh;
//     margin: 0;
//     width: 100%;
//     .even {
//       background-color: #f5f7fa;
//     }
//   }
// }
</style>
