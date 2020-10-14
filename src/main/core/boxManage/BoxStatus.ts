import mainDb from '@/main/core/sqlite/MainDb'
import {
  WORKSTEPS_MAP,
  PROTECT,
  WORKSTEPS_TYPE_MAP,
  WORKSTEPSINPUT,
  CONTROL_CODE
} from '@/shared/config/port'
import {
  WORKER_STEP_MODEL,
  WORKER_SATUS_MODEL,
  WORKER_START_MODEL,
  COMMON_READ
} from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import { typedKeys } from '@/shared/utils'
import Bluebird from 'bluebird'
import logger from '@/main/core/Logger'
import communi from '@/main/core/Request/Communi'
import { BoxManage } from './BoxManage'

/** 机柜状态和工步通讯 */
export default class BoxStatus {
  parent: BoxManage
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  /** 写工步/并启动 */
  async writeSteps(data: ipcReq.WriteSteps) {
    const listLen = data.stepsList.length
    const slaverIds = data.slaverIds
    const channelIds = data.channelIds
    const masterIds = data.masterIds
    const projectId = await mainDb.workStart(data)
    masterIds.sort((a, b) => a - b)

    const writerModel = new BufModel({
      model: WORKER_STEP_MODEL,
      listLen: {
        protectList: 1,
        workerList: listLen
      }
    })

    writerModel.writerBit('slaverId', slaverIds)
    writerModel.writerBit('channelId', channelIds)
    writerModel.writer('projectId', projectId)
    writerModel.writer('workStart', data.startId)
    writerModel.writer('protectLen', 1)
    writerModel.writer('workerLen', listLen)
    writerModel.ecahList('protectList', writeItem => {
      PROTECT.forEach(item => {
        writeItem.writer(item.type, data.protect[item.type] || 0)
      })
      typedKeys(data.features).forEach(vKey => {
        writeItem.writer(`feature_${vKey}`, data.features[vKey] || 0)
      })
    })
    writerModel.ecahList('workerList', (writeItem, index) => {
      const item = data.stepsList[index]
      const step = WORKSTEPS_TYPE_MAP[item.type]
      if (!step || !step.input) {
        throw new Error(`step ${item.type} NO defind`)
      }
      writeItem.writer('workerId', index)
      writeItem.writer('workerCode', `0x${step.key}`)
      typedKeys(item.input).forEach(key => {
        const input = WORKSTEPSINPUT[key]
        if (input) {
          let value = item.input[key]
          const writeKey = input.type || key
          if (writeKey === 'loopStart') {
            value = Number(value) - 1
          }
          writeItem.writer(writeKey, value)
        }
      })
    })

    const channelInfo = {
      masterId: 0,
      channelIds,
      slaverIds
    }

    await Bluebird.mapSeries(masterIds, async (masterId: number) => {
      try {
        writerModel.writer('masterId', masterId)
        channelInfo.masterId = masterId
        logger.info('写工步', writerModel.buf.toString('hex'))
        await communi.post({
          control: CONTROL_CODE.stepsSet,
          data: writerModel.buf,
          masterId
        })

        this.parent.channelLog('启动成功', channelInfo)
      } catch (err) {
        this.parent.channelLog(`启动失败，${err.message}`, channelInfo)
      }
    })
    return true
  }

  readStepsInput(readItem: BufModel, key: string) {
    const inputItem = WORKSTEPSINPUT[key]
    const readKey = inputItem.type || key
    let data = readItem.read(readKey)
    if (readKey === 'loopStart') {
      data += 1
    }
    return {
      data,
      unit: inputItem.unit,
      name: inputItem.name,
      type: readKey
    }
  }

