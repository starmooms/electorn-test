import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators'
import store from '@/renderer/store'
import { getStoreConfig } from '@/renderer/ipc/storeConfig'

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
}

@Module({ dynamic: true, store, name: 'app' })
export default class SettingImpl extends VuexModule {
  public userConfig: UserConfig | null = null

  get sampling() {
    return this.userConfig!.sampling
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
        console.log('data', data.data)
        this.context.commit('UPDATE_USERCONFIG', data.data)
      }
      return data
    } catch (err) {
      return data
    }
  }
}

export const SettingStatus = getModule(SettingImpl)
SettingStatus.getUserConfg()
