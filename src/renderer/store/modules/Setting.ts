import {
  Action,
  getModule,
  Module,
  Mutation,
  MutationAction,
  config,
  VuexModule
} from 'vuex-module-decorators'
import store from '@/renderer/store'
import { getStoreConfig } from '@/renderer/ipc/storeConfig'
import { translateSet } from '@/renderer/ipc/channel'
config.rawError = true

interface UserConfig {
  sampling: {
    U: {
      max: number
      min: number
    }
    I: {
      max: number
      min: number
    }
  }
  base: {
    portPath: string
  }
}

@Module({ dynamic: true, store, name: 'app' })
export default class SettingImpl extends VuexModule {
  public userConfig: UserConfig | null = null
  public $readTranslate = false

  get sampling() {
    return this.userConfig!.sampling
  }

  get portPath() {
    return this.userConfig!.base.portPath
  }

  get base() {
    return this.userConfig!.base
  }

  get readTranslate() {
    return this.$readTranslate
  }

  @Mutation
  private SETREADTRANSLATE(status: boolean) {
    this.$readTranslate = status
  }

  @Mutation
  private UPDATE_USERCONFIG(userConfig: UserConfig) {
    this.userConfig = userConfig
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
    const data = await translateSet({
      path: this.portPath,
      status
    })
    if (data.status) {
      this.context.commit('SETREADTRANSLATE', status)
    }
  }
}

export const SettingStatus = getModule(SettingImpl)
SettingStatus.getUserConfg()
