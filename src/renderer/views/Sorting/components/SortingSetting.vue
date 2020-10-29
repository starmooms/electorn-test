<template>
  <div class="sorting-setting">
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
          <el-select multiple collapse-tags v-model="form.levelId">
            <el-option
              v-for="item in levelList"
              :key="item.id"
              :label="`${item.id}（${item.desc}）`"
              :value="item.id"
            ></el-option>
          </el-select>
          <el-button @click="configShowSet">条件设置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSorting(false)">只分选</el-button>
          <el-button @click="handleSorting(true)">分选并发送</el-button>
          <el-button @click="lampCloseAll">关闭通道灯</el-button>
        </el-form-item>
      </el-form>

      <el-form class="box-item data-type">
        <div class="form-title button-title">
          <span class="txt">多机分选</span>
          <!-- <div class="button-box">
            <el-button>联机</el-button>
            <el-button>全选</el-button>
            <el-button>全不选</el-button>
          </div> -->
        </div>
        <div class="master-list">
          <div class="master-item" v-for="(item, index) in 20" :key="item">
            <div
              class="master-box"
              :class="{
                active: masterActive.indexOf(index) >= 0,
                select: nowBoxId === index
              }"
              @click="nowBoxIdChange(index)"
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
              v-model="form.stepsCondutc"
            />
            <label for="zeroU">零电压参加分选</label>
          </div>

          <div class="condutc-input">
            <div class="input-item" v-for="item in condutcList" :key="item.key">
              <input
                type="checkbox"
                :id="item.key"
                :value="item.key"
                v-model="form.stepsCondutc"
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
      @changeConfig="getSortingConfig"
    />

    <history-dialog :show.sync="historyShow" @save="createDb" />
  </div>
</template>

<script lang="ts">
import { getStoreConfig } from '@/renderer/ipc/storeConfig'
import { Component, Vue, Watch, PropSync } from 'vue-property-decorator'
import LevelDialog from './LevelDialog.vue'
import HistoryDialog from './HistoryDialog.vue'
import HistoryDb from '@/renderer/Db/HistoryDb'
import { getPercent, idListFormat, stepsFormat } from '@/renderer/utils/util'
import { lampSet } from '@/renderer/ipc/channel'
import { ChannelStatus } from '@/renderer/store/modules/Channel'

@Component({
  components: {
    LevelDialog,
    HistoryDialog
  }
})
export default class SortingSetting extends Vue {
  @PropSync('actionMasterId', { type: Number, default: null })
  private nowBoxId!: number | null
  @PropSync('loading', { type: Boolean, default: false })
  private setLoading!: boolean

