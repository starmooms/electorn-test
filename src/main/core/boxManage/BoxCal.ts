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
import RunPointQueue from './CalQueue/CalTypeQueue'

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

// type NowRunQueue = ReturnType<BoxCal['calTypeRunQueue']>

/** 机柜校准控制 */
export default class BoxCal {
  parent: BoxManage
  isCalRun = false // 校准是否运行中
  nowRunQueue: RunPointQueue | null = null

  constructor(parent: BoxManage) {
    this.parent = parent
  }

  /** 设置校准 */
  async setCal(opts: CalibrateTB.SetCalOpts) {
    const { masterId, calType, pointer } = opts
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
    if (calType) {
      writerModel.writerHex('calType', calType)
    }
    if (pointer) {
      writerModel.writer('pointer', NP.times(pointer, 1000))
    }
    writerModel.ecahList('abList', (writeItem, index) => {
      const abItem = abList[index]
      writeItem.writer('channelId', abItem.channelId)
      writeItem.writerHex('calType', abItem.calType)
      writeItem.writer('range', abItem.pointIndex)
      writeItem.writer('a', abItem.a)
      writeItem.writer('b', abItem.b)
    })

    await communi.post({
      control: CONTROL_CODE.calibrateSet,
      data: writerModel.buf,
      masterId
    })
  }

  /**
   * 读校准
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

    const result: CalibrateTB.CalResult = {}
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

  /** 获取读校准返回, 验证参数为空报错 */
  getCalResultSamp(result: CalibrateTB.CalResult, channelId: number) {
    const item = result[channelId]
    if (item && item.samp !== null) {
      return item.samp
    }
    throw new Error(`read cal result channel:${channelId} Error`)
  }

  /** 开始校准队列 */
  setCalRunStatus(queue: RunPointQueue) {
    if (this.isCalRun === true) {
      throw new Error('Cal is Run now')
    }
    this.isCalRun = true
    this.nowRunQueue = queue
    this.nowRunQueue.start()
  }

  /** 停止校准 */
  async setCalRunStop() {
    if (this.nowRunQueue) {
      await this.nowRunQueue.stop()
    }
  }

  /** 触发停止校准 */
  stopCalEmit() {
    if (this.nowRunQueue && this.nowRunQueue.isRun === true) return
    this.nowRunQueue = null
    this.isCalRun = false
  }

  /** 计算校准ab值 */
  computedCalAB(x1: number, y1: number, x2: number, y2: number) {
    const a = NP.round(NP.divide(NP.minus(y2, y1), NP.minus(x2, x1)), 6)
    if (isNaN(a)) {
      throw new Error('computedAB a is NaN')
    }
    const b = NP.round(NP.minus(y1, NP.times(a, x1)), 6)
    return { a, b }
  }

  /** 保存设置 */
  saveConfig(
    config: CalibrateT.CalConfForm,
    recheck?: CalibrateTR.RecheckForm
  ) {
    configManage.userConfig.set('calibrateConfig.config', config)
    if (recheck) {
      configManage.userConfig.set('calibrateConfig.recheckForm', recheck)
    }
  }

  /** 创建校准类型队列 */
  createCalTypeList(params: CalibrateTB.CalCreateTypeList) {
    const { masterId, slaverId, iRange, uRange, calType } = params
    const list: CalTypeQueueItem[] = []
    CALIBRATE_TYPE.forEach(item => {
      if (calType.includes(item.type)) {
        const range = item.rangeType === 'A' ? iRange : uRange
        list.push({
          masterId,
          slaverId,
          calType: item.type,
          calTypeName: item.label,
          meanwhile: item.meanwhile,
          pointerList: [...range],
          unit: item.rangeType
        })
      }
    })
    return list
  }

  /** 根据歩长生成列表 */
  createForStep(start: number, end: number, step: number) {
    const list: number[] = []
    let i = start
    const stepM = NP.divide(step, 1000)
    while (i <= end) {
      list.push(i)
      i = NP.plus(i, stepM)
    }
    return list
  }

  /** 校准开始前 */
  async beforCalStart(ip: string) {
    if (this.nowRunQueue && this.nowRunQueue.isRun) {
      throw new Error(`${this.nowRunQueue.runTypeName} 运行中`)
    }
    await communi.tpcRequest.createCalTool(ip)
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

    this.saveConfig(opts.config)
    await this.beforCalStart(opts.config.toolIp)

    const queue = this.createCalTypeList({
      masterId,
      slaverId,
      calType: opts.calType,
      iRange: iRange.value,
      uRange: uRange.value
    })

    // queue, channelId, this
    const runQueue = new RunPointQueue({
      boxCal: this,
      runType: 1,
      typeList: queue,
      standard: opts.config.standard,
      masterId,
      slaverId,
      channelIds: channelId
    })
    this.setCalRunStatus(runQueue)
    return true
  }

  /** 复检 */
  async recheck(opts: ipcReq.CalRecheck) {
    const { config, recheckForm } = opts
    const { masterId, slaverId, channelId, toolIp } = config
    const iRange: number[] = this.createForStep(
      recheckForm.IStart,
      recheckForm.IEnd,
      recheckForm.IStep
    )
    const uRange: number[] = this.createForStep(
      recheckForm.UStart,
      recheckForm.UEnd,
      recheckForm.UStep
    )

    if (iRange.length === 0) {
      throw new Error('电流范围为0')
    } else if (uRange.length === 0) {
      throw new Error('电压范围为0')
    }

    this.saveConfig(config, recheckForm)
    await this.beforCalStart(toolIp)

    const queue = this.createCalTypeList({
      masterId,
      slaverId,
      calType: opts.calType,
      iRange: iRange,
      uRange: uRange
    })
    const runQueue = new RunPointQueue({
      boxCal: this,
      runType: 5,
      typeList: queue,
      standard: config.standard,
      masterId,
      slaverId,
      channelIds: channelId
    })
    this.setCalRunStatus(runQueue)
    return true
  }

  /** 发送校准列表 */
  sendCalResult(type: string, data: any) {
    const result = {
      data,
      type,
      info: this.nowRunQueue
        ? {
            isRun: this.nowRunQueue.isRun,
            runType: this.nowRunQueue.runType,
            runTypeName: this.nowRunQueue.runTypeName
          }
        : null
    }
    ipcManage.send('/calibrate/pointResult', () => {
      return result
    })
  }

  /** 离开页面时关闭工装 */
  async leavePage() {
    try {
      await this.setCalRunStop()
      await communi.tpcRequest.calToolClose()
    } catch (err) {
      logger.error('关闭工装失败')
    }
    return {
      isCalRun: this.isCalRun
    }
  }

  // /** 发送校准流程 */
  // sendCalResult(data: any) {

  // }
}
