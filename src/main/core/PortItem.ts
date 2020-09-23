import SerialPort from 'serialport'
import agreement, { ReadResult } from './Agreement'
import logger from './Logger'
import {
  WORKSTEPS_MAP,
  getCalList,
  channelList,
  PROTECT,
  WORKSTEPS_TYPE_MAP,
  WORKSTEPSINPUT,
  CHANNEL_ERR_STATUS,
  CHANNEL_STATUS,
  CHANNEL_STATUS_END,
  ERROR_STATUS,
  CONTROL_CODE
} from '@/shared/config/port'
import { BufWriteModel as BufWriteModel2 } from '../utils/bufModel'
import { Promise as Bluebird } from 'bluebird'

import winManager from './WinManager'
import ipcManage from './IpcManage'
import is, { mas } from 'electron-is'
import { typedKeys } from '@/shared/utils'
import redisClient, { RedisClient } from './redis/RedisClient'
import dayjs from 'dayjs'
import TransfromParser from '../utils/transfromParser'
import {
  WORKER_STEP_MODEL,
  WORKER_SATUS_MODEL,
  WORKER_START_MODEL,
  SAMP_MODEL,
  CAL_MODEL,
  COMMON_READ
} from '@/shared/model'
import NotifyUtil from '../utils/notifyUtil'
import mainDb from './sqlite/MainDb'
import historyDbCache from './sqlite/HistoryDBCache'
const isDev = is.dev()

interface MasterTranslate {
  masterId: number
  winArr: Set<string>
  // winEmitMap: Map<string, { slaverId: number }>
  close?: () => any
}

interface PostOpts {
  timeout?: number
  data: Buffer
  control: {
    code: number
    name: string
  }
  masterId: number
}

interface BaseOpts {
  slaverId: number
  channelId: number[]
  masterId: number
}

interface WStepsOpts {
  list: any[]
  protect: any
  slaverId: number[]
  channelId: number[]
  masterId: number
}

const SelfParser = TransfromParser

export default class PortItem {
  path: string
  port!: SerialPort
  parser!: TransfromParser
  sampIsRead = false
  translate = new Map<number, MasterTranslate>()
  emitList = new Map<string, (result: ReadResult) => any>()
  channelList!: Port.MasterList
  noWorkerStatus = { name: '未知工作状态', status: 'error' }

  // ipcNotify 控制
  closeNotify = new NotifyUtil()
  errorNotify = new NotifyUtil()
  openErrNotify = new NotifyUtil()
  channelMap = new Map<string, Port.ChannelItem>()

  constructor(path: string) {
    this.path = path
    this.created(path)
  }

  created(path: string) {
    logger.info('创建串口', path)
    const port = new SerialPort(path, {
      baudRate: is.dev() ? 115200 : 921600
    })
    const parser = new SelfParser({
      delimiter: agreement.getEnd()
    })
    port.pipe(parser)
    parser.on('data', buf => {
      logger.info('串口返回数据', buf.toString('hex'))
      this.errorNotify.notify()

      const result = agreement.readData(buf)
      if (this.emitList.has(result.sId)) {
        const fun = this.emitList.get(result.sId)
        if (fun) fun(result)
        this.emitList.delete(result.sId)
        return
      }
      logger.warn(`流水号回调${result.sId} 不存在`)
    })

    port.on('open', data => {
      logger.info('串口触发open', data)
      this.openErrNotify.notify()
      this.closeNotify.notify(`${this.path} 重连成功`)
    })

    port.on('error', err => {
      logger.warn('串口触发error', err)
      this.errorNotify.error(`${this.path} ${err.message}`)
    })

    port.on('close', err => {
      logger.warn('串口触发close', err)
      this.closeNotify.error(`${this.path} 连接断开`)
    })
    this.port = port
    this.parser = parser
    return
  }

  checkOpen() {
    logger.info('port is open?', this.port.isOpen)
    if (!this.port.isOpen) {
      const path = this.port.path
      logger.warn(`串口${this.port.path}未开启，尝试开启`)
      this.port.open(err => {
        if (err) {
          logger.error(`${path} open Error`, err)
          this.openErrNotify.error(`${this.path}重连失败${err.message}`)
        }
      })
    }
  }

