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
import { deepClone, setDeep } from '@/shared/utils'
import { getChannelList } from '@/renderer/ipc/channel'
import { SettingStatus } from './Setting'
import Vue from 'vue'

config.rawError = true

// const listObj = deepClone(channelList)

interface ChannelMap {
  [key: string]: {
    [key: string]: {
      [key: string]: Port.ChannelItem
    }
  }
}
interface SampMap {
  [key: string]: Port.SampItem
}

interface SetSamp {
  masterId: number
  samp: Port.SampItem
}

@Module({ dynamic: true, store, name: 'channel' })
export default class ChannelImpl extends VuexModule {
  public list: Port.MasterList | null = null
  public channelMap: ChannelMap | null = null
  public statusList = [
    // { name: '启动', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '重新启动', action: 'reset' },
    { name: '关闭', action: 'close' }
  ]
  public sampMap: SampMap = {}

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
        // channel.workerStart = item.start && item.end ? null : item.start
      })
    }
  }

  @Mutation
  SET_CHANNELLIST(list: Port.MasterList) {
    this.list = list
    const channelMap: any = {}
    Object.entries(this.list).forEach(([mKey, master]) => {
      Object.entries(master.slaverList).forEach(([sKey, slaver]) => {
        Object.entries(slaver.list).forEach(([cKey, channel]) => {
          channelMap[`${mKey}_${sKey}_${cKey}`] = channel
          // setDeep(channel, [mKey, sKey, cKey], channelMap)
        })
      })
    })
    this.channelMap = channelMap
  }

  @Mutation
  SET_SAMPMAP({ masterId, samp }: SetSamp) {
    const key = `${masterId}_${samp.slaverId}_${samp.channelId}`
    Vue.set(this.sampMap, key, samp)
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
