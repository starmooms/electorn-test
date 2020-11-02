import NP from 'number-precision'
import { getCalList, CONTROL_CODE } from '@/shared/config/port'
import {
  CAL_MODEL,
  COMMON_READ,
  CAL_SET_MODEL,
  CAL_READ_POST_MODEL,
  CAL_READ_MODEL
} from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import logger from '@/main/core/Logger'
import communi from '@/main/core/Request/Communi'
import { BoxManage } from './BoxManage'
import {
  CALIBRATE_TYPE,
  I_RANGE_OPTS,
  U_RANGE_OPTS
} from '@/shared/config/calibrate'
import ipcManage from '../IpcManage'

/** 修调类型队列 */
interface CalTypeQueueItem {
  masterId: number
  slaverId: number
  calType: string
  calTypeName: string
  meanwhile: boolean
  pointerList: number[]
  unit: string
}
/** 根据修调类型生成修调点队列 */
interface CalRangeQueueItem {
  channelIds: number[]
  rangeNum: number
  pointIndex: number
}

/** 机柜校准控制 */
export default class BoxCal {
  parent: BoxManage
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  // /** 读校准 */
  // async readCal(opts: ipcReq.CalOpts) {
  //   const masterId = opts.masterId
  //   const writeModel = new BufModel({
  //     model: COMMON_READ
  //   })
  //   writeModel.writer('masterId', masterId)
  //   writeModel.writerBit('slaverBit', [opts.slaverId])
  //   writeModel.writerBit('channelBit', [opts.channelId])

  //   let resultBuf: Buffer
  //   if (this.parent.useDev) {
  //     // resultBuf = Buffer.from('000001003f99999a00000000000000003dcccccd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003fb333330000000000000000000000000000000000000000000000000000000000000000', 'hex') // eslint-disable-line
  //       resultBuf = Buffer.from('0001000000e3388e3fe3380e4040555547408e38e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040f8e37e410e38da411ffff6411ffff7', 'hex') // eslint-disable-line
  //   } else {
  //     resultBuf = await communi.post({
  //       control: CONTROL_CODE.calRead,
  //       data: writeModel.buf,
  //       masterId
  //     })
  //   }

  //   const readModel = new BufModel({
  //     model: CAL_MODEL,
  //     readBuf: resultBuf
  //   })

  //   const list = getCalList()
  //   readModel.ecahList('calList', readItem => {
  //     list.forEach(item => {
  //       item.value = readItem.readFloat(item.nameKey)
  //     })
  //   })

  //   return { list }
  // }

  // /** 设置校准 */
  // async setCal(opts: ipcReq.CalWriteOpts) {
  //   const masterId = opts.masterId
  //   const writerModel = new BufModel({
  //     model: CAL_MODEL,
  //     listLen: {
  //       calList: 1
  //     }
  //   })
  //   writerModel.writer('calLen', 1)
  //   writerModel.ecahList('calList', writerItem => {
  //     writerItem.writer('masterId', masterId)
  //     writerItem.writer('slaverId', opts.slaverId)
  //     writerItem.writer('channelId', opts.channelId)
  //     opts.list.forEach(item => {
  //       writerItem.writer(item.nameKey, item.value || 0)
  //     })
  //   })
  //   logger.info('写校准发送', writerModel.buf.toString('hex'))
  //   await communi.post({
  //     control: CONTROL_CODE.calSet,
  //     data: writerModel.buf,
  //     masterId
  //   })
  // }

  /** 开始校准 */
  async start(opts: ipcReq.CalStart) {
    const { masterId, slaverId, channelId } = opts
    const writerModel = new BufModel({
      model: CAL_SET_MODEL,
      listLen: {
        abList: 0
      }
    })
    writerModel.writer('abLen', 0)
    writerModel.writer('type', 1) // 1：通道校准 2：设置AB值 3：工装校准 4：清除校准值
    writerModel.writer('masterId', masterId)
    writerModel.writer('slaverId', slaverId)

    const iRange = I_RANGE_OPTS.find(item => item.id === opts.iRangeId)
    const uRange = U_RANGE_OPTS.find(item => item.id === opts.uRangeId)
    if (!iRange || !uRange) {
      throw new Error(
        `uRangeId:${opts.uRangeId} or iRangeId:${opts.iRangeId} Range undefined`
      )
    }
    const queue: CalTypeQueueItem[] = []
    CALIBRATE_TYPE.forEach(item => {
      if (opts.calType.includes(item.type)) {
        const range = item.rangeType === 'a' ? iRange : uRange
        queue.push({
          masterId,
          slaverId,
          calType: item.type,
          calTypeName: item.label,
          meanwhile: item.meanwhile,
          pointerList: [...range.value],
          unit: item.rangeType
        })
      }
      // writerModel.writer('calType', calType)
      // writerModel.writerBit('channelBit', channelId)
      // writerModel.writer('pointer', )
    })
    const runQueue = this.calTypeRunQueue(queue, channelId, writerModel)
    runQueue.start()
    return true
  }

