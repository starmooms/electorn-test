<template>
  <div class="samp-table virtual-table">
    <RecycleScroller
      class="th-body spam-table"
      ref="recycleScroller"
      key-field="createTime"
      :items="sampData"
      :item-size="32"
    >
      <template #before>
        <div>
          <div class="th-head spam-head">
            <div class="th-item spam-item">
              <div class="th-td td-date">日期</div>
              <div class="th-td td-u">电压</div>
              <div class="th-td td-i">电流</div>
              <div class="th-td td-work">执行工步</div>
              <div class="th-td td-work-id">工步ID</div>
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
        <div class="th-item spam-item" :class="{ even: index % 2 }">
          <div class="th-td td-date">
            <span>{{ item.createTimeStr }}</span>
          </div>
          <div class="th-td td-u">{{ item.U }}</div>
          <div class="th-td td-i">{{ item.I }}</div>
          <div class="th-td td-work">
            {{ item.workerName }}
          </div>
          <div class="th-td td-work-id">
            {{ item.stepId + 1 }}
          </div>
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { RecycleScroller } from 'vue-virtual-scroller'

@Component({
  components: {
    RecycleScroller
  }
})
export default class SampList extends Vue {
  @Prop({ type: Array }) sampData!: any[]

  mounted() {
    console.log(this.sampData)
  }
}
</script>

<style lang="scss" scoped>
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
      height: 32px;
      line-height: 32px;
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
    min-width: 546px;
  }

  ::v-deep .vue-recycle-scroller__slot {
    position: sticky;
    top: 0;
    z-index: 99;
  }
  .th-head {
    .th-item {
      background-color: #fff;
    }
  }

  .th-item {
    .th-td {
      // flex: 1 0;
      flex-grow: 1;
      box-sizing: border-box;
    }
    .td-date {
      flex-basis: 160px;
    }
    .td-u,
    .td-i,
    .td-work-id {
      flex-basis: 80px;
    }
    .td-work {
      flex-basis: 140px;
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