  /** 串口通讯 */
  post({ timeout, data, masterId, control }: PostOpts): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const agrData = agreement.createData({
        slaverId: 0xff,
        type: 0x02,
        masterId,
        code: control.code,
        data
      })
      let timer: NodeJS.Timeout // eslint-disable-line
      const sId = agrData.sId
      const setError = (msg: string) => {
        this.emitList.delete(sId)
        reject(new Error(`${this.port.path} POST Error：` + msg))
        this.checkOpen()
        clearTimeout(timer)
      }

      this.emitList.set(sId, ({ masterId, errCode, buf, originBuf }) => {
        if (errCode !== '00') {
          const errMsg = ERROR_STATUS[errCode]
          redisClient.saveError([
            {
              postBuf: agrData.buf.toString('hex'),
              backBuf: originBuf.toString('hex'),
              masterId,
              errCode,
              errMsg,
              action: control.name,
              createTime: dayjs().valueOf(),
              type: 'PostError'
            }
          ])
          setError(`Error_Code ${errMsg}`)
          return
        }
        resolve(buf)
        clearTimeout(timer)
      })
      const status = this.port.write(agrData.buf, err => {
        if (err) {
          logger.error(err)
          setError(`Writer_Error ${err.message}`)
        }
      })
      logger.info('port write', agrData.buf.toString('hex'))
      logger.info('write Status', status)

