import {
  getModule,
  Module,
  config,
  VuexModule,
  Action,
  Mutation
} from 'vuex-module-decorators'
import store from '@/renderer/store'
import { channelList } from '@/shared/config/port'
import { deepClone } from '@/shared/utils'
import { getChannelList } from '@/renderer/ipc/channel'
import { SettingStatus } from './Setting'

config.rawError = true

const listObj = deepClone(channelList)

@Module({ dynamic: true, store, name: 'channel' })
export default class ChannelImpl extends VuexModule {
  public list: Port.MasterList = listObj
  public statusList = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '重新启动', action: 'reset' },
    { name: '关闭', action: 'close' }
  ]

  @Mutation
  UPDATE_CHANNELLIST(list: Port.MasterList) {
    this.list = list
  }

  @Action
  public async getList() {
    let data: any
    try {
      data = await getChannelList({
        path: SettingStatus.portPath
      })
      if (data.status) {
        this.context.commit('UPDATE_CHANNELLIST', data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

export const ChannelStatus = getModule(ChannelImpl)
