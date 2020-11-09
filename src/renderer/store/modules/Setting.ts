import {
  Action,
  getModule,
  Module,
  Mutation,
  config,
  VuexModule
} from 'vuex-module-decorators'
import store from '@/renderer/store'
import { getStoreConfig } from '@/renderer/ipc/storeConfig'
import { sampSetReadStatus } from '@/renderer/ipc/channel'
config.rawError = true

@Module({ dynamic: true, store, name: 'setting' })
export default class SettingImpl extends VuexModule {
  public userConfig: StoreT.UserConfg | null = null
  public $readTranslate = false
  public mainDbPath = ''
  public titleBar = false

  get portPath() {
    return this.userConfig!.base.portPath
  }

  get base() {
    return this.userConfig!.base
  }

  get readTranslate() {
    return this.$readTranslate
  }

  get sampChartConfig() {
    return this.userConfig!.sampChartConfig
  }

  get historyFilePath() {
    return this.userConfig!.historyFilePath
  }

  @Mutation
  private SETREADTRANSLATE(status: boolean) {
    this.$readTranslate = status
  }

  @Mutation
  UPDATE_USERCONFIG(userConfig: StoreT.UserConfg) {
    this.userConfig = userConfig
  }

  /** 设置mainDb文件路径 */
  @Mutation
  UPDATE_MAINDBPATH(path: string) {
    this.mainDbPath = path
  }

  /** 设置titleBar是否显示 */
  @Mutation
  UPDATE_TITLEBAR(status: boolean) {
    this.titleBar = status
  }

  @Action
  public async getUserConfg() {
    let data: any
    try {
      data = await getStoreConfig({
        type: 'userConfig'
      })
      if (data.status) {
        this.context.commit('UPDATE_USERCONFIG', data.data)
      }
      return data
    } catch (err) {
      return data
    }
  }

  @Action
  async toggleReadTranslate() {
    const status = !this.readTranslate
    const data = await sampSetReadStatus({
      status
    })
    if (data.status) {
      this.context.commit('SETREADTRANSLATE', status)
    }
  }
}

export const SettingStatus = getModule(SettingImpl)