      timer = setTimeout(() => {
        setError('PORT Time Out')
      }, timeout || 2000)
    })
  }

  /** 写工步 */
  async writeSteps(data: ipcReq.WriteSteps) {
    const listLen = data.stepsList.length
    const slaverIds = data.slaverIds
    const channelIds = data.channelIds
    const masterIds = data.masterIds
    const projectId = await mainDb.workStart(data)

    const writerModel = new BufWriteModel2({
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

    await Bluebird.mapSeries(masterIds, async (masterId: number) => {
      writerModel.writer('masterId', masterId)
      logger.info('写工步', writerModel.buf.toString('hex'))
      await this.post({
        control: CONTROL_CODE.stepsSet,
        data: writerModel.buf,
        masterId
      })
    })
    return true
  }

  readStepsInput(readItem: BufWriteModel2, key: string) {
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
  async readSteps(opts: any) {
    const masterId = opts.masterId
    const writeMdoel = new BufWriteModel2({
      model: COMMON_READ
    })
    writeMdoel.writer('masterId', opts.masterId)
    writeMdoel.writerBit('slaverBit', [opts.slaverId])
    writeMdoel.writerBit('channelBit', opts.channelId)

    let resultBuf: Buffer
    if (isDev) {
      //const b = `00000000000108010503ea60ea60ea60ea600a8c00030000000000030000a10000000000010000138800000000000000000000000000000000000000000000030100a20000000013880000138800000000000000000000000000000000000000000000030200b000000000ea600000138800000000000000000000000000000000000000000000030300900000000a000000000000000000000000000000000000000000000000000000000304007000000000000000000000000000000000000000000003000000000000000000`
      // const b = `000000000001ff081e00ea60ea60ea60ea600a8c00030000000001ea60ea60ea60ea600a8c00030000000002ea60ea60ea60ea600a8c00030000000003ea60ea60ea60ea600a8c00030000000004ea60ea60ea60ea600a8c00030000000005ea60ea60ea60ea600a8c00030000000006ea60ea60ea60ea600a8c00030000000007ea60ea60ea60ea600a8c00030000000000000000a10000000000010000138800000000000000000000000000000000000000000000000100a20000000013880000138800000000000000000000000000000000000000000000000200b000000000ea600000138800000000000000000000000000000000000000000000000300900000000a00000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000000000300000000000000000000010000a10000000000010000138800000000000000000000000000000000000000000000010100a20000000013880000138800000000000000000000000000000000000000000000010200b000000000ea600000138800000000000000000000000000000000000000000000010300900000000a00000000000000000000000000000000000000000000000000000000010400700000000000000000000000000000000000000000000300000000000000000000030000a10000000000010000138800000000000000000000000000000000000000000000030100a20000000013880000138800000000000000000000000000000000000000000000030200b000000000ea600000138800000000000000000000000000000000000000000000030300900000000a00000000000000000000000000000000000000000000000000000000030400700000000000000000000000000000000000000000000300000000000000000000050000a10000000000010000138800000000000000000000000000000000000000000000050100a20000000013880000138800000000000000000000000000000000000000000000050200b000000000ea600000138800000000000000000000000000000000000000000000050300900000000a00000000000000000000000000000000000000000000000000000000050400700000000000000000000000000000000000000000000300000000000000000000060000a10000000000010000138800000000000000000000000000000000000000000000060100a20000000013880000138800000000000000000000000000000000000000000000060200b000000000ea600000138800000000000000000000000000000000000000000000060300900000000a00000000000000000000000000000000000000000000000000000000060400700000000000000000000000000000000000000000000300000000000000000000070000a10000000000010000138800000000000000000000000000000000000000000000070100a20000000013880000138800000000000000000000000000000000000000000000070200b000000000ea600000138800000000000000000000000000000000000000000000070300900000000a000000000000000000000000000000000000000000000000000000000704007000000000000000000000000000000000000000000003000000000000000000` // eslint-disable-line
      const b = `000000000001ff0000000000082800006400640064125c0a8c00030000000101006400640064125c0a8c00030000000102006400640064125c0a8c00030000000103006400640064125c0a8c00030000000104006400640064125c0a8c00030000000105006400640064125c0a8c00030000000106006400640064125c0a8c00030000000107006400640064125c0a8c00030000000100000000a10000000000010000138800000000000000000000000000000000000000000000000100a2000000000dac0000138800000000000000000000000000000000000000000000000200b000000000ea600000138800000000000000000000000000000000000000000000000300900000000a00000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000000000300000000030000000000010000a10000000000010000138800000000000000000000000000000000000000000000010100a2000000000dac0000138800000000000000000000000000000000000000000000010200b000000000ea600000138800000000000000000000000000000000000000000000010300900000000a00000000000000000000000000000000000000000000000000000000010400700000000000000000000000000000000000000000000300000000030000000000020000a10000000000010000138800000000000000000000000000000000000000000000020100a2000000000dac0000138800000000000000000000000000000000000000000000020200b000000000ea600000138800000000000000000000000000000000000000000000020300900000000a00000000000000000000000000000000000000000000000000000000020400700000000000000000000000000000000000000000000300000000030000000000030000a10000000000010000138800000000000000000000000000000000000000000000030100a2000000000dac0000138800000000000000000000000000000000000000000000030200b000000000ea600000138800000000000000000000000000000000000000000000030300900000000a00000000000000000000000000000000000000000000000000000000030400700000000000000000000000000000000000000000000300000000030000000000040000a10000000000010000138800000000000000000000000000000000000000000000040100a2000000000dac0000138800000000000000000000000000000000000000000000040200b000000000ea600000138800000000000000000000000000000000000000000000040300900000000a00000000000000000000000000000000000000000000000000000000040400700000000000000000000000000000000000000000000300000000030000000000050000a10000000000010000138800000000000000000000000000000000000000000000050100a2000000000dac0000138800000000000000000000000000000000000000000000050200b000000000ea600000138800000000000000000000000000000000000000000000050300900000000a00000000000000000000000000000000000000000000000000000000050400700000000000000000000000000000000000000000000300000000030000000000060000a10000000000010000138800000000000000000000000000000000000000000000060100a2000000000dac0000138800000000000000000000000000000000000000000000060200b000000000ea600000138800000000000000000000000000000000000000000000060300900000000a00000000000000000000000000000000000000000000000000000000060400700000000000000000000000000000000000000000000300000000030000000000070000a10000000000010000138800000000000000000000000000000000000000000000070100a2000000000dac0000138800000000000000000000000000000000000000000000070200b000000000ea600000138800000000000000000000000000000000000000000000070300900000000a000000000000000000000000000000000000000000000000000000000704007000000000000000000000000000000000000000000003000000000300000000` // eslint-disable-line
      //'000000000001010101000001000200030004000500060000000000000000a10000000000140000000a000000000000000000000000000000000000000000'
      // const b = '000000000000ff0300000000000000000000000000000000000000a10000000000de0000006f000000000000000000000000000000000000000000000100a200000000014d000001bc000000000000000000000000000000000000000000000200b000000000029a0000022b000000000000000000000000000000000000000000'  // eslint-disable-line
      // const b = '000000000001010000000000000000000000000000000000'
      resultBuf = Buffer.from(b, 'hex')
    } else {
      resultBuf = await this.post({
        control: CONTROL_CODE.stepsRead,
        data: writeMdoel.buf,
        masterId
      })
      logger.info('读工步返回', resultBuf.toString('hex'))
    }

    const readModel = new BufWriteModel2({
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

  /** 读采样 */
  readTranslate() {
    if (this.sampIsRead) return
    const masterId = 0
    const slaverId = 0

    const writeModel = new BufWriteModel2({
      model: COMMON_READ
    })
    writeModel.writer('masterId', masterId)
    writeModel.writerBit('slaverBit', [], 1)
    writeModel.writerBit('channelBit', [], 1)

    let oldSamp: MasterTranslate | undefined
    if (this.translate.has(masterId)) {
      oldSamp = this.translate.get(masterId)
      if (oldSamp && oldSamp.close) return
    }
    const samp: MasterTranslate = oldSamp || {
      masterId,
      winArr: new Set<string>()
    }
    if (!samp.winArr.has('mainWin')) {
      samp.winArr.add('mainWin')
    }
    let timer: NodeJS.Timeout
    let testKey = 0
    const getData = () => {
      timer = setTimeout(async () => {
        const translate = this.translate.get(masterId)

        try {
          let resultBuf: Buffer
          if (isDev) {
            // const a = '0000080001010000000000000001020000000000000000020200000000000000000302000000000000000004020000000000000000050200000000000000000602000000000000000007020000000000000000' // eslint-disable-line
            // 24
            // const t = Math.random() > 0.5 ? '03' : '00'
            // const a = `0000080000020000000000000000${t}00019000000affffff9c0000000201000014ffffff38000000030000001efffffed40000000402000028fffffe700000000502000032fffffe0c000000060200003cfffffda80000000702000046fffffd440000` // eslint-disable-line
            // const a = `0000080000900026080000000000000001900004a8000000000000000290000472fffffff500000003900004760000000000000004900006610000000000000005900004b2000000000000000690000489000000000000000790000dbe000003910000` // eslint-disable-line
            // const a = `00000800000000000000000000000000010000000afffffff60000000200000014ffffffec000000030000001effffffe20000000400000028ffffffd80000000500000032ffffffce000000060000003cffffffc40000000700000046ffffffba0000` // eslint-disable-line
            let t = Math.floor(Math.random() * 10)
            if (t >= 10) t = 0
            const d = t >= 5 ? '01' : '02'
            const d2 = testKey % 20 === 0 ? '00' : '01'
            const g = String(t)
            testKey += 1
            // const a = `00000008010000a1000${g}0000000${g}0000000000000100000204000000000000000000020000000000000000000000000003${d2}${d}0${g}0000000${g}00000000000004000000000000000000000000000500000000000000000000000000060000000000000000000000000007000000000000000000000000000100010000000000000000` // eslint-disable-line
            // const a = `000008000000900307360000055f00000001030405f7000005b700000002030405da0000058f00000003020005f400000000000000040200079a0000000000000005020006060000000000000006020005be000000000000000702000cf4000002ad0000` // eslint-disable-line
            // const a = `00000008010000a101000000000000000000000001000100000000000000000000000000010002000000000000000000000000000100030000000000000000000000000001000400000000000000000000000000010005000000000000000000000000000100060000000000000000000000000001000700000000000000000000000000010100000000000000000000000000010100000000000000000000000001020000000000000000000000000103000000000000000000000000010400000000000000000000000001050000000000000000000000000106000000000000000000000000010700000000000000000000000002000000000000000000000000000201000000000000000000000000020200000000000000000000000002030000000000000000000000000204000000000000000000000000020500000000000000000000000002060000000000000000000000000207000000000000000000000000030000000000000000000000000003010000000000000000000000000302000000000000000000000000030300000000000000000000000003040000000000000000000000000305000000000000000000000000030600000000000000000000000003070000000000000000000000000400000000000000000000000000040100000000000000000000000004020000000000000000000000000403000000000000000000000000040400000000000000000000000004050000000000000000000000000406000000000000000000000000040700000000000000000000000005000000000000000000000000000501000000000000000000000000050200000000000000000000000005030000000000000000000000000504000000000000000000000000050500000000000000000000000005060000000000000000000000000507000000000000000000000000060000000000000000000000000006010000000000000000000000000602000000000000000000000000060300000000000000000000000006040000000000000000000000000605000000000000000000000000060600000000000000000000000006070000000000000000000000000700000000000000000000000000070100000000000000000000000007020000000000000000000000000703000000000000000000000000070400000000000000000000000007050000000000000000000000000706000000000000000000000000070700000000000000000000000008000000000000000000000000000801000000000000000000000000080200000000000000000000000008030000000000000000000000000804000000000000000000000000080500000000000000000000000008060000000000000000000000000807000000000000000000000000090000000000000000000000000009010000000000000000000000000902000000000000000000000000090300000000000000000000000009040000000000000000000000000905000000000000000000000000090600000000000000000000000009070000000000000000000000000a000000000000000000000000000a010000000000000000000000000a020000000000000000000000000a030000000000000000000000000a040000000000000000000000000a050000000000000000000000000a060000000000000000000000000a070000000000000000000000000b000000000000000000000000000b010000000000000000000000000b020000000000000000000000000b030000000000000000000000000b040000000000000000000000000b050000000000000000000000000b060000000000000000000000000b070000000000000000000000000c000000000000000000000000000c010000000000000000000000000c020000000000000000000000000c030000000000000000000000000c040000000000000000000000000c050000000000000000000000000c060000000000000000000000000c070000000000000000000000000d000000000000000000000000000d010000000000000000000000000d020000000000000000000000000d030000000000000000000000000d040000000000000000000000000d050000000000000000000000000d060000000000000000000000000d070000000000000000000000000e000000000000000000000000000e010000000000000000000000000e020000000000000000000000000e030000000000000000000000000e040000000000000000000000000e050000000000000000000000000e060000000000000000000000000e070000000000000000000000000f000000000000000000000000000f010000000000000000000000000f020000000000000000000000000f030000000000000000000000000f040000000000000000000000000f050000000000000000000000000f060000000000000000000000000f07000000000000000000000000100000000000000000000000000010010000000000000000000000001002000000000000000000000000100300000000000000000000000010040000000000000000000000001005000000000000000000000000100600000000000000000000000010070000000000000000000000001100000000000000000000000000110100000000000000000000000011020000000000000000000000001103000000000000000000000000110400000000000000000000000011050000000000000000000000001106000000000000000000000000110700000000000000000000000012000000000000000000000000001201000000000000000000000000120200000000000000000000000012030000000000000000000000001204000000000000000000000000120500000000000000000000000012060000000000000000000000001207000000000000000000000000130000000000000000000000000013010000000000000000000000001302000000000000000000000000130300000000000000000000000013040000000000000000000000001305000000000000000000000000130600000000000000000000000013070000000000000000000000001400000000000000000000000000140100000000000000000000000014020000000000000000000000001403000000000000000000000000140400000000000000000000000014050000000000000000000000001406000000000000000000000000140700000000000000000000000015000000000000000000000000001501000000000000000000000000150200000000000000000000000015030000000000000000000000001504000000000000000000000000150500000000000000000000000015060000000000000000000000001507000000000000000000000000160000000000000000000000000016010000000000000000000000001602000000000000000000000000160300000000000000000000000016040000000000000000000000001605000000000000000000000000160600000000000000000000000016070000000000000000000000001700000000000000000000000000170100000000000000000000000017020000000000000000000000001703000000000000000000000000170400000000000000000000000017050000000000000000000000001706000000000000000000000000170700000000000000000000000018000000000000000000000000001801000000000000000000000000180200000000000000000000000018030000000000000000000000001804000000000000000000000000180500000000000000000000000018060000000000000000000000001807000000000000000000000000190000000000000000000000000019010000000000000000000000001902000000000000000000000000190300000000000000000000000019040000000000000000000000001905000000000000000000000000190600000000000000000000000019070000000000000000000000001a000000000000000000000000001a010000000000000000000000001a020000000000000000000000001a030000000000000000000000001a040000000000000000000000001a050000000000000000000000001a060000000000000000000000001a070000000000000000000000001b000000000000000000000000001b010000000000000000000000001b020000000000000000000000001b030000000000000000000000001b040000000000000000000000001b050000000000000000000000001b060000000000000000000000001b070000000000000000000000001c000000000000000000000000001c010000000000000000000000001c020000000000000000000000001c030000000000000000000000001c040000000000000000000000001c050000000000000000000000001c060000000000000000000000001c070000000000000000000000001d000000000000000000000000001d010000000000000000000000001d020000000000000000000000001d030000000000000000000000001d040000000000000000000000001d050000000000000000000000001d060000000000000000000000001d070000000000000000000000001e000000000000000000000000001e010000000000000000000000001e020000000000000000000000001e030000000000000000000000001e040000000000000000000000001e050000000000000000000000001e060000000000000000000000001e070000000000000000000000001f000000000000000000000000001f010000000000000000000000001f020000000000000000000000001f030000000000000000000000001f040000000000000000000000001f050000000000000000000000001f060000000000000000000000001f07000000000000000000000000` // eslint-disable-line
            const a = `0000000800000000a100000048600000359800000000000000000000000001000001a10000003bb90000396400000000000000000000000001000002020000003b3d0000396e00000000000000000000000000000003020000003ba00000396400000000000000000000000000000004020000004c630000385c00000000000000000000000000000005020000003c7300003a9700000000000000000000000000000006020000003ad0000038c100000000000000000000000000000007020000008191000000000000000000000000000000000000` // eslint-disable-line
            resultBuf = Buffer.from(a, 'hex')
          } else {
            logger.info('读采样发送', writeModel.buf.toString('hex'))
            resultBuf = await this.post({
              control: CONTROL_CODE.sampRead,
              data: writeModel.buf,
              masterId
            })
            logger.info('读采样返回', resultBuf.toString('hex'))
          }

          const readModel = new BufWriteModel2({
            model: SAMP_MODEL,
            readBuf: resultBuf
          })

          const nowUnix = dayjs().unix()
          const nowTime = dayjs().valueOf()
          const list: any[] = []
          const channelStatus: Port.ChannelChangeItem[] = []
          const channelStatusMap: Port.ChannelChangeMap = {}
          const changeFilePath: Port.ChannelChangeItem[] = []
          const saveSampData: Port.SaveSampData = {}

          readModel.ecahList('sampList', readItem => {
            const workerCode = readItem.readHex('workerCode')
            const errCode = readItem.readHex('errCode')
            const samp: Port.SampItem = {
              masterId: masterId,
              slaverId: readItem.read('slaverId'),
              channelId: readItem.read('channelId'),
              workerCode: workerCode,
              workerId: readItem.read('workerId'),
              U: readItem.read('U') / 10,
              I: readItem.read('I') / 10,
              vol: readItem.read('vol') / 10,
              epower: readItem.read('epower') / 10,
              projectId: readItem.read('projectId'),
              loopNum: readItem.read('loopNum'),
              errorCode: errCode,
              errorMsg: errCode !== '00' ? CHANNEL_ERR_STATUS[errCode] : '',
              workerStatus: CHANNEL_STATUS[workerCode] || this.noWorkerStatus,
              createTime: nowUnix
            }
            list.push(samp)
            // const channel = this.channelList[masterId].slaverList[samp.slaverId].list[samp.channelId] // eslint-disable-line
            const channel = this.channelMap.get(`${masterId}_${samp.slaverId}_${samp.channelId}`) // eslint-disable-line
            if (!channel) {
              logger.error(
                `spam channel ${masterId}_${samp.slaverId}_${samp.channelId} no found`
              )
              return
            }
            const lastSamp = channel.samp // eslint-disable-line
            channel.samp = samp
            if (samp.projectId === 0) return

            let shouldSaveSamp = false // 是否保存采样
            let nowStatus = channel.nowStatus // 通道状态
            let changeChannel: Port.ChannelChangeItem | null = null

            // 判断状态变化
            if (
              !nowStatus ||
              !lastSamp ||
              lastSamp.workerCode !== samp.workerCode
            ) {
              const lastStatus = channel.nowStatus
              nowStatus = CHANNEL_STATUS_END.includes(samp.workerCode) ? 'END' : 'RUN' // eslint-disable-line
              if (lastStatus !== nowStatus) {
                shouldSaveSamp = true
                channel.nowStatus = nowStatus
                channel.filePath = historyDbCache.getFilePath(samp.projectId)
                changeChannel = {
                  masterId,
                  slaverId: samp.slaverId,
                  channelId: samp.channelId,
                  time: nowTime,
                  status: nowStatus,
                  filePath: channel.filePath
                }
                const projectId = samp.projectId
                if (!channelStatusMap[projectId]) {
                  channelStatusMap[projectId] = []
                }
                channelStatusMap[projectId].push(changeChannel)
                channelStatus.push(changeChannel)
              }
            }

            // 判断是否需要存储采样
            if (!shouldSaveSamp) {
              if (!lastSamp) {
                shouldSaveSamp = true
              } else if (nowStatus === 'RUN') {
                const saveConf = historyDbCache.getSaveConf(samp.projectId)
                if (!saveConf) {
                  shouldSaveSamp = true
                } else {
                  if (!channel.filePath) {
                    channel.filePath = historyDbCache.getFilePath(
                      samp.projectId
                    )
                    changeFilePath.push({
                      masterId,
                      slaverId: samp.slaverId,
                      channelId: samp.channelId,
                      time: nowTime,
                      filePath: channel.filePath,
                      status: channel.nowStatus!
                    })
                  }
                  if (
                    !channel.lastSaveTime ||
                    nowTime - channel.lastSaveTime >= saveConf.time
                  ) {
                    shouldSaveSamp = true
                  } else if (saveConf.I && lastSamp.I - samp.I >= saveConf.I) {
                    shouldSaveSamp = true
                  } else if (saveConf.U && lastSamp.U - samp.U >= saveConf.U) {
                    shouldSaveSamp = true
                  }
                }
              }
            }

            if (shouldSaveSamp) {
              if (!saveSampData[samp.projectId]) {
                saveSampData[samp.projectId] = []
              }
              channel.lastSaveTime = nowTime
              const saveSampItem = saveSampData[samp.projectId]
              saveSampItem.push(samp)
            }
          })

          const errorList: Port.SampErrorItem[] = []
          readModel.ecahList('errorList', readItem => {
            const errCode = readItem.readHex('errCode')
            errorList.push({
              masterId: readItem.read('masterId'),
              slaverId: readItem.read('slaverId'),
              channelId: readItem.read('channelId'),
              action: '实时数据错误列表返回',
              errCode,
              params1: readItem.readHex('params1'),
              params2: readItem.readHex('params2'),
              createTime: nowTime,
              type: 'SampError',
              errMsg: ERROR_STATUS[errCode]
            })
          })

          // // logger.info('存储redis', readModel.buf.toString('hex'))
          // await redisClient.setSamp(masterId, list)
          // if (channelStatus.length > 0) {
          //   await redisClient.channelSetStart(this.port.path, channelStatus)
          //   ipcManage.commonMsg('updateChannelList', channelStatus)
          // }

          const saveSampList = Object.entries(saveSampData).map(
            ([key, val]) => {
              return {
                projectId: Number(key),
                sampList: val,
                changeStatusList: channelStatusMap[key] || []
              }
            }
          )

          await historyDbCache.saveSamp(saveSampList)
          if (channelStatus.length > 0 || changeFilePath.length > 0) {
            await mainDb.saveChannelStatus(channelStatus)
            ipcManage.commonMsg('updateChannelList', [
              ...channelStatus,
              ...changeFilePath
            ])
          }

          // await mainDb.saveChannelStatus(channelStatus)

          if (errorList.length > 0) {
            redisClient.saveError(errorList)
          }

          if (translate) {
            const winArr = translate.winArr
            winArr.forEach(winName => {
              const win = winManager.getWin(winName)
              if (win) {
                ipcManage.send(
                  `/port/translate/${encodeURIComponent(
                    this.path
                  )}/${masterId}`,
                  () => {
                    return { list }
                  },
                  win
                )
              }
            })
          }
        } catch (err) {
          logger.warn(err)
        } finally {
          if (translate && translate.close) {
            getData()
          }
        }
      }, 1000)
    }
    getData()
    samp.close = () => {
      clearTimeout(timer)
      samp.close = undefined
      this.sampIsRead = false
    }
    this.sampIsRead = true
    this.translate.set(masterId, samp)
  }

  /** 停止读采样 */
  stopTranslate() {
    const masterId = 0
    const samp = this.translate.get(masterId)
    if (samp && samp.close) {
      samp.close()
    }
  }

  /** 添加win */
  emitTranslate(opts: any) {
    const masterId = 0 // opts.masterId
    const winName = opts.winName
    const translate = this.translate.get(masterId)
    let winArr: Set<string>
    if (translate) {
      winArr = translate.winArr
      translate.winArr.add(winName)
    } else {
      winArr = new Set([winName])
      this.translate.set(masterId, {
        masterId,
        winArr
      })
    }
    return () => {
      winArr.delete(winName)
    }
  }

  async setCal(opts: any) {
    const masterId = opts.masterId
    const writerModel = new BufWriteModel2({
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
    await this.post({
      control: CONTROL_CODE.calSet,
      data: writerModel.buf,
      masterId
    })
  }

  /** 读校准 */
  async readCal(opts: any) {
    const masterId = opts.masterId
    const writeModel = new BufWriteModel2({
      model: COMMON_READ
    })
    writeModel.writer('masterId', masterId)
    writeModel.writerBit('slaverBit', [opts.slaverId])
    writeModel.writerBit('channelBit', [opts.channelId])

    let resultBuf: Buffer
    if (isDev) {
      // resultBuf = Buffer.from('000001003f99999a00000000000000003dcccccd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003fb333330000000000000000000000000000000000000000000000000000000000000000', 'hex') // eslint-disable-line
      resultBuf = Buffer.from('0001000000e3388e3fe3380e4040555547408e38e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040f8e37e410e38da411ffff6411ffff7', 'hex') // eslint-disable-line
    } else {
      resultBuf = await this.post({
        control: CONTROL_CODE.calRead,
        data: writeModel.buf,
        masterId
      })
    }

    const readModel = new BufWriteModel2({
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

  /** 创建通道列表 */
  async initChannelStatusList() {
    if (this.channelList) {
      return this.channelList
    }
    this.channelList = channelList
    Object.entries(this.channelList).forEach(([, masterItem]) => {
      Object.entries(masterItem.slaverList).forEach(([, slaverItem]) => {
        Object.entries(slaverItem.list).forEach(([, channelItem]) => {
          this.channelMap.set(channelItem.fullId, channelItem)
        })
      })
    })

    // const channelStatus = await redisClient.getChannelList(this.port.path)
    // Object.entries(channelStatus).forEach(([mKey, masterItem]) => {
    //   const master = this.channelList[mKey]

    //   Object.entries(masterItem).forEach(([sKey, slaverItem]) => {
    //     const slaver = master.slaverList[sKey]

    //     Object.entries(slaverItem).forEach(([cKey, channelItem]) => {
    //       if (channelItem.start && !channelItem.end) {
    //         const channel = slaver.list[cKey]
    //         channel.workerStart = channelItem.start
    //       }
    //     })
    //   })
    // })

    return this.channelList
  }

  /** 获取列表 */
  async getChannelList(opts: any) {
    const channelList = await this.initChannelStatusList()
    if (opts.type) {
      const { masterId, slaverId } = opts
      const masterList = channelList[`${masterId}`]
      if (!masterList) {
        throw new Error(`不存在主控 ${masterId}`)
      }
      const slaverList = masterList.slaverList[`${slaverId}`]
      if (!slaverList) {
        throw new Error(`不存在从控 ${opts.master}`)
      }
      return slaverList
    }
    return channelList
  }

  /** 设置状态 */
  async setStatus(data: any) {
    const control = CONTROL_CODE.status[data.status]
    if (!control) {
      throw new Error(`${data.status} Error`)
    }
    const slaverIds = data.slaverIdList || [data.slaverId]
    const channelIds = data.channelIdList || [data.channelId]
    const writerModel = new BufWriteModel2({
      model: data.status === 'start' ? WORKER_START_MODEL : WORKER_SATUS_MODEL
    })
    writerModel.writerBit('slaver', slaverIds)
    writerModel.writerBit('channel', channelIds)

    if (data.status === 'start') {
      writerModel.writer('startWorkerId', data.startId)
    }

    const list = data.masterIdList || [data.masterId]

    await Bluebird.mapSeries(list, async (masterId: number) => {
      writerModel.writer('masterId', masterId)
      logger.info('改变状态', writerModel.buf.toString('hex'))
      await this.post({
        control,
        data: writerModel.buf,
        masterId
      })
    })
  }
}