  form = {
    dataType: 'nowData',
    historyUrl: '',
    masterId: 0,
    stepData: null as null | UtilT.StepFormatItem,
    levelId: [] as number[],
    stepsCondutc: [],
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

  // @Watch('form', { deep: true })
  // c(v) {
  //   console.log(v)
  // }

  condutcList = [
    { name: '容量工步', key: 'vol' },
    { name: '开压工步', key: 'startU' },
    { name: '终压工步', key: 'endU' },
    { name: '终流工步', key: 'endI' },
    { name: '恒流工步比', key: 'curIRate' }
  ]

  workerList: UtilT.StepFormatList = []

  levelAttr = []
  levelList: Store.LevelItem[] = []

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

  /** 总机柜数 */
  get masterListLen() {
    return ChannelStatus.masterListLen
  }

  /** 本次参与分选的机柜 */
  get masterActive() {
    return this.historyItem ? this.historyItem.masterIdArr : []
  }

  /** 计算各机柜通道总数 */
  get masterChTotal() {
    return this.historyItem
      ? this.historyItem.slaverIdArr.length *
          this.historyItem.channelIdArr.length
      : 0
  }

  /** 计算通道总数 */
  get channelTotal() {
    return this.historyItem
      ? this.historyItem.masterIdArr.length * this.masterChTotal
      : 0
  }

  /** 创建数据库连接 */
  async createDb(filePath: string | null) {
    try {
      if (this.historyFile !== filePath) {
        await this.closeDb()
        if (filePath) {
          const db = new HistoryDb(filePath)
          await db.connect()
          this.db = db
          this.getHistoryStep()
          this.historyFile = filePath
        }
      }
    } catch (err) {
      console.error(err)
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
      this.reset()
    }
  }

  /** 重置参数 */
  reset() {
    this.form.stepData = null
    this.nowBoxId = null
    this.$emit('storingResult', {
      list: [],
      levelResultList: [],
      boxResultList: [],
      boxLampResult: {}
    })
  }

  /** 历史文件获取工步 */
  async getHistoryStep() {
    if (this.db) {
      const data = await this.db.getWorkStep()
      const stepList = JSON.parse(data.stepList)
      this.workerList = stepsFormat(stepList, true)
      ;['masterId', 'slaverId', 'channelId'].forEach(idKey => {
        const idResult = idListFormat(data[`${idKey}s`])
        data[`${idKey}Arr`] = idResult.idArr
        data[`${idKey}ShowStr`] = idResult.idShowArr
      })
      this.historyItem = (data as unknown) as any
      this.nowBoxId = this.historyItem!.masterIdArr[0]
    }
  }

  /** 发送点灯 */
  async lampSbmit(list: ipcReq.LampSetOpts['list']) {
    await lampSet({
      list
    })
  }

  /** 一键关闭所有灯 */
  async lampCloseAll() {
    const masterTotal = {}
    for (let i = 0; i < this.masterListLen; i++) {
      masterTotal[i] = {}
    }
    await this.lampSbmit(masterTotal)
  }

  async getSortingConfig() {
    const result = await getStoreConfig({
      type: 'sorting'
    })
    if (result.status) {
      const data = result.data
      this.levelList = data.levelList
      this.levelAttr = data.levelAttr
    }
  }

  /** 触发分选 */
  async handleSorting(lampSet = false) {
    try {
      this.setLoading = true
      const selectLevel = this.form.levelId
      if (!this.historyItem || !this.db) {
        return this.$message.info('未选择启动历史')
      } else if (!this.form.stepData) {
        return this.$message.info('未选择工步')
      } else if (selectLevel.length === 0) {
        return this.$message.info('未设置分选等级')
      }
      const stepData = this.form.stepData
      // const levelList = this.levelList.filter(item => {
      //   return selectLevel.includes(item.id)
      // })
      const data = await this.db.getSorting({
        stepId: stepData.id,
        loopNum: stepData.loopNum,
        levelList: this.levelList,
        levelAttr: this.levelAttr
      })

      const total = this.channelTotal
      const sortingResult = data.sortingResult

      const channelResult: {
        [key: string]: {
          [key: string]: {
            [key: string]: true
          }
        }
      } = {}

      /** 深度获取，如果不存在设置空对象 */
      const getDeep = (
        target: any,
        key: string | number,
        val = Object.create(null)
      ) => {
        let target2 = target[key]
        if (!target2) {
          target2 = val
          target[key] = target2
        }
        return target2
      }

      // 根据等级列表统计
      const levelResultList = this.levelList.map(item => {
        const levelResult = sortingResult[item.id]?.levelResult || []
        const num = levelResult.length
        // 已选中参与分选的等级
        if (selectLevel.includes(item.id)) {
          levelResult.forEach(item => {
            const master = getDeep(channelResult, item.masterId)
            const slaver = getDeep(master, item.slaverId)
            getDeep(slaver, item.channelId, item.fullId)
          })
        }
        return {
          id: item.id,
          desc: item.desc,
          num,
          total,
          percent: getPercent(num, total)
        }
      })

      // 根据机柜统计
      const boxResultList: SortingT.BoxResult[] = []
      const boxTotal = this.masterChTotal
      const boxLampResult: SortingT.BoxLampResult = {}
      // 循环机柜时获取符合等级的通道数量，并统计出分选亮灯的通道
      const getMasterResult = (masterId: number) => {
        let num = 0
        const masterObj = channelResult[masterId]
        const master = getDeep(boxLampResult, masterId) // 如果不存在，改主控为空对象！
        if (masterObj) {
          Object.entries(masterObj).forEach(slaverObj => {
            const slaver = getDeep(master, slaverObj[0], [])
            Object.entries(slaverObj[1]).forEach(channelObj => {
              num += 1
              slaver.push(Number(channelObj[0]))
            })
          })
        }
        return num
      }
      this.masterActive.forEach(masterId => {
        const num = getMasterResult(masterId)
        boxResultList.push({
          masterId,
          masterName: String(masterId + 1),
          num,
          total: boxTotal,
          percent: getPercent(num, boxTotal)
        })
      })

      this.$emit('storingResult', {
        list: data.list,
        levelResultList,
        boxResultList,
        boxLampResult
      })

      if (lampSet === true) {
        this.lampSbmit(boxLampResult)
      }
    } finally {
      this.setLoading = false
    }
  }

  nowBoxIdChange(masterId: number) {
    if (this.masterActive.includes(masterId)) {
      this.nowBoxId = masterId
    }
  }

  mounted() {
    this.getSortingConfig()
  }

  beforeDestroy() {
    this.closeDb()
  }
}
</script>
<style lang="scss" scoped>
.sorting-setting {
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
        border: 2px solid #969696;
        box-sizing: border-box;

        &.active {
          background-color: #fff;
          &.select {
            background-color: #0db2f9;
          }
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
