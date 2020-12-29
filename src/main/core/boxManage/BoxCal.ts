import NP from 'number-precision'
import { CONTROL_CODE } from '@/shared/config/port'
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
import RunPointQueue, { TypeQueueItem } from './libs/CalTypeQueue'
import handleError from '@/shared/config/handleError'

/** 机柜校准控制 */
export default class BoxCal {
  parent: BoxManage
  isCalRun = false // 校准是否运行中
  nowRunQueue: RunPointQueue | null = null

  constructor(parent: BoxManage) {
    this.parent = parent
  }

  /**
   * 设置校准
   *  @isCalTool 是否工装通讯
   *  */
  async setCal(opts: ipcReq.SetCalOpts, isCalTool = false) {
    const { calType, pointer, pointIndex } = opts
    let masterId = opts.masterId
    const abList = opts.abList || []
    const abListLen = abList.length
    let reqType: 'calTool' | null = null

    if (isCalTool) {
      masterId = CALTOOL_ID
      reqType = 'calTool'
    }

    const writeModel = new BufModel({
      model: CAL_SET_MODEL,
      listLen: {
        abList: abListLen
      }
    })
    writeModel.writer('type', opts.type) // 1：通道校准 2：设置AB值 3：工装校准 4：清除校准值
    writeModel.writer('masterId', masterId)
    writeModel.writer('slaverId', opts.slaverId)
    writeModel.writerBit('channelBit', opts.channelIds)
    if (calType) {
      writeModel.writerHex('calType', calType)
    }
    if (pointer) {
      writeModel.writer('pointer', Math.floor(NP.times(pointer, 1000)))
    }
    if (pointIndex) {
      writeModel.writer('pointIndex', pointIndex)
    }
    writeModel.ecahList('abList', (writeItem, index) => {
      const abItem = abList[index]
      writeItem.writer('channelId', abItem.channelId)
      writeItem.writerHex('calType', abItem.calType)
      writeItem.writer('range', abItem.pointIndex)
      writeItem.writer('a', abItem.a)
      writeItem.writer('b', abItem.b)
    })

    // writeModel.showAll()
    logger.debug('设置校准发送', writeModel.buf.toString('hex'))

    await communi.post({
      control: CONTROL_CODE.calibrateSet,
      data: writeModel.buf,
      masterId,
      requestType: reqType
    })
    // return true
    return
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
    const { pointer } = opts
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

    if (pointer) {
      writeModel.writer('pointer', Math.floor(NP.times(pointer, 1000)))
    }

    logger.debug('读校准发送', writeModel.buf.toString('hex'))

    const resultBuf = await communi.post({
      control: CONTROL_CODE.calibrateRead,
      data: writeModel.buf,
      masterId,
      requestType: reqType
    })

    // const resultBuf = Buffer.from(
    //   '00000102080000000000000100000000020000000003000000000400000000050000000006000000000700001a69',
    //   'hex'
    // )

    logger.debug('读校准返回', resultBuf.toString('hex'))

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

  /** 工装校准开始前 */
  async calToolBefore(ip: string) {
    await communi.tpcRequest.createCalTool(ip)
    configManage.userConfig.set('calibrateConfig.config.toolIp', ip)
  }

  /** 读工装校准 */
  async readCalTool(opts: ipcReq.CalToolReadSamp) {
    await this.calToolBefore(opts.config.ip)
    return await this.readCalSamp(opts.readCal, true)
  }

  /** 设置工装校准 */
  async setCalTool(opts: ipcReq.CalToolSet) {
    await this.calToolBefore(opts.config.ip)
    return await this.setCal(opts.setCal, true)
  }

  /** 获取读校准返回, 验证参数为空报错 */
  getCalResultSamp(
    result: CalibrateTB.CalResult,
    channelId: number,
    type: string
  ) {
    const item = result[channelId]
    if (item && item.samp !== null) {
      return item.samp
    }
    throw new handleError.TipsError(
      `${type}读通道:${channelId + 1} 没有返回采样`
    )
  }

  /** 开始校准队列 */
  setCalRunStatus(queue: RunPointQueue) {
    if (this.isCalRun === true) {
      throw new handleError.TipsError(`修调正在运行中`)
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
    const list: TypeQueueItem[] = []
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

  /** 连接工装ip */
  async connectToolIp(ip: string) {
    if (this.nowRunQueue && this.nowRunQueue.isRun) {
      throw new handleError.TipsError(`${this.nowRunQueue.runTypeName} 运行中`)
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
      throw new handleError.TipsError(
        `uRangeId:${config.uRangeId} or iRangeId:${config.iRangeId} Range undefined`
      )
    }

    this.saveConfig(config)
    await this.connectToolIp(config.toolIp)

    const queue = this.createCalTypeList({
      masterId,
      slaverId,
      calType: opts.calType,
      iRange: iRange.value,
      uRange: uRange.value
    })

    const runQueue = new RunPointQueue({
      boxCal: this,
      runType: 1,
      typeList: queue,
      standard: config.standard,
      masterId,
      slaverId,
      channelIds: channelId,
      sampTime: config.sampTime
    })
    this.setCalRunStatus(runQueue)
    return true
  }

  /** 复检 */
  async recheck(opts: ipcReq.CalRecheck) {
    const { config, recheckForm, iRange, uRange } = opts
    const { masterId, slaverId, channelId, toolIp } = config

    this.saveConfig(config, recheckForm)
    await this.connectToolIp(toolIp)

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
      channelIds: channelId,
      sampTime: config.sampTime
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
    return ipcManage.send('/calibrate/pointResult', result)
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
}
