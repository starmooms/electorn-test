<template>
  <div class="separat-setting">
    <div class="box-title">
      <h4 class="title">分选条件与执行</h4>
    </div>
    <div class="box-content">
      <el-form class="box-item data-type">
        <el-form-item>
          <el-radio-group v-model="form.dataType">
            <el-radio label="当前数据" value="nowData"></el-radio>
            <el-radio label="历史文件" value="history"></el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-input readonly v-model.trim="form.historyUrl">
            <template slot="append">
              <div class="historySelect" @click="historySelect">选择</div>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <el-form class="box-item data-type">
        <div class="form-title">分选工步</div>
        <el-form-item label="机柜">
          <el-select v-model="form.masterId">
            <el-option
              v-for="(item, index) in 20"
              :key="item"
              :label="`机柜${item}`"
              :value="index"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="工步">
          <el-select v-model="form.workerId">
            <el-option
              v-for="(item, index) in workerList"
              :key="item"
              :label="item"
              :value="index"
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
              :label="`${item.id}（${item.desc}）`"
              :value="index"
            ></el-option>
          </el-select>
          <el-button @click="configShowSet">条件设置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button>只分选</el-button>
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
            <div class="master-box">
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

    <history-dialog :show.sync="historyShow" />
  </div>
</template>

<script lang="ts">
import { getStoreConfig } from '@/renderer/ipc/storeConfig'
import { Component, Vue, Watch } from 'vue-property-decorator'
import LevelDialog from './LevelDialog.vue'
import HistoryDialog from './HistoryDialog.vue'

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
    workerId: null,
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

  workerList = []

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

  configShowSet() {
    this.configShow = true
  }

  historySelect() {
    this.historyShow = true
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

  mounted() {
    this.getSeparatConfig()
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
