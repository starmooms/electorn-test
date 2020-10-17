import { getCalList, CONTROL_CODE } from '@/shared/config/port'
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

  /** 设置校准 */
  async setLamp(opts: ipcReq.LampSetOpts) {
    await Bluebird.mapSeries(opts.list, async item => {
      try {
        const writeModel = new BufModel({
          model: LAMP_MODEL,
          listLen: {
            lampLen: item.slaverList.length
          }
        })
        const masterId = item.masterId
        writeModel.writer('masterId', item.masterId)
        writeModel.ecahList('lampList', (writeItem, index) => {
          const slaverItem = item.slaverList[index]
          writeItem.writer('slaverId', slaverItem.slaverId)
          writeItem.writerBit('channelBit', slaverItem.channelBit)
        })
        logger.debug('点灯发送', writeModel.buf.toString('hex'))
        await communi.post({
          control: CONTROL_CODE.lampSet,
          data: writeModel.buf,
          masterId
        })
      } catch (err) {
        logger.error('点灯失败', err)
      }
    })
    return true

    // const masterId = opts.masterId
    // const writerModel = new BufModel({
    //   model: LAMP_MODEL,
    //   listLen: {
    //     calList: 1
    //   }
    // })
    // writerModel.writer('calLen', 1)
    // writerModel.ecahList('calList', writerItem => {
    //   writerItem.writer('masterId', masterId)
    //   writerItem.writer('slaverId', opts.slaverId)
    //   writerItem.writer('channelId', opts.channelId)
    //   opts.list.forEach(item => {
    //     writerItem.writer(item.nameKey, item.value || 0)
    //   })
    // })
    // logger.debug('点灯发送', writerModel.buf.toString('hex'))
    // await communi.post({
    //   control: CONTROL_CODE.lampSet,
    //   data: writerModel.buf,
    //   masterId
    // })
  }
}
