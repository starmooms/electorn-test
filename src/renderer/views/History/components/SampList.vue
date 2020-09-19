<template>
  <div class="samp-data-tab">
    <div class="spam-head">
      <div class="spam-item">
        <div class="samp-w-box">
          <div class="spam-text date-r">日期</div>
          <div class="spam-text u-r">电压</div>
          <div class="spam-text i-r">电流</div>
          <div class="spam-text status-r">执行工步</div>
          <div class="spam-text workeId-r">工步ID</div>
        </div>
      </div>
    </div>
    <div v-if="sampData.length === 0" style="text-align: center;padding:10px;">
      暂无数据
    </div>
    <RecycleScroller
      v-else
      class="spam-table"
      ref="recycleScroller"
      key-field="createTime"
      :items="sampData"
      :item-size="32"
    >
      <template v-slot="{ item, index }">
        <div class="spam-item" :class="{ even: index % 2 }">
          <div class="samp-w-box">
            <div class="spam-text date-r">
              <span>{{ item.createTimeStr }}</span>
            </div>
            <div class="spam-text u-r">{{ item.U }}</div>
            <div class="spam-text i-r">{{ item.I }}</div>
            <div class="spam-text status-r">
              {{ item.workerStatus.name }}
            </div>
            <div class="spam-text workeId-r">
              {{ item.workerId + 1 }}
            </div>
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
.samp-data-tab {
  max-width: 600px;
  border: 1px solid #dcdfe6;
  overflow: auto;

  .spam-item {
    height: 32px;
    line-height: 32px;
    box-sizing: border-box;
    min-width: 580px;
    border-bottom: 1px solid #dcdfe6;
    .samp-w-box {
      display: flex;
      .spam-text {
        border-right: 1px solid #dcdfe6;
        padding-left: 10px;
        box-sizing: border-box;
        &:last-child {
          border-right: none;
        }
      }
      .date-r {
        min-width: 200px;
      }
      .u-r,
      .i-r,
      .workeId-r {
        min-width: 80px;
      }
      .status-r {
        min-width: 140px;
      }
    }
  }

  .spam-table {
    height: 60vh;
    margin: 0;
    width: 100%;
    .even {
      background-color: #f5f7fa;
    }
  }
}
</style>
