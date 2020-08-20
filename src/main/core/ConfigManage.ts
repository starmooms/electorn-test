import Store from 'electron-store'
import ipcManage from './IpcManage'
import uuid from 'node-uuid'

/* eslint-disable quote-props */
// prettier-ignore
/* eslint-enable quote-props */

class ConfigManage {
  userConfig = new Store({
    name: 'user',
    defaults: {

    }
  })

  workStepTpl = new Store({
    name: 'workStepTpl',
    defaults: {
    }
  })

  constructor() {
    this.init()
  }

  init() {
    ipcManage.handle('/config/get', (event, data: any) => {
      switch (data.type) {
        case 'workStepTpl':
          return this.workStepTpl.store
        default:
          throw new Error(`${data.type} NO Found`)
      }
    })
    ipcManage.handle('/config/set', (event, data: any) => {
      if(!data.data) throw new Error('NO DATA')
      switch (data.type) {
        case 'workStepTpl':
          this.workStepTplSave(data.data)
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

  setWorkStepTpl(key: string, value:any) {
    return this.workStepTpl.set(key, value)
  }

  workStepTplSave(data: any) {
    if (data.id) {
      if (!data.name) throw new Error('name is no null')
      const has = this.workStepTpl.has(data.id)
      if (!has) throw new Error(`${data.id} Tpl No find`)

      this.workStepTpl.set(`${data.id}.name`, data.name)
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
