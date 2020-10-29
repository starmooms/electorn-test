import { CONTROL_CODE } from '@/shared/config/port'
import { LAMP_MODEL } from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import logger from '@/main/core/Logger'
import communi from '@/main/core/Request/Communi'
import { BoxManage } from './BoxManage'
import Bluebird from 'bluebird'

/** 机柜点灯控制 */
export default class BoxLamp {
  parent: BoxManage
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  /** 写点灯 */
  async setLamp(opts: ipcReq.LampSetOpts) {
    const boxList = Object.keys(opts.list).map(Number)
    let errorMsg = ''
    await Bluebird.mapSeries(boxList, async masterId => {
      try {
        const masterItem = opts.list?.[masterId]
        const writeModel = new BufModel({
          model: LAMP_MODEL,
          listLen: {
            lampList: 32
          }
        })
        writeModel.writer('lampLen', 32)
        writeModel.writer('masterId', masterId)
        writeModel.ecahList('lampList', (writeItem, sindex) => {
          const slaverId = sindex
          writeItem.writer('slaverId', slaverId)
          const channelList = masterItem?.[slaverId]
          if (channelList && channelList.length > 0) {
            writeItem.writerBit('channelBit', channelList)
          }
        })
        logger.debug(
          `点灯发送`,
          `box ${masterId}`,
          writeModel.buf.toString('hex')
        )
        await communi.post({
          control: CONTROL_CODE.lampSet,
          data: writeModel.buf,
          masterId
        })
      } catch (err) {
        logger.error('点灯失败', err)
        errorMsg += `机柜${masterId + 1} 点灯失败</br>`
      }
    })
    if (errorMsg) {
      throw new Error(errorMsg)
    }
    return true
  }
}
