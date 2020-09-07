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

// const listObj = deepClone(channelList)

@Module({ dynamic: true, store, name: 'channel' })
export default class ChannelImpl extends VuexModule {
  public list: Port.MasterList | null = null
  public statusList = [
    { name: '开始', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '重新启动', action: 'reset' },
    { name: '关闭', action: 'close' }
  ]

  public workerStatus = {
    vacant: '空置',
    pause: '暂停',
    stop: '停止',
    end: '完成',
    run: '运行',
    protect: '保护',
    error: '异常'
  }

  @Mutation
  UPDATE_CHANNELLIST(list: Port.ChannelChangeItem[]) {
    if (this.list) {
      list.forEach(item => {
        const channel = this.list![item.masterId].slaverList[item.slaverId].list[item.channelId] // eslint-disable-line
        channel.workerStart = item.start
      })
    }
  }

  @Mutation
  SET_CHANNELLIST(list: Port.MasterList) {
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
        this.context.commit('SET_CHANNELLIST', data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

export const ChannelStatus = getModule(ChannelImpl)
