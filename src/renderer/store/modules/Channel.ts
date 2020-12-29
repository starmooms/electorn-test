import {
  getModule,
  Module,
  config,
  VuexModule,
  Action,
  Mutation
} from 'vuex-module-decorators'
import store from '@/renderer/store'
import { getChannelList } from '@/renderer/ipc/channel'
import Vue from 'vue'
import { getStaticChList } from '@/shared/config/channel'
import { BoxManageT } from '@/types/BoxManageT'

config.rawError = true

// const listObj = deepClone(channelList)

interface ChannelMap {
  [key: string]: Port.ChannelItem
}
interface SampMap {
  [key: string]: SampTB.SampItem
}

interface SetSamp {
  masterId: number
  samp: SampTB.SampItem
}

@Module({ dynamic: true, store, name: 'channel' })
export default class ChannelImpl extends VuexModule {
  public list: Port.MasterList | null = null
  public channelMap: ChannelMap | null = null
  public masterListLen = 0
  public statusList = [
    // { name: '启动', action: 'start' },
    { name: '暂停', action: 'pause' },
    { name: '继续', action: 'continued' },
    { name: '重新启动', action: 'reset' },
    { name: '关闭', action: 'close' }
  ]
  public sampMap: SampMap = {}
  public staticChList = getStaticChList()

  /** 机柜静态总列表 */
  masterChList = this.staticChList.master
  /** 机柜连接列表 */
  masterConnectList: BoxManageT.MasterCnnect[] = []

  public workerStatus = {
    vacant: '空置',
    pause: '暂停',
    stop: '停止',
    end: '完成',
    run: '运行',
    protect: '保护',
    error: '异常'
  }

  /** 机柜列表，带连接状态 */
  get masterChStatusList() {
    return this.masterChList.map(item => {
      return {
        ...item,
        isConnect: this.masterConnectList.some(c => c.masterId === item.id)
      }
    })
  }

  @Mutation
  UPDATE_CHANNELLIST(list: Port.ChannelChangeItem[]) {
    if (this.channelMap) {
      list.forEach(item => {
        const channel = this.channelMap![`${item.masterId}_${item.slaverId}_${item.channelId}`] // eslint-disable-line
        if (channel) {
          channel.status = item.status
          channel.filePath = item.filePath
        }
      })
    }
  }

  @Mutation
  SET_CHANNELLIST(list: Port.MasterList) {
    this.list = list
    this.masterListLen = Object.keys(list).length
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

  @Mutation
  SET_MASTERCONNECT(list: BoxManageT.MasterCnnect[]) {
    this.masterConnectList = list
  }

  @Action
  public async getList() {
    let data: any
    try {
      data = await getChannelList()
      if (data.status) {
        this.context.commit('SET_CHANNELLIST', data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

export const ChannelStatus = getModule(ChannelImpl)
