<template>
  <div class="separat-setting">
    <div class="box-title">
      <h4 class="title">分选条件与执行</h4>
    </div>
    <div class="box-content">
      <el-form class="box-item data-type">
        <!-- <span>选择历史</span> -->
        <div class="form-title">选择历史</div>
        <!-- <el-form-item>
          <el-radio-group v-model="form.dataType">
            <el-radio label="当前数据" value="nowData"></el-radio>
            <el-radio label="历史文件" value="history"></el-radio>
          </el-radio-group>
        </el-form-item> -->
        <el-form-item>
          <el-input readonly v-model="historyFile">
            <el-button
              class="historySelect"
              slot="append"
              @click="historySelect"
            >
              选择
            </el-button>
          </el-input>
        </el-form-item>
      </el-form>

      <el-form class="box-item data-type">
        <div class="form-title">分选工步</div>
        <!-- <el-form-item label="机柜">
          <el-select v-model="form.masterId">
            <el-option
              v-for="(item, index) in 20"
              :key="item"
              :label="`机柜${item}`"
              :value="index"
            ></el-option>
          </el-select>
        </el-form-item> -->
        <el-form-item label="工步">
          <el-select v-model="form.stepData" value-key="loopId">
            <el-option
              v-for="(item, index) in workerList"
              :key="index"
              :label="`${item.id + 1}(${item.loopId})：${item.msg}`"
              :value="item"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <el-form class="box-item data-type">
        <div class="form-title">分选等级</div>
        <el-form-item class="form-flex-item">
          <el-select v-model="form.levelId">
            <el-option
              v-for="(item, index) in levelList"
              :key="index"
              :label="`${index + 1}（${item.desc}）`"
              :value="index"
            ></el-option>
          </el-select>
          <el-button @click="configShowSet">条件设置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSepart">只分选</el-button>
          <el-button>分选并发送</el-button>
        </el-form-item>
      </el-form>

      <el-form class="box-item data-type">
        <div class="form-title button-title">
          <span class="txt">多机分选</span>
          <div class="button-box">
            <el-button>联机</el-button>
            <el-button>全选</el-button>
            <el-button>全不选</el-button>
          </div>
        </div>
        <div class="master-list">
          <div class="master-item" v-for="item in 20" :key="item">
            <div
              class="master-box"
              :class="{ active: masterActive.indexOf(item) >= 0 }"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </el-form>

      <el-form class="box-item data-type">
        <div class="form-title button-title">
          <span class="txt">指定工步</span>
          <div class="button-box">
            <el-button>保存</el-button>
          </div>
        </div>
        <div class="condutc">
          <div class="input-item">
            <input
              type="checkbox"
              id="zeroU"
              value="zeroU"
              v-model="form.setpsCondutc"
            />
            <label for="zeroU">零电压参加分选</label>
          </div>

          <div class="condutc-input">
            <div class="input-item" v-for="item in condutcList" :key="item.key">
              <input
                type="checkbox"
                :id="item.key"
                :value="item.key"
                v-model="form.setpsCondutc"
              />
              <label :for="item.key">{{ item.name }}</label>
              <input
                class="input-val"
                type="text"
                v-model.number="form.condutc[item.key]"
              />
            </div>
          </div>
        </div>
      </el-form>
    </div>
    <level-dialog
      :show.sync="configShow"
      :levelAttr="levelAttr"
      :levelList="levelList"
      @changeConfig="getSeparatConfig"
    />

    <history-dialog :show.sync="historyShow" @save="changeHistory" />
  </div>
</template>

<script lang="ts">
import { getStoreConfig } from '@/renderer/ipc/storeConfig'
import { Component, Vue, Watch } from 'vue-property-decorator'
import LevelDialog from './LevelDialog.vue'
import HistoryDialog from './HistoryDialog.vue'
import HistoryDb from '@/renderer/Db/HistoryDb'
import { stepsFormat } from '@/renderer/utils/util'

@Component({
  components: {
    LevelDialog,
    HistoryDialog
  }
})
export default class SeparatSetting extends Vue {
  form = {
    dataType: 'nowData',
    historyUrl: '',
    masterId: 0,
    stepData: null as null | UtilT.StepFormatItem,
    levelId: null,
    setpsCondutc: [],
    condutc: {
      vol: null,
      startU: null,
      endU: null,
      endI: null,
      curIRate: null
    }
  }
  configShow = false
  historyShow = false

  @Watch('form', { deep: true })
  c(v) {
    console.log(v)
    console.log(v.setpsCondutc)
  }

