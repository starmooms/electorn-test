import { sysLog } from '../Logger'
import { channelList } from '@/shared/config/port'
import mainDb from '../sqlite/MainDb'
import is from 'electron-is'

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
export default class BoxManage {
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
  isDev = is.dev()

  constructor() {
    this.initChannelResolve = this.initChannelStatusList()
  }

  /** 串口通讯 */
  async post({ timeout, data, masterId, control }: PostOpts): Promise<Buffer> {
    return Buffer.from([0x00])
    // return new Promise((resolve, reject) => {
    //   const agrData = agreement.createData({
    //     slaverId: 0xff,
    //     type: 0x02,
    //     masterId,
    //     code: control.code,
    //     data
    //   })
    //   let timer: NodeJS.Timeout // eslint-disable-line
    //   const sId = agrData.sId
    //   const setError = (msg: string) => {
    //     this.emitList.delete(sId)
    //     reject(new Error(`${this.port.path} POST Error：` + msg))
    //     this.checkOpen()
    //     clearTimeout(timer)
    //   }
    //   this.emitList.set(sId, ({ masterId, errCode, buf, originBuf }) => {
    //     if (errCode !== '00') {
    //       const errMsg = ERROR_STATUS[errCode]
    //       redisClient.saveError([
    //         {
    //           postBuf: agrData.buf.toString('hex'),
    //           backBuf: originBuf.toString('hex'),
    //           masterId,
    //           errCode,
    //           errMsg,
    //           action: control.name,
    //           createTime: dayjs().valueOf(),
    //           type: 'PostError'
    //         }
    //       ])
    //       setError(`Error_Code ${errMsg}`)
    //       return
    //     }
    //     resolve(buf)
    //     clearTimeout(timer)
    //   })
    //   const status = this.port.write(agrData.buf, err => {
    //     if (err) {
    //       logger.error(err)
    //       setError(`Writer_Error ${err.message}`)
    //     }
    //   })
    //   logger.info('port write', agrData.buf.toString('hex'))
    //   logger.info('write Status', status)
    //   timer = setTimeout(() => {
    //     setError('PORT Time Out')
    //   }, timeout || 2000)
    // })
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
}
