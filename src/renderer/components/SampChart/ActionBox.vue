<template>
  <div>
    <el-button type="primary" @click="chartConfingShow">
      曲线设置
    </el-button>
    <div class="action-box">
      <file-select
        slot="append"
        :isSave="true"
        :fileFilter="fileFilter"
        @saveFile="exportEchart"
      >
        <el-button type="primary">
          导出曲线
        </el-button>
      </file-select>
    </div>

    <el-dialog
      class="chart-config-dialog"
      width="600px"
      title="曲线设置"
      :close-on-click-modal="false"
      :visible.sync="chartConfig"
    >
      <el-form :model="form">
        <el-form-item class="form-confg-item" label="Y轴1">
          <el-radio-group v-model="form.y1">
            <el-radio
              v-for="item in y1List"
              :label="item.value"
              :key="item.label"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item class="form-confg-item" label="Y轴2">
          <el-radio-group v-model="form.y2">
            <el-radio
              v-for="item in y2List"
              :label="item.value"
              :key="item.label"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item class="form-confg-item" label="Y轴1显示范围">
          <div class="limt-box">
            <el-form-item label="下限">
              <el-input v-model.number="form.y1Limt.min"></el-input>
            </el-form-item>
            <el-form-item label="上限">
              <el-input v-model.number="form.y1Limt.max"></el-input>
            </el-form-item>
          </div>
        </el-form-item>

        <el-form-item class="form-confg-item" label="Y轴2显示范围">
          <div class="limt-box">
            <el-form-item label="下限">
              <el-input v-model.number="form.y2Limt.min"></el-input>
            </el-form-item>
            <el-form-item label="上限">
              <el-input v-model.number="form.y2Limt.max"></el-input>
            </el-form-item>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="chartConfigClose">取 消</el-button>
        <el-button type="primary" @click="showChartSave">
          确 定
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import SampChart from './index.vue'
import FileSelect from '@/renderer/components/FileSelect.vue'
import fs from 'fs'
import { SettingStatus } from '@/renderer/store/modules/Setting'
import { setStoreConfig } from '@/renderer/ipc/storeConfig'
import { deepClone } from '@/shared/utils'
import { SAMPCHART_Y_MAP } from '@/renderer/utils/util'

@Component({
  components: {
    FileSelect
  }
})
export default class Pane extends Vue {
  @Prop({ type: String }) className!: string
  $parent!: SampChart

  fileFilter = [
    { name: 'png', extensions: ['png'] },
    { name: 'jpeg', extensions: ['jpeg'] }
  ]

  chartConfig = false
  y1List = Object.keys(SAMPCHART_Y_MAP).map(key => {
    return { label: SAMPCHART_Y_MAP[key].name, value: key }
  })
  y2List = [...this.y1List, { label: '无', value: null }]
  form: StoreT.SampChartConfig = {
    y1: 'U',
    y2: 'I',
    y1Limt: {
      min: 6000,
      max: 5000
    },
    y2Limt: {
      min: 6000,
      max: 5000
    }
  }

  get sampChartConfig() {
    return SettingStatus.sampChartConfig
  }

  exportEchart(filePath: string) {
    const typeMatch = filePath.match(/\.(.+)$/)
    if (!typeMatch || typeMatch.length < 2) {
      return this.$message.error('路径错误')
    }
    const type = typeMatch[1]
    if (!['jpeg', 'png'].includes(type)) {
      return this.$message.error(`${type} 类型错误`)
    }

    this.$parent.getEchart(echart => {
      let base64 = echart.getDataURL({
        type,
        backgroundColor: '#fff',
        excludeComponents: ['dataZoom']
      })
      base64 = base64.replace(/^.+?base64,/, '')
      fs.promises.writeFile(filePath, base64, {
        encoding: 'base64'
      })
    })
  }

  chartConfingShow() {
    this.form = deepClone(this.sampChartConfig)
    this.chartConfig = true
  }

  chartConfigClose() {
    this.chartConfig = false
  }

  async showChartSave() {
    await setStoreConfig({
      type: 'userConfig',
      key: 'sampChartConfig',
      data: this.form
    })
    await SettingStatus.getUserConfg()
    this.chartConfigClose()
  }
}
</script>
<style lang="scss" scoped>
.action-box {
  display: inline-block;
  margin-left: 10px;
  // .select-file {
  //   display: inline-block;
  // }
}

.chart-config-dialog {
  .form-confg-item {
    > ::v-deep .el-form-item__label {
      font-weight: bold;
    }
  }

  .limt-box {
    display: flex;

    ::v-deep .el-form-item {
      display: flex;
      justify-content: flex-start;

      .el-form-item__label {
        width: 60px;
      }

      .el-form-item__content {
        width: 100px;
      }
    }
  }
}
</style>
