<template>
  <div>
    <h4>错误日志</h4>
    <el-button
      class="refresh-btn"
      type="primary"
      icon="el-icon-refresh"
      @click="getErrorList"
    >
      刷新
    </el-button>
    <div class="virtual-table err-table">
      <div class="th-head">
        <div class="th-item">
          <div class="th-td td-date">创建日期</div>
          <div class="th-td td-action">操作名称</div>
          <div class="th-td td-err-type">错误类型</div>
          <div class="th-td td-err-code">错误码</div>
          <div class="th-td td-id">机柜号</div>
          <div class="th-td td-id">从控号</div>
          <div class="th-td td-id">通道号</div>
          <div class="th-td td-err-msg">错误信息</div>
        </div>
      </div>
      <div
        v-if="errorList.length <= 0"
        style="text-align: center;padding:10px;"
      >
        暂无数据
      </div>
      <RecycleScroller
        v-else
        class="th-body"
        :items="errorList"
        :item-size="32"
        key-field="id"
      >
        <template v-slot="{ item, index }">
          <div class="th-item" :class="{ even: index % 2 }">
            <div class="th-td td-date">
              {{ item.createTimeStr }}
            </div>
            <div class="th-td td-action">{{ item.action }}</div>
            <div class="th-td td-err-type">
              {{ item.type === 'SampError' ? '采样错误' : '串口交互错误' }}
            </div>
            <div class="th-td td-err-code">{{ item.errCode }}</div>
            <div class="th-td td-id">
              {{ item.masterId != null ? item.masterId + 1 : '-' }}
            </div>
            <div class="th-td td-id">
              {{ item.slaverId != null ? item.slaverId + 1 : '-' }}
            </div>
            <div class="th-td td-id">
              {{ item.channelId != null ? item.channelId + 1 : '-' }}
            </div>
            <div class="th-td td-err-msg">{{ item.errMsg }}</div>
            <!-- <div class="th-td td-err-msg">
              的所发生的就离开飞机手动if九点十分独守空房结束的快乐番薯的是电风扇地方都是发斯蒂芬斯蒂芬的的所发生的就离开飞机手动if九点十分独守空房结束的快乐番薯的是电风扇地方都是发斯蒂芬斯蒂芬的
            </div> -->
          </div>
        </template>
      </RecycleScroller>
    </div>
  </div>
</template>
<script lang="ts">
import { getErrorLog } from '@/renderer/ipc/db'
import { Vue, Component } from 'vue-property-decorator'
import { RecycleScroller } from 'vue-virtual-scroller'

@Component({
  components: {
    RecycleScroller
  }
})
export default class ErrorLog extends Vue {
  errorList: any[] = []

  async getErrorList() {
    const data = await getErrorLog()
    if (data.status) {
      this.errorList = data.data
    }
  }

  mounted() {
    this.getErrorList()
  }
}
</script>

<style lang="scss" scoped>
/* .err-table {
  height: 80vh;
} */
::v-deep {
  .t-header {
    tr,
    th {
      background: #f5f7fa;
    }
  }
}

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

  .th-head {
    .th-item {
      padding-right: 8px;
    }
  }

  .th-body {
    height: 80vh;
  }
}

.err-table {
  .th-item {
    .td-date {
      width: 160px;
    }
    .td-err-type {
      flex-basis: 80px;
    }
    .td-err-code,
    .td-id {
      flex-basis: 80px;
    }
    .td-err-msg {
      flex: auto;
    }
    .td-action {
      width: 160px;
    }
  }
}
</style>