  /** 读工步 */
  async readSteps(opts: ipcReq.ReadSteps) {
    const masterId = opts.masterId
    const writeMdoel = new BufModel({
      model: COMMON_READ
    })
    writeMdoel.writer('masterId', opts.masterId)
    writeMdoel.writerBit('slaverBit', [opts.slaverId])
    writeMdoel.writerBit('channelBit', opts.channelId)

    let resultBuf: Buffer
    if (this.parent.isDev) {
      const b = `000000000001ff0000000000083000006400640064125c0a8c0003000000010000000000000000000001006400640064125c0a8c0003000000010000000000000000000002006400640064125c0a8c0003000000010000000000000000000003006400640064125c0a8c0003000000010000000000000000000004006400640064125c0a8c0003000000010000000000000000000005006400640064125c0a8c0003000000010000000000000000000006006400640064125c0a8c0003000000010000000000000000000007006400640064125c0a8c0003000000010000000000000000000000000000900000000a000000000000000000000000000000000000030000000000000100a100000000000100001388000000000000000000000000030000000000000200a2000000000dac00001388000000000000000000000000030000000000000300b000000000ea6000001388000000000000000000000000030000000000000400900000000a0000000000000000000000000000000000000300000000000005007000000000000000000000000000000000000000030000030000000000010000900000000a000000000000000000000000000000000000030000000000010100a100000000000100001388000000000000000000000000030000000000010200a2000000000dac00001388000000000000000000000000030000000000010300b000000000ea6000001388000000000000000000000000030000000000010400900000000a0000000000000000000000000000000000000300000000000105007000000000000000000000000000000000000000030000030000000000020000900000000a000000000000000000000000000000000000030000000000020100a100000000000100001388000000000000000000000000030000000000020200a2000000000dac00001388000000000000000000000000030000000000020300b000000000ea6000001388000000000000000000000000030000000000020400900000000a0000000000000000000000000000000000000300000000000205007000000000000000000000000000000000000000030000030000000000030000900000000a000000000000000000000000000000000000030000000000030100a100000000000100001388000000000000000000000000030000000000030200a2000000000dac00001388000000000000000000000000030000000000030300b000000000ea6000001388000000000000000000000000030000000000030400900000000a0000000000000000000000000000000000000300000000000305007000000000000000000000000000000000000000030000030000000000040000900000000a000000000000000000000000000000000000030000000000040100a100000000000100001388000000000000000000000000030000000000040200a2000000000dac00001388000000000000000000000000030000000000040300b000000000ea6000001388000000000000000000000000030000000000040400900000000a0000000000000000000000000000000000000300000000000405007000000000000000000000000000000000000000030000030000000000050000900000000a000000000000000000000000000000000000030000000000050100a100000000000100001388000000000000000000000000030000000000050200a2000000000dac00001388000000000000000000000000030000000000050300b000000000ea6000001388000000000000000000000000030000000000050400900000000a0000000000000000000000000000000000000300000000000505007000000000000000000000000000000000000000030000030000000000060000900000000a000000000000000000000000000000000000030000000000060100a100000000000100001388000000000000000000000000030000000000060200a2000000000dac00001388000000000000000000000000030000000000060300b000000000ea6000001388000000000000000000000000030000000000060400900000000a0000000000000000000000000000000000000300000000000605007000000000000000000000000000000000000000030000030000000000070000900000000a000000000000000000000000000000000000030000000000070100a100000000000100001388000000000000000000000000030000000000070200a2000000000dac00001388000000000000000000000000030000000000070300b000000000ea6000001388000000000000000000000000030000000000070400900000000a00000000000000000000000000000000000003000000000007050070000000000000000000000000000000000000000300000300000000` // eslint-disable-line
      resultBuf = Buffer.from(b, 'hex')
    } else {
      resultBuf = await communi.post({
        control: CONTROL_CODE.stepsRead,
        data: writeMdoel.buf,
        masterId
      })
      logger.info('读工步返回', resultBuf.toString('hex'))
    }

    const readModel = new BufModel({
      model: WORKER_STEP_MODEL,
      readBuf: resultBuf
    })
    const stepData = {}

    const getStepData = (channelId: number) => {
      if (!stepData[channelId]) {
        stepData[channelId] = {
          protect: {},
          stepList: []
        }
      }
      return stepData[channelId]
    }

    readModel.ecahList('protectList', readItem => {
      const channelId = readItem.read('channelId')
      const channelStep = getStepData(channelId)
      const protect = {}
      PROTECT.forEach(item => {
        protect[item.type] = readItem.read(item.type)
      })
      channelStep.protect = protect
    })

    readModel.ecahList('workerList', readItem => {
      const workerItem = WORKSTEPS_MAP[readItem.readHex('workerCode')]
      if (workerItem) {
        const input = workerItem.input
        const workerArr = input.other
          ? input.worker.concat(input.other)
          : input.worker
        const worker = workerArr.map(key => this.readStepsInput(readItem, key))
        const limt = input.limt.map(key => this.readStepsInput(readItem, key))
        const channelId = readItem.read('channelId')
        const channelStep = getStepData(channelId)
        channelStep.stepList.push({
          id: readItem.read('workerId'),
          type: workerItem.type,
          name: workerItem.name,
          worker,
          limt
        })
      }
    })
    return {
      stepData
    }
  }

  /** 设置状态 */
  async setStatus(data: any) {
    const control = CONTROL_CODE.status[data.status]
    if (!control) {
      throw new Error(`${data.status} Error`)
    }
    const slaverIds = data.slaverIdList || [data.slaverId]
    const channelIds = data.channelIdList || [data.channelId]
    const writerModel = new BufModel({
      model: data.status === 'start' ? WORKER_START_MODEL : WORKER_SATUS_MODEL
    })
    writerModel.writerBit('slaver', slaverIds)
    writerModel.writerBit('channel', channelIds)

    if (data.status === 'start') {
      writerModel.writer('startWorkerId', data.startId)
    }

    const list = data.masterIdList || [data.masterId]
    list.sort((a, b) => a - b)
    const channelInfo = {
      masterId: 0,
      channelIds,
      slaverIds
    }

    await Bluebird.mapSeries(list, async (masterId: number) => {
      try {
        writerModel.writer('masterId', masterId)
        channelInfo.masterId = masterId
        logger.info('改变状态', writerModel.buf.toString('hex'))
        await communi.post({
          control,
          data: writerModel.buf,
          masterId
        })
        this.parent.channelLog(`${control.name}成功`, channelInfo)
      } catch (err) {
        logger.warn(err)
        this.parent.channelLog(
          `${control.name}失败, ${err.message}`,
          channelInfo
        )
      }
    })
  }
}