  condutcList = [
    { name: '容量工步', key: 'vol' },
    { name: '开压工步', key: 'startU' },
    { name: '终压工步', key: 'endU' },
    { name: '终流工步', key: 'endI' },
    { name: '恒流工步比', key: 'curIRate' }
  ]

  workerList: UtilT.StepFormatList = []

  levelAttr = []
  levelList = [
    {
      id: 1,
      desc: '描述'
    },
    {
      id: 2,
      desc: ''
    },
    {
      id: 3,
      desc: ''
    }
  ]

  // 当前选择的历史
  historyFile = ''
  historyItem: Db.RHistoryItem | null = null
  db!: HistoryDb | null

  configShowSet() {
    this.configShow = true
  }

  historySelect() {
    this.historyShow = true
  }

  get masterActive() {
    return this.historyItem
      ? this.historyItem.masterIds.split(',').map(Number)
      : []
  }

  /** 创建数据库连接 */
  async createDb(history: Db.RHistoryItem | null) {
    try {
      const filePath = history ? `${history.filePath}/${history.fileId}` : ''
      if (this.historyFile !== filePath) {
        await this.closeDb()
        if (filePath) {
          const db = new HistoryDb(filePath)
          await db.connect()
          this.db = db
          this.historyFile = filePath
          this.historyItem = history
        }
      }
    } catch (err) {
      console.warn(err)
      return null
    }
  }

  /** 关闭数据库 */
  closeDb() {
    if (this.db) {
      this.db.close()
      this.db = null
      this.historyItem = null
      this.historyFile = ''
    }
  }

  /** 选中历史文件 */
  async changeHistory(data: Db.RHistoryItem | null) {
    await this.createDb(data)
    if (this.db) {
      this.getHistoryStep()
    }
  }

  /** 历史文件获取工步 */
  async getHistoryStep() {
    if (this.db) {
      const data = await this.db.getWorkStep()
      const stepList = JSON.parse(data.stepList)
      this.workerList = stepsFormat(stepList, true)
    }
  }

  async getSeparatConfig() {
    const result = await getStoreConfig({
      type: 'separat'
    })
    if (result.status) {
      const data = result.data
      this.levelList = data.levelList
      this.levelAttr = data.levelAttr
    }
  }

  handleSepart() {
    if (!this.historyItem) {
      return this.$message.info('未选择历史')
    } else if (!this.form.stepData) {
      return this.$message.info('未选择工步')
    } else if (this.levelList.length === 0) {
      return this.$message.info('未设置分选等级')
    }
  }

  mounted() {
    this.getSeparatConfig()
  }

  beforeDestroy() {
    this.closeDb()
  }
}
</script>
<style lang="scss" scoped>
.separat-setting {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-flow: column;
  .box-title {
    position: relative;
    .title {
      border: 1px solid #ccc;
      border-bottom: none;
      margin: 0;
      display: inline-block;
      padding: 2px 10px;
      background-color: #fff;

      &:after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1px;
        background-color: #ccc;
        z-index: -1;
      }
    }
  }

  .box-content {
    flex: 1;
    border: 1px solid #ccc;
    border-top: none;
    overflow: auto;
    .box-item {
      margin: 2px;
      margin-bottom: 10px;
      padding: 6px 12px;
      border: 1px solid #b3b3b3;
    }
  }
}

.data-type {
  .historySelect {
    cursor: pointer;
  }
  .el-form-item {
    margin-bottom: 6px;
  }
  .form-title {
    margin-bottom: 6px;
  }
  .form-flex-item {
    ::v-deep .el-form-item__content {
      display: flex;
      .el-select {
        flex: 1;
        margin-right: 6px;
      }
    }
  }

  .button-title {
    display: flex;
    justify-content: space-between;
  }

  .master-list {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    margin-left: -10px;

    .master-item {
      flex: 0 0 14.28%;
      padding-left: 10px;
      box-sizing: border-box;
      margin-bottom: 10px;

      .master-box {
        background-color: #a5a5a5;
        font-weight: bold;
        font-style: oblique;
        text-align: center;
        cursor: pointer;
        padding: 2px 0;

        &.active {
          background-color: #fff;
        }
      }
    }
  }

  .condutc {
    margin-top: -8px;

    .input-item {
      font-size: 12px;
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      label {
        margin-left: 4px;
      }
      .input-val {
        width: 36%;
      }
    }

    .condutc-input {
      display: flex;
      flex-flow: row wrap;
      .input-item {
        flex-basis: 50%;
        label {
          flex-basis: 64px;
        }
      }
    }
  }
}
</style>
