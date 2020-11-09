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
import configManage from '../ConfigManage'

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
    configManage.userConfig.set('historyFilePath', data.filePath)
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
          if (value !== null) {
            const writeKey = input.type || key
            if (writeKey === 'loopStart') {
              value = Number(value) - 1
            } else if (writeKey === 'time') {
              value = Number(value) * 60
            }
            writeItem.writer(writeKey, value)
          }
        }
      })
    })
    // writerModel.showAll()

    const channelInfo = {
      masterId: 0,
      channelIds,
      slaverIds
    }

    Bluebird.mapSeries(masterIds, async (masterId: number) => {
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

  // readStepsInput(readItem: BufModel, key: string) {
  //   const inputItem = WORKSTEPSINPUT[key]
  //   const readKey = inputItem.type || key
  //   let data = readItem.read(readKey)
  //   if (readKey === 'loopStart') {
  //     data += 1
  //   } else if (readKey === 'time') {
  //     data = data / 60
  //   }
  //   return {
  //     data,
  //     unit: inputItem.unit,
  //     name: inputItem.name,
  //     type: readKey
  //   }
  // }

  readStepsInputData(readItem: BufModel, key: string) {
    const inputItem = WORKSTEPSINPUT[key]
    const readKey = inputItem.type || key
    let data = readItem.read(readKey)
    if (readKey === 'loopStart') {
      data += 1
    } else if (readKey === 'time') {
      data = data / 60
    }
    return data
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
    if (this.parent.useDev) {
      const b = `0000000000010800000041000103000064006400640e740bb80001000186a00dac0d480d160ce40cb200000000b0000000000c80000003e8000000000000000000000000000000000000000100900000001e000000000000000000000000000000000000000000000000000200a3000000000e10000003e800000000000000000000000000000001f4` // eslint-disable-line
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
        // const input = workerItem.input
        // const workerArr = input.other
        //   ? input.worker.concat(input.other)
        //   : input.worker
        // const worker = workerArr.map(key => this.readStepsInput(readItem, key))
        // const limt = input.limt.map(key => this.readStepsInput(readItem, key))
        const inputAttr = workerItem.input
        const inputKey = [...inputAttr.worker, ...inputAttr.limt]
        const input = {}
        inputKey.forEach(key => {
          return (input[key] = this.readStepsInputData(readItem, key))
        })
        const channelId = readItem.read('channelId')
        const channelStep = getStepData(channelId)
        channelStep.stepList.push({
          id: readItem.read('workerId'),
          type: workerItem.type,
          name: workerItem.name,
          input
          // worker,
          // limt
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
