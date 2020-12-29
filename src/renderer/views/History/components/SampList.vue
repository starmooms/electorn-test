<template>
  <div>
    <div class="action-box">
      <el-button type="primary" @click="showDetails">详细数据</el-button>
      <el-button type="primary" @click="showSteps">过程数据</el-button>
      <el-button type="primary" @click="handleExport">导出Excel</el-button>
    </div>
    <div class="samp-table virtual-table">
      <DynamicScroller
        ref="virtualScroll"
        class="th-body spam-table"
        key-field="sIndex"
        :items="list"
        :min-item-size="24"
      >
        <template #before>
          <div>
            <div class="th-head spam-head">
              <div class="th-item spam-item">
                <div class="th-td td-index"></div>
                <div class="th-td td-extend"></div>
                <div class="th-td td-u">电压</div>
                <div class="th-td td-i">电流</div>
                <div class="th-td td-vol">容量</div>
                <div class="th-td td-epower">电量</div>
                <div class="th-td td-work">执行工步</div>
                <div class="th-td td-endStatus">结束标志</div>
                <div class="th-td td-step-time">时间</div>
                <!-- <div class="th-td td-work-id">工步ID</div> -->
                <div class="th-td td-date">日期</div>
              </div>
            </div>
            <div
              v-if="sampData.length === 0"
              style="padding: 10px;
  text-align: center;"
            >
              暂无数据
            </div>
          </div>
        </template>
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :data-index="index"
            :class="{ active: activeIndex === index }"
          >
            <!-- 工步数据项 -->
            <div
              v-if="item.type === 'step'"
              class="th-item spam-item spam-step"
              @click="setActiveItem(index)"
            >
              <div class="th-td td-index"></div>
              <div class="th-td td-extend">
                <SvgIcon
                  class="icon"
                  :icon-class="item.show ? 'extend-hide' : 'extend-show'"
                  @click="stepSubSet(item, index)"
                />
              </div>

              <div class="th-td td-step-msg">
                {{ item.msg }}
              </div>
            </div>
            <!-- 采样内容 -->
            <div
              v-else
              class="th-item spam-item"
              :class="{ even: item.sIndex % 2 }"
              @click="setActiveItem(index)"
            >
              <div class="th-td td-index">{{ item.sIndex }}</div>
              <div class="th-td td-extend"></div>
              <div class="th-td td-u">{{ item.U }}</div>
              <div class="th-td td-i">{{ item.I }}</div>
              <div class="th-td td-vol">{{ item.vol }}</div>
              <div class="th-td td-epower">{{ item.epower }}</div>
              <div class="th-td td-work">
                {{ item.workerName }}
              </div>
              <div class="th-td td-endStatus">
                {{ item.endStatus }}
              </div>
              <!-- <div class="th-td td-work-id">
              {{ item.stepId }}
            </div> -->
              <div class="th-td td-step-time">{{ item.stepTime }}</div>
              <div class="th-td td-date">
                <span>{{ item.createTimeStr }}</span>
              </div>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>

    <ExportExcel ref="exportExcel" />
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import ExportExcel from '@/renderer/components/ExportExcel/index.vue'

@Component({
  components: {
    DynamicScroller,
    DynamicScrollerItem,
    ExportExcel
  }
})
export default class SampList extends Vue {
  @Prop({ type: Array }) sampData!: any[]
  @Prop({ type: Array }) stepList!: any[]

  $refs!: {
    virtualScroll: DynamicScroller
    exportExcel: ExportExcel
  }

  stepShow: boolean[] = []
  list: any[] = []
  activeIndex: number | null = null

  @Watch('sampData')
  changeList() {
    let list: any[] = []
    this.stepList.forEach((item, index) => {
      const sub = this.sampData.slice(item.start, item.end)
      const show = this.stepShow[index] || false
      const stepItem = {
        ...item,
        stepIndex: index,
        sIndex: `step-${index}`,
        type: 'step',
        show,
        subList: [],
        length: sub.length
      }
      list.push(stepItem)
      if (stepItem.show) {
        list = list.concat(sub)
      } else {
        stepItem.subList = sub
      }
    })
    this.setActiveItem(null)
    this.list = list
  }

  /** 展开关闭工步列表 */
  stepSubSet(step, index) {
    const status = !step.show
    // 展开收缩采样列表
    if (status) {
      this.list.splice(index + 1, 0, ...step.subList)
    } else {
      const stepLen = step.length
      const list = this.list.splice(index + 1, stepLen)
      step.subList = list
    }

    // 计算当前锁定tab
    let activeIndexNew: null | number = null
    const activeIndex = this.activeIndex
    const stepSubLen = step.end - step.start
    if (activeIndex && activeIndex > index) {
      if (status) {
        activeIndexNew = activeIndex + stepSubLen
      } else {
        if (activeIndex <= index + stepSubLen) {
          activeIndexNew = index
        } else {
          activeIndexNew = activeIndex - stepSubLen
        }
      }
      this.setActiveItem(activeIndexNew)
    }

    this.$set(this.stepShow, step.stepIndex, status)
    step.show = status
  }