  /** 校准类型队列 */
  calTypeRunQueue(
    queue: CalTypeQueueItem[],
    channelIds: number[],
    writerModel: BufModel
  ) {
    const runQueue = {
      queue,
      start: () => {
        runQueue.next()
      },
      next: () => {
        if (queue.length <= 0) return
        const calTypeRun = queue.shift()
        if (!calTypeRun) return

        // 修调点队列
        const calRangeQueue: CalRangeQueueItem[] = []
        const addQueue = (
          channelIds: number[],
          rangeNum: number,
          index: number
        ) => {
          calRangeQueue.push({
            channelIds,
            rangeNum,
            pointIndex: index
          })
        }
        if (calTypeRun.meanwhile) {
          calTypeRun.pointerList.forEach((pointer, index) => {
            addQueue(channelIds, pointer, index)
          })
        } else {
          channelIds.forEach(channelId => {
            calTypeRun.pointerList.forEach((pointer, index) => {
              addQueue([channelId], pointer, index)
            })
          })
        }

        const rangeRunQueue = this.calRangeRunQueue(
          calRangeQueue,
          calTypeRun,
          writerModel,
          () => {
            runQueue.next()
          }
        )
        rangeRunQueue.next()
        return
      }
    }
    return runQueue
  }

  /** 校准修调点队列 */
  calRangeRunQueue(
    queue: CalRangeQueueItem[],
    calTypeRun: CalTypeQueueItem,
    writerModel: BufModel,
    cb: any
  ) {
    const { masterId, slaverId, calType, calTypeName, unit } = calTypeRun
    writerModel.writerHex('calType', calType)
    const resultCache: any = {}
    const getChannel = (channelId: number) => {
      let cache = resultCache[channelId]
      if (!cache) {
        cache = {}
        resultCache[channelId] = cache
      }
      return cache
    }

    const getPointResult = (channelId: number, pointIndex: number) => {
      const cache = getChannel(channelId)
      return (
        cache[pointIndex] || {
          samp: null,
          actual: null
        }
      )
    }

    const runQueue = {
      queue,
      lastPoint: null as null | CalRangeQueueItem,
      checkSendList: () => {
        // 计算ab值，发送区间列表
        const lastPoint = runQueue.lastPoint
        if (lastPoint && lastPoint.pointIndex > 0) {
          const point2Index = lastPoint.pointIndex
          const list = lastPoint.channelIds.map(channelId => {
            const point1 = getPointResult(channelId, point2Index - 1)
            const point2 = getPointResult(channelId, point2Index)
            const name1 = calTypeRun.pointerList[point2Index - 1]
            const name2 = calTypeRun.pointerList[point2Index]
            return {
              masterId,
              slaverId,
              channelId,
              calType,
              calTypeName,
              point1Name: `${name1}${unit}`,
              point1Result: point1,
              point2Name: `${name2}${unit}`,
              point2Result: point2,
              a: null,
              b: null,
              time: null
            }
          })
          this.sendCalResult(list)
        }
      },
      end: () => {
        cb()
      },
      start: () => {
        runQueue.next()
      },
      next: async () => {
        runQueue.checkSendList()
        const rangeItem = queue.shift()
        if (queue.length <= 0 || !rangeItem) {
          return runQueue.end()
        }

        const { channelIds, pointIndex } = rangeItem

        writerModel.writer('pointer', NP.times(rangeItem.rangeNum, 1000))
        try {
          await communi.post({
            control: CONTROL_CODE.calibrateSet,
            data: writerModel.buf,
            masterId
          })
          setTimeout(async () => {
            try {
              const sampResult = await this.readCalSamp({
                masterId,
                slaverId,
                channelIds,
                calType,
                type: 1
              })
              channelIds.forEach(channelId => {
                const cache = getChannel(channelId)
                const samp = sampResult[channelId]
                cache[pointIndex] = {
                  samp: samp?.samp,
                  actual: null
                }
              })
            } catch (err) {
              logger.error('calRangeRunQueue readSamp Error', err)
            } finally {
              runQueue.lastPoint = rangeItem
              runQueue.next()
            }
          }, 2000)
        } catch (err) {
          logger.error('calRangeRunQueue setPoint Error', err)
        }
      }
    }
    return runQueue
  }

  async readCalSamp(opts: ipcReq.CalReadSamp) {
    const writeModel = new BufModel({
      model: CAL_READ_POST_MODEL
    })
    const masterId = opts.masterId
    writeModel.writer('masterId', opts.masterId)
    writeModel.writer('slaverId', opts.slaverId)
    writeModel.writerBit('channelBit', opts.channelIds)
    writeModel.writer('readType', opts.type)
    writeModel.writerHex('calType', opts.calType)

    const resultBuf = await communi.post({
      control: CONTROL_CODE.calibrateRead,
      data: writeModel.buf,
      masterId
    })

    const readModel = new BufModel({
      model: CAL_READ_MODEL,
      readBuf: resultBuf
    })
    readModel.showAll()

    const result: any = {}
    const getChannel = (channelId: number) => {
      let resultItem = result[channelId]
      if (!resultItem) {
        resultItem = {
          samp: null as null | number,
          a: null as null | number,
          b: null as null | number
        }
        result[channelId] = resultItem
      }
      return resultItem
    }

    readModel.ecahList('sampList', readItem => {
      const item = getChannel(readItem.read('channelId'))
      item.samp = NP.divide(readItem.read('samp'), 10000)
    })
    readModel.ecahList('abList', readItem => {
      const item = getChannel(readItem.read('channelId'))
      item.a = readItem.read('a')
      item.b = readItem.read('b')
    })
    return result
  }

  /** 发送校准列表 */
  sendCalResult(data: any) {
    ipcManage.send('/calibrate/pointResult', () => {
      return data
    })
  }
}
