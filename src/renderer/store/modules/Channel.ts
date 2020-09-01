import { getModule, Module, config, VuexModule } from 'vuex-module-decorators'
import store from '@/renderer/store'
import { channelList } from '@/shared/config/port'
import { deepClone } from '@/shared/utils'

config.rawError = true

const listObj = deepClone(channelList)

@Module({ dynamic: true, store, name: 'channel' })
export default class ChannelImpl extends VuexModule {
  public list = listObj
  public statusList = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '重新启动', action: 'reset' },
    { name: '关闭', action: 'close' }
  ]
}

export const ChannelStatus = getModule(ChannelImpl)
