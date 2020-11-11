import { sysLog } from '../Logger'
import { channelList } from '@/shared/config/port'
import mainDb from '../sqlite/MainDb'
import is from 'electron-is'
import BoxSamp from './BoxSamp'
import BoxCal from './BoxCal'
import BoxStatus from './BoxStatus'
import BoxLamp from './BoxLamp'
import BoxMasterInfo from './BoxMasterInfo'
import communi from '../Request/Communi'
import BoxUpgrade from './BoxUpgrade'
import { getStaticChList } from '@/shared/config/channel'

interface PostOpts {
  timeout?: number
  data: Buffer
  control: {
    code: number
    name: string
  }
  masterId: number
}

/** 机柜管理 */
export class BoxManage {
  /** 是否读取采样 */
  sampIsRead = false
  channelList!: Port.MasterList
  noWorkerStatus = { name: '未知状态', status: 'error' }
  channelMap = new Map<string, Port.ChannelItem>()
  channelKeyName = {
    masterId: '机柜',
    slaverId: '丛控',
    channelId: '通道',
    slaverIds: '丛控',
    channelIds: '通道'
  }
  initChannelResolve!: Promise<any>
  useDev = is.dev() && communi.requestType === 'Port'
  /** 静态通道列表 */
  staticChList = getStaticChList()

  boxSamp = new BoxSamp(this)
  boxCal = new BoxCal(this)
  boxStatus = new BoxStatus(this)
  boxLamp = new BoxLamp(this)
  boxMasterInfo = new BoxMasterInfo(this)
  boxUpgrade = new BoxUpgrade(this)

  create() {
    this.initChannelResolve = this.initChannelStatusList()
    return this.initChannelResolve
  }

  channelLog(message: string, channelInfo?: Port.ChannelInfo) {
    let channelMsg = ''
    if (channelInfo) {
      ;['masterId', 'slaverId', 'channelId'].forEach(key => {
        if (channelInfo[key] != null) {
          channelMsg += `${this.channelKeyName[key]}${channelInfo[key] + 1}、`
        }
      })
      ;['slaverIds', 'channelIds'].forEach(key => {
        if (channelInfo[key]) {
          const idArr = channelInfo[key].map(id => id + 1)
          channelMsg += `${this.channelKeyName[key]}${idArr.join(',')}、`
        }
      })
    }
    sysLog.log(`${message} ${channelMsg}`)
  }

  /** 创建通道列表 */
  async initChannelStatusList() {
    if (this.channelList) {
      return this.channelList
    }
    this.channelList = channelList
    Object.entries(this.channelList).forEach(([, masterItem]) => {
      Object.entries(masterItem.slaverList).forEach(([, slaverItem]) => {
        Object.entries(slaverItem.list).forEach(([, channelItem]) => {
          this.channelMap.set(channelItem.fullId, channelItem)
        })
      })
    })
    const channelStatus = await mainDb.getChannelStatus()
    channelStatus.forEach((item: any) => {
      const channel = this.channelMap.get(item.fullId)
      if (channel) {
        channel.nowStatus = item.status
      }
    })
    return this.channelList
  }

  /** 获取列表 */
  async getChannelList() {
    await this.initChannelResolve
    return this.channelList
  }
}

const boxManage = new BoxManage()

export default boxManage
