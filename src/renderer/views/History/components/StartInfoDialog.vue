<template>
  <div>
    <el-dialog
      class="start-info-dialog"
      title="查看启动信息"
      width="800px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <div class="start-info-container clearfix">
        <div v-if="startInfo" class="start-info-context">
          <div class="start-channel cxt-item">
            <p class="title-line"><span class="title">启动通道：</span></p>
            <p class="line">机柜号：{{ startInfo.masterIdShowStr }}</p>
            <p class="line">丛控号：{{ startInfo.slaverIdShowStr }}</p>
            <p class="line">通道号：{{ startInfo.channelIdShowStr }}</p>
          </div>
          <div class="start-data-save cxt-item">
            <p class="title-line">
              <span class="title">数据记录条件：</span>
              <span>{{ dateSave }}</span>
            </p>
          </div>
          <div class="start-features cxt-item">
            <p class="title-line">
              <span class="title">特征电压：</span>
              <span>{{ features }}</span>
            </p>
          </div>
          <div class="start-features cxt-item">
            <p class="title-line">
              <span class="title">保护参数：</span>
            </p>
            <p class="line" v-for="(item, index) in protect" :key="index">
              {{ item }}
            </p>
          </div>
          <div class="stepList cxt-item">
            <p>
              <span class="title">工步列表：</span>
            </p>
            <p class="line" v-for="item in startInfo.stepList" :key="item.id">
              {{ item.showId }}、{{ item.msg }}
            </p>
          </div>
        </div>
        <div v-else class="no-data">
          暂无数据
        </div>
      </div>
      <!-- <div class="foot" slot="footer">
        <el-button @click="dialogClose">取 消</el-button>
      </div> -->
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { PROTECT } from '@/shared/config/port'
import { Component, Vue, PropSync, Prop } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class StartInfoDialog extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  @Prop({ type: Object, required: false })
  startInfo!: null | UtilT.StartInfoFormat

  dataSaveList = {
    time: {
      label: '时间',
      type: 'time',
      unit: 's'
    },
    U: {
      label: '电压间隔',
      type: 'U',
      unit: 'mV'
    },
    I: {
      label: '电流间隔',
      type: 'I',
      unit: 'mA'
    }
  }

  get protect() {
    return this.startInfo ? this.getProtect() : []
  }

  get features() {
    return this.startInfo ? this.getFeatures() : ''
  }

  get dateSave() {
    return this.startInfo ? this.getDataSave() : ''
  }

  getProtect() {
    if (this.startInfo) {
      const protect = this.startInfo.protect
      return PROTECT.map(item => {
        const data = protect[item.type] || null
        return `${item.name}：${data}`
      })
    }
    return []
  }

  getFeatures() {
    if (this.startInfo) {
      return Object.entries(this.startInfo.features)
        .map(([key, val]) => {
          return `${key.replace('v', '#')}: ${val}mV`
        })
        .join('、')
    }
    return ''
  }

  getDataSave() {
    const list: string[] = []
    if (this.startInfo) {
      Object.entries(this.startInfo.dataSave).forEach(([key, val]) => {
        if (val.enable) {
          const saveItem = this.dataSaveList[key]
          if (saveItem) {
            list.push(`${saveItem.label} ${val.value} ${saveItem.unit}`)
          }
        }
      })
    }
    return list.join('、')
  }
}
</script>
<style lang="scss" scoped>
.no-data {
  padding: 20px;
  text-align: center;
}

.start-info-context {
  p {
    margin: 4px 0;
  }

  .title {
    font-weight: bold;
    color: #333;
  }

  .cxt-item {
    margin-top: 16px;

    &:first-child {
      margin: 4px 0;
    }
  }
}
</style>
