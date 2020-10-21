import { CONTROL_CODE } from '@/shared/config/port'
import { LAMP_MODEL } from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import logger from '@/main/core/Logger'
import communi from '@/main/core/Request/Communi'
import { BoxManage } from './BoxManage'
import Bluebird from 'bluebird'
import configManage from '../ConfigManage'

/** 机柜主控控制 */
export default class BoxMasterInfo {
  parent: BoxManage
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  getTcpRequest() {
    if (!communi.tpcRequest) {
      throw new Error('未生成Tcp管理对象')
    }
  }

  getMasterInfo(list: string[]) {
    // if (!communi.tpcRequest) {
    //   throw new Error('未生成Tcp管理对象')
    // }
    // list.map(ip => {
    //   try {
    //     communi.tpcRequest!.getMasterInfo(ip)
    //   } catch (err) {
    //     logger.error(err)
    //   }
    // })
  }

  /** 获取ip列表 */
  getIpList() {
    const list: Store.IpListItem[] = configManage.userConfig.get('base.ipList')
    const resultList: IpConfigT.IpTcpItem[] = list.map(item => {
      let isConnect = false
      if (communi.tpcRequest) {
        const tcpClient = communi.tpcRequest.tcpMap.get(item.masterId)
        if (tcpClient) {
          isConnect = tcpClient.tcpClient.connecting
        }
      }
      return {
        ip: item.ip,
        masterId: item.masterId,
        isConnect
      }
    })
    return resultList
  }

  /** 删除ip */
  delIpItem(opts: any) {
    logger.info('??')
    const list: Store.IpListItem[] = configManage.userConfig.get('base.ipList')
    const index = list.findIndex(item => {
      return opts.masterId === item.masterId && opts.ip === item.ip
    })
    const ipItem = list[index]
    if (!ipItem) {
      throw new Error('查找不到对应项')
    }
    list.splice(index, 1)
    logger.debug(list)
    configManage.userConfig.set('base.ipList', list)
    return true
  }

  // /** 设置校准 */
  // async setLamp(opts: ipcReq.LampSetOpts) {
  //   const boxList: number[] = []
  //   for (let i = 0; i < 1; i++) {
  //     boxList.push(i)
  //   }
  //   const writeModel = new BufModel({
  //     model: LAMP_MODEL,
  //     listLen: {
  //       lampList: 32
  //     }
  //   })
  //   await Bluebird.mapSeries(boxList, async masterId => {
  //     try {
  //       writeModel.writer('masterId', masterId)
  //       writeModel.ecahList('lampList', (writeItem, sindex) => {
  //         const slaverId = sindex
  //         writeItem.writer('slaverId', slaverId)
  //         const channelList = opts.list?.[`${masterId}`]?.[`${slaverId}`]
  //         if (channelList && channelList.length > 0) {
  //           writeItem.writerBit('channelBit', channelList)
  //         }
  //       })
  //       logger.debug(
  //         `点灯发送`,
  //         `box ${masterId}`,
  //         writeModel.buf.toString('hex')
  //       )
  //       await communi.post({
  //         control: CONTROL_CODE.lampSet,
  //         data: writeModel.buf,
  //         masterId
  //       })
  //     } catch (err) {
  //       logger.error('点灯失败', err)
  //     }
  //   })
  //   return true
  // }
}
