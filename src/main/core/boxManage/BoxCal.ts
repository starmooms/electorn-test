import NP from 'number-precision'
import { getCalList, CONTROL_CODE } from '@/shared/config/port'
import {
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
  U_RANGE_OPTS,
  CALTOOL_ID
} from '@/shared/config/calibrate'
import ipcManage from '../IpcManage'
import configManage from '../ConfigManage'
import dayjs from 'dayjs'
import { TIME_FORMAT } from '@/shared/utils'

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

/** 发送校准参数 */
interface SetCalOpts {
  /** 1：通道校准 2：设置AB值 3：工装校准 4：清除校准值 */
  type: number
  masterId: number
  slaverId: number
  channelIds: number[]
  /** 1：充电电压 2：充电电流 3：放电电流 */
  calType: string
  /** 电压/电流(修调点) */
  pointer?: number
  abList?: any[]
}

type NowRunQueue = ReturnType<BoxCal['calTypeRunQueue']>

/** 机柜校准控制 */
export default class BoxCal {
  parent: BoxManage
  isCalRun = false // 校准是否运行中
  nowRunQueue: NowRunQueue | null = null
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  /** 设置校准 */
  async setCal(opts: SetCalOpts) {
    const { masterId } = opts
    const abList = opts.abList || []
    const abListLen = abList.length
    const writerModel = new BufModel({
      model: CAL_SET_MODEL,
      listLen: {
        abList: abListLen
      }
    })
    writerModel.writer('type', opts.type) // 1：通道校准 2：设置AB值 3：工装校准 4：清除校准值
    writerModel.writer('abLen', abListLen)
    writerModel.writer('masterId', masterId)
    writerModel.writer('slaverId', opts.slaverId)
    writerModel.writerBit('channelBit', opts.channelIds)
    writerModel.writerHex('calType', opts.calType)
    writerModel.writer(
      'pointer',
      opts.pointer ? NP.times(opts.pointer, 1000) : 0
    )
    writerModel.ecahList('abList', (writeItem, index) => {
      const abItem = abList[index]
      writeItem.writer('channelId', abItem.channelId)
      writeItem.writerHex('calType', abItem.calType)
      writeItem.writer('range', abItem.pointIndex)
      writeItem.writer('a', abItem.a)
      writeItem.writer('a', abItem.b)
    })

    await communi.post({
      control: CONTROL_CODE.calibrateSet,
      data: writerModel.buf,
      masterId
    })
  }

  /** 开始校准队列 */
  setCalRunStatus(queue: NowRunQueue) {
    this.setCalRunStop()
    this.isCalRun = true
    this.nowRunQueue = queue
    this.nowRunQueue.start()
  }

  /** 停止校准 */
  setCalRunStop() {
    if (this.nowRunQueue) {
      this.nowRunQueue.stop()
    }
    this.nowRunQueue = null
    this.isCalRun = false
  }

  /** 计算校准ab值 */
  computedCalAB(x1: number, y1: number, x2: number, y2: number) {
    const a = NP.divide(NP.minus(y2, y1), NP.minus(x2, x1))
    const b = NP.minus(y1, NP.times(a, x1))
    return { a, b }
  }

