import {
  Action,
  getModule,
  Module,
  Mutation,
  config,
  VuexModule
} from 'vuex-module-decorators'
import store from '@/renderer/store'
import { channelList } from '@/shared/config/port'
import { deepClone } from '@/shared/utils'

config.rawError = true

const listObj = deepClone(channelList)

@Module({ dynamic: true, store, name: 'channel' })
export default class ChannelImpl extends VuexModule {
  public list = listObj
}

export const ChannelStatus = getModule(ChannelImpl)
