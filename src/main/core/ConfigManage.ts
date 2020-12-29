import Store from 'electron-store'
import ipcManage from './IpcManage'
import uuid from 'node-uuid'

/* eslint-disable quote-props */
// prettier-ignore
/* eslint-enable quote-props */
const userConfigDefault: StoreT.UserConfg = {
  sampChartConfig: {
    y1: 'U',
    y2: 'I',
    y1Limt: {
      min: 0,
      max: 10000
    },
    y2Limt: {
      min: -6000,
      max: 6000
    }
  },
  calibrateConfig: {
    config: {
      toolIp: '',
      masterId: null,
      slaverId: null,
      channelId: [],
      standard: 0.0005,
      uRangeId: 0,
      iRangeId: 0,
      sampTime: 5
    },
    recheckForm: {
      IStep: null,
      IStart: null,
      IEnd: null,
      UStep: null,
      UStart: null,
      UEnd: null,
    }
  },
  historyFilePath: '',
  ipList: [],
  base: {
    requestType: 'Port',
    portPath: '',
    portMaster: []
  }
}

class ConfigManage {
  userConfig = new Store({
    name: 'user',
    defaults: userConfigDefault
  })

  /** 分容设置 */
  sortingConfig = new Store({
    name: 'sorting',
    defaults: {
      levelAttr: [],
      levelList: [] as any[]
    }
  })

  workStepTpl = new Store({
    name: 'workStepTpl',
    defaults: {}
  })

  constructor() {
    this.init()
  }

  init() {
    this.checkStore(this.userConfig, userConfigDefault)
    ipcManage.handle('/config/get', (event, data: any) => {
      switch (data.type) {
        case 'workStepTpl':
          return this.workStepTpl.store
        case 'sorting':
          return this.sortingConfig.store
        case 'userConfig':
          return this.userConfig.store
        default:
          throw new Error(`${data.type} NO Found`)
      }
    })
    ipcManage.handle('/config/set', (event, data: any) => {
      if (!data.data) throw new Error('NO DATA')
      switch (data.type) {
        case 'workStepTpl':
          this.workStepTplSave(data.data)
          break
        case 'sorting':
          if (!data.key) {
            this.sortingConfig.set(data.data)
          } else {
            this.sortingConfig.set(data.key, data.data)
          }
          break
        case 'userConfig':
          this.userConfig.set(data.key, data.data)
          break
        default:
          throw new Error(`${data.type} NO Found`)
      }
    })
    ipcManage.handle('/config/del', (event, data: any) => {
      if (!data.data) throw new Error('NO DATA')
      switch (data.type) {
        case 'workStepTpl':
          this.workStepTplDel(data.data)
          break
        default:
          throw new Error(`${data.type} NO Found`)
      }
    })
  }

  /**
   * 检查默认参数，
   * electron-store 已设置过的对象的属性， 如果新加默认属性会无效，这里强制添加新的默认参数
   * */
  checkStore(store: Store<any>, target: any, lastKey = '') {
    for (const key in target) {
      const storeKey = lastKey ? `${lastKey}.${key}` : key
      const v = store.get(storeKey)
      const defaultVal = target[key]
      if (v === void 0) {
        store.set(storeKey, defaultVal)
      } else if (typeof defaultVal === 'object') {
        this.checkStore(store, defaultVal, storeKey)
      }
    }
  }

  setWorkStepTpl(key: string, value: any) {
    return this.workStepTpl.set(key, value)
  }

  workStepTplSave(data: any) {
    if (data.id) {
      if (!data.name) throw new Error('name is no null')
      const has = this.workStepTpl.has(data.id)
      if (!has) throw new Error(`${data.id} Tpl No find`)
      ;['name', 'tplData'].forEach(key => {
        const val = data[key]
        if (val) {
          this.workStepTpl.set(`${data.id}.${key}`, val)
        }
      })
    } else {
      const id = uuid.v4().replace('-', '')
      this.setWorkStepTpl(id, {
        id,
        createTime: Date.now(),
        ...data
      })
    }
  }

  workStepTplDel(data: any) {
    this.workStepTpl.delete(`${data.id}`)
  }
}

const configManage = new ConfigManage()
export default configManage