  /** 开始校准 */
  async start(opts: ipcReq.CalStart) {
    const config = opts.config
    const { masterId, slaverId, channelId } = config
    const iRange = I_RANGE_OPTS.find(item => item.id === config.iRangeId)
    const uRange = U_RANGE_OPTS.find(item => item.id === config.uRangeId)
    if (!iRange || !uRange) {
      throw new Error(
        `uRangeId:${config.uRangeId} or iRangeId:${config.iRangeId} Range undefined`
      )
    }

    configManage.userConfig.set('calibrateConfig', opts.config)
    if (this.isCalRun) throw new Error('校准运行中')
    await communi.tpcRequest.createCalTool(config.toolIp)
    const queue: CalTypeQueueItem[] = []
    CALIBRATE_TYPE.forEach(item => {
      if (opts.calType.includes(item.type)) {
        const range = item.rangeType === 'A' ? iRange : uRange
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
    })
    const runQueue = this.calTypeRunQueue(queue, channelId, () => {
      this.setCalRunStop()
    })

    this.setCalRunStatus(runQueue)
    return true
  }

  /** 校准类型队列 */
  calTypeRunQueue(queue: CalTypeQueueItem[], channelIds: number[], cb: any) {
    const runQueue = {
      queue,
      isRun: false,
      nowRangeQueue: null as any,
      end: () => {
        cb()
      },
      start: () => {
        runQueue.isRun = true
        runQueue.next()
      },
      next: () => {
        if (queue.length === 0) {
          return runQueue.end()
        }
        const calTypeRun = queue.shift()!

        // 修调点队列
        const calRangeQueue: CalRangeQueueItem[] = []
        const addQueue = (
          rangeChannelId: number[],
          rangeNum: number,
          index: number
        ) => {
          calRangeQueue.push({
            channelIds: rangeChannelId,
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
          () => {
            runQueue.next()
          }
        )
        rangeRunQueue.start()
        runQueue.nowRangeQueue = rangeRunQueue
        return
      },
      stop: () => {
        runQueue.isRun = false
        if (runQueue.nowRangeQueue) {
          runQueue.nowRangeQueue.stop()
        }
      }
    }
    return runQueue
  }

  /** 校准修调点队列 */
  calRangeRunQueue(
    queue: CalRangeQueueItem[],
    calTypeRun: CalTypeQueueItem,
    cb: any
  ) {
    const { masterId, slaverId, calType, calTypeName, unit } = calTypeRun
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
      if (cache) {
        const pointerResult = cache[pointIndex]
        if (
          pointerResult &&
          pointerResult.samp != null &&
          pointerResult.actual != null
        ) {
          return pointerResult
        }
      }
      throw new Error(`pointerResult Error ${channelId}_${pointIndex}`)
    }

    const runQueue = {
      queue,
      isRun: false,
      timer: null as any,
      checkSendList: async (nowPoint: CalRangeQueueItem) => {
        // 计算ab值，发送区间列表
        const { pointIndex } = nowPoint
        if (pointIndex > 0) {
          const point1Index = pointIndex - 1
          const list = nowPoint.channelIds.map(channelId => {
            const point1 = getPointResult(channelId, point1Index)
            const point2 = getPointResult(channelId, pointIndex)
            const name1 = calTypeRun.pointerList[point1Index]
            const name2 = calTypeRun.pointerList[pointIndex]
            const { a, b } = this.computedCalAB(
              point1.samp,
              point1.actual,
              point2.samp,
              point2.actual
            )
            return {
              masterId,
              slaverId,
              channelId,
              pointIndex,
              calType,
              calTypeName,
              point1Name: `${name1}${unit}`,
              point1Result: point1,
              point2Name: `${name2}${unit}`,
              point2Result: point2,
              a,
              b,
              time: dayjs().format(TIME_FORMAT)
            }
          })
          this.sendCalResult(list)
        }
      },
      end: () => {
        cb()
      },
      start: () => {
        runQueue.isRun = true
        runQueue.next()
      },
      stop: () => {
        runQueue.isRun = false
        clearTimeout(runQueue.timer)
      },
      next: async () => {
        // if (!runQueue.isRun) return
        if (queue.length <= 0) {
          return runQueue.end()
        }
        const rangeItem = queue.shift()!

        const { channelIds, pointIndex } = rangeItem
        try {
          await this.setCal({
            type: 1,
            masterId,
            slaverId,
            channelIds,
            calType,
            pointer: rangeItem.rangeNum
          })

          runQueue.timer = setTimeout(async () => {
            try {
              const params = {
                masterId,
                slaverId,
                channelIds,
                calType,
                type: 1
              }

              const [sampResult, actualResult] = await Promise.all([
                this.readCalSamp(params),
                this.readCalSamp(params, true)
              ])
              channelIds.forEach(channelId => {
                const cache = getChannel(channelId)
                const samp = sampResult[channelId]
                const actual = actualResult[channelId]
                cache[pointIndex] = {
                  samp: samp?.samp,
                  actual: actual?.samp
                }
              })
              await runQueue.checkSendList(rangeItem)
            } catch (err) {
              logger.error('calRangeRunQueue readSamp Error', err)
            } finally {
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

  /** 读校准
   * @isCalTool 是否读工装
   */
  async readCalSamp(opts: ipcReq.CalReadSamp, isCalTool = false) {
    const writeModel = new BufModel({
      model: CAL_READ_POST_MODEL
    })
    let masterId = opts.masterId
    let reqType: undefined | 'calTool' = undefined
    if (isCalTool) {
      masterId = CALTOOL_ID
      reqType = 'calTool'
    }

    writeModel.writer('masterId', masterId)
    writeModel.writer('slaverId', opts.slaverId)
    writeModel.writerBit('channelBit', opts.channelIds)
    writeModel.writer('readType', opts.type)
    writeModel.writerHex('calType', opts.calType)

    const resultBuf = await communi.post({
      control: CONTROL_CODE.calibrateRead,
      data: writeModel.buf,
      masterId,
      requestType: reqType
    })

    const readModel = new BufModel({
      model: CAL_READ_MODEL,
      readBuf: resultBuf
    })
    // readModel.showAll()

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

  // /** 发送校准流程 */
  // sendCalResult(data: any) {

  // }
}
