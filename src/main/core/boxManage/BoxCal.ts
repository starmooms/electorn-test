import BoxManage from './BoxManage'
import { getCalList, CONTROL_CODE } from '@/shared/config/port'
import { CAL_MODEL, COMMON_READ } from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import logger from '@/main/core/Logger'

/** 机柜校准控制 */
export default class BoxCal {
  parent: BoxManage
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  /** 读校准 */
  async readCal(opts: ipcReq.CalOpts) {
    const masterId = opts.masterId
    const writeModel = new BufModel({
      model: COMMON_READ
    })
    writeModel.writer('masterId', masterId)
    writeModel.writerBit('slaverBit', [opts.slaverId])
    writeModel.writerBit('channelBit', [opts.channelId])

    let resultBuf: Buffer
    if (this.parent.isDev) {
      // resultBuf = Buffer.from('000001003f99999a00000000000000003dcccccd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003fb333330000000000000000000000000000000000000000000000000000000000000000', 'hex') // eslint-disable-line
        resultBuf = Buffer.from('0001000000e3388e3fe3380e4040555547408e38e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040f8e37e410e38da411ffff6411ffff7', 'hex') // eslint-disable-line
    } else {
      resultBuf = await this.parent.post({
        control: CONTROL_CODE.calRead,
        data: writeModel.buf,
        masterId
      })
    }

    const readModel = new BufModel({
      model: CAL_MODEL,
      readBuf: resultBuf
    })

    const list = getCalList()
    readModel.ecahList('calList', readItem => {
      list.forEach(item => {
        item.value = readItem.readFloat(item.nameKey)
      })
    })

    return { list }
  }

  /** 设置校准 */
  async setCal(opts: ipcReq.CalWriteOpts) {
    const masterId = opts.masterId
    const writerModel = new BufModel({
      model: CAL_MODEL,
      listLen: {
        calList: 1
      }
    })
    writerModel.writer('calLen', 1)
    writerModel.ecahList('calList', writerItem => {
      writerItem.writer('masterId', masterId)
      writerItem.writer('slaverId', opts.slaverId)
      writerItem.writer('channelId', opts.channelId)
      opts.list.forEach(item => {
        writerItem.writer(item.nameKey, item.value || 0)
      })
    })
    logger.info('写校准发送', writerModel.buf.toString('hex'))
    await this.parent.post({
      control: CONTROL_CODE.calSet,
      data: writerModel.buf,
      masterId
    })
  }
}