  /**
   * 按工步列表循环，跳过采样列表
   * @cb index 当前工步在表格中的索引
   *  */
  eachStep(cb: (step: any, index: number) => void) {
    for (let i = 0; i <= this.list.length; i++) {
      const item = this.list[i]
      if (item && item.type === 'step') {
        cb(item, i)
        if (item.show === true) {
          i += item.end - item.start
        }
      }
    }
  }

  /** 显示详细数据 */
  showDetails() {
    this.eachStep((item, index) => {
      if (item.show === false) {
        this.stepSubSet(item, index)
      }
    })
    // for (let i = 0; i <= this.list.length; i++) {
    //   const item = this.list[i]
    //   if (item && item.type === 'step') {
    //     if (item.show === false) {
    //       this.stepSubSet(item, i)
    //     }
    //     i += item.end - item.start
    //   }
    // }
  }

  /** 显示过程数据 */
  showSteps() {
    for (let i = 0; i <= this.list.length; i++) {
      const item = this.list[i]
      if (item && item.type === 'step' && item.show === true) {
        this.stepSubSet(item, i)
      }
    }
  }

  setActiveItem(index: number | null, scroll = false) {
    this.activeIndex = index
    if (scroll && index != null && this.$refs.virtualScroll) {
      const preNum = 6
      const scrollIndex = index > preNum ? index - preNum : index
      this.$refs.virtualScroll.scrollToItem(scrollIndex)
    }
  }

  /** 定位 */
  locate(samp: any) {
    const sampIndex = samp.sIndex - 1
    this.eachStep((step, index) => {
      if (sampIndex >= step.start && sampIndex < step.end) {
        if (step.show) {
          this.setActiveItem(index + 1 + (sampIndex - step.start), true)
        } else {
          this.setActiveItem(index, true)
        }
      }
    })
  }

  /** 导出 */
  handleExport() {
    if (this.stepList.length === 0 || this.sampData.length === 0) {
      return this.$message.error('暂无数据')
    }
    this.$refs.exportExcel.exportHandle(() => {
      return {
        columns: [
          { header: '工序', key: 'msg', width: 25 },
          { header: '电压mV', key: 'U', width: 25 },
          { header: '电流mA', key: 'I', width: 25 },
          { header: '容量mAh', key: 'vol', width: 25 },
          { header: '电量mWh', key: 'epower', width: 25 },
          { header: '结束标志', key: 'endStatus', width: 25 },
          { header: '时间s', key: 'stepTime', width: 25 },
          { header: '日期', key: 'createTime', width: 25 }
        ],
        rows: this.sampData
      }
    })
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
      position: relative;
      box-sizing: border-box;
      flex: none;
      height: $td-h;
      padding-left: 10px;
      font-size: 12px;
      line-height: $td-h;
      border-right: 1px solid #dcdfe6;
      border-bottom: 1px solid #dcdfe6;

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
        border-right: 0;
      }

      .td-text {
        width: 100%;
        line-height: 1.2;
        word-break: break-all;
        word-wrap: break-word;
      }
    }
  }
  // .th-head {
  //   .th-item {
  //     padding-right: 8px;
  //   }
  // }

  .th-body {
    height: calc(80vh - 60px);
  }
}

.samp-table {
  .th-item {
    padding-right: 0;

    .td-date {
      flex-grow: 1;
      min-width: 80px;
    }

    .td-index {
      width: 36px;
      padding-left: 0;
      text-align: center;
    }

    .td-u,
    .td-i,
    .td-vol,
    .td-epower,
    .td-work-id,
    .td-step-time {
      width: 60px;
    }

    .td-work,
    .td-endStatus {
      width: 100px;
    }

    .td-extend {
      width: 24px;
      min-width: 24px;
      padding-left: 0;
      text-align: center;
      background-color: $oBackground;
    }

    .td-step-msg {
      flex-grow: 1;
    }
  }

  .th-item,
  ::v-deep
    .vue-recycle-scroller.direction-vertical
    .vue-recycle-scroller__item-wrapper {
    min-width: 742px;
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

  .th-item.spam-step {
    display: flex;
    background-color: $oBackground;

    .th-td {
      height: 26px;
      line-height: 26px !important;
    }

    .td-extend {
      .icon {
        cursor: pointer;
      }
    }
  }

  .active {
    .th-item,
    .th-item .td-extend {
      color: #fff;
      background-color: #409eff;
    }
  }
}

.table-box {
  min-width: 400px;
}

.action-box {
  margin-bottom: 20px;
}
</style>
