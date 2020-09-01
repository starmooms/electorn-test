import SerialPort from 'serialport'
import agreement, { SetDataBack } from './Agreement'
import logger from './Logger'
import { FixZero, toHex, bytFull } from '../utils'
import {
  workStepsInput,
  workSteps,
  controlCode,
  WORKSTEPS_MAP,
  getCalList,
  channelList,
  PROTECT,
  WORKSTEPS_TYPE_MAP,
  WORKSTEPSINPUT,
  ERR_STATUS,
  CHANNEL_STATUS
} from '@/shared/config/port'
import BufModel, {
  BufData,
  BufWriteListModel,
  BufWriteModel
} from '../utils/ParsBuf'
import { Promise as Bluebird } from 'bluebird'

import winManager from './WinManager'
import ipcManage from './IpcManage'
import is, { mas } from 'electron-is'
import MasterMode from './MasterMode'
import { typedKeys } from '@/shared/utils'
import redisClient, { RedisClient } from './redis/RedisClient'
import dayjs from 'dayjs'
import TransfromParser from '../utils/transfromParser'
const isDev = is.dev()

interface MasterTranslate {
  masterId: number
  winArr: Set<string>
  // winEmitMap: Map<string, { slaverId: number }>
  close?: () => any
}

interface PostOpts {
  timeout?: number
  data: SetDataBack
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
  translateReadNow = false
  translate = new Map<number, MasterTranslate>()
  emitList = new Map<string, (dataBuf: Buffer) => any>()
  channelList!: any
  modelData = {
    protect: [1, 2, 2, 2, 2, 2, 2, 4],
    workStep: [1, 1, 1, 1, 1, 4, 2, { byte: 4, hasSigned: true }, 4, 4, 4, 1, 4, 4] // eslint-disable-line
  }
  masterMode!: MasterMode
  noWorkerStatus = { name: '未知工作状态', status: 'error' }

  constructor(path: string) {
    this.path = path
    this.created(path)
    this.channelList = channelList
  }

  created(path: string) {
    logger.info('创建串口', path)
    const port = new SerialPort(path, {
      baudRate: 115200
    })
    const parser = new SelfParser({
      delimiter: agreement.getEnd()
    })
    port.pipe(parser)
    parser.on('data', buf => {
      logger.info('串口返回数据', buf.toString('hex'))
      const result = agreement.readData(buf)
      if (this.emitList.has(result.sId)) {
        const fun = this.emitList.get(result.sId)
        if (fun) fun(result.buf)
        this.emitList.delete(result.sId)
        return
      }
      logger.warn(`流水号回调${result.sId} 不存在`)
    })
    port.on('open', data => {
      logger.info('串口触发open', data)
    })
    port.on('error', err => {
      logger.warn('串口触发error', err)
    })
    this.port = port
    this.parser = parser
    this.masterMode = new MasterMode(this)
    return
  }

  /** 串口通讯 */
  post({ timeout, data }: PostOpts): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.emitList.delete(data.sId)
        reject(new Error('PORT Time Out'))
      }, timeout || 2000)

      this.emitList.set(data.sId, buf => {
        resolve(buf)
        clearTimeout(timer)
      })

      this.port.write(data.buf)
    })
  }

  setByt(len: number, arr1: number[], fillNum = 0) {
    const bytArr = Array(len).fill(fillNum)
    arr1.forEach(item => {
      bytArr[item] = 1
    })
    // let result = 0
    // arr1.forEach(num => {
    //   result |= 1 << num
    // })
    return parseInt(bytArr.reverse().join(''), 2)
  }

  /** 写工步 */
  async writeSteps(data: WStepsOpts) {
    const listLen = data.list.length
    const dataModel = new BufWriteModel([ 1, 1, 4, 1, 1, 1,  ...this.modelData.protect]) // eslint-disable-line
    const dataWriteModel = dataModel.getWriteModel()
    dataWriteModel.write(1, data.masterId)
    dataWriteModel.write(2, this.setByt(32, data.slaverId))
    dataWriteModel.write(3, this.setByt(8, data.channelId))
    dataWriteModel.write(4, 1)
    dataWriteModel.write(5, listLen)
    PROTECT.forEach(item => {
      dataWriteModel.write(item.index + 7, data.protect[item.type] || 0)
    })

    const bufModel = new BufWriteListModel(listLen, this.modelData.workStep)
    data.list.forEach((item: any, index: number) => {
      const step = WORKSTEPS_TYPE_MAP[item.type]
      if (!step || !step.input) {
        throw new Error(`step ${item.setId} NO defind`)
      }
      const writeModel = bufModel.getWriteModel(index)
      writeModel.write(2, index)
      writeModel.write(3, 0)
      writeModel.write(4, `0x${step.key}`)
      typedKeys(item.input).forEach(key => {
        const input = WORKSTEPSINPUT[key]
        if (input) {
          let value = item.input[key]
          if (key === 'loopStart') {
            value = Number(value) - 1
          }
          writeModel.write(input.serial, value)
        }
      })
    })
    const dataBuf = Buffer.concat([dataModel.buf, bufModel.buf])
    const result = agreement.createData({
      masterId: data.masterId,
      slaverId: 0xff,
      type: 0x02,
      code: controlCode.master.stepsSet,
      data: dataBuf
    })
    logger.info('写工步', dataBuf.toString('hex'))
    return await this.port.write(result.buf)
  }

  readStepsInput(bufData: BufData, key: string) {
    const inputItem = workStepsInput[key]
    let data = bufData.getIndex(inputItem.serial) as number
    if (key === 'loopStart') {
      data += 1
    }
    return {
      data,
      unit: inputItem.unit,
      name: inputItem.name.replace(/\(.+\)/, '')
    }
  }

  /** 读工步 */
  async readSteps(opts: BaseOpts) {
    const postModel = new BufWriteModel([1, 1, 4, 1]) // eslint-disable-line
    const postWriteModel = postModel.getWriteModel()
    postWriteModel.write(1, opts.masterId)
    postWriteModel.write(2, this.setByt(32, [opts.slaverId]))
    postWriteModel.write(3, this.setByt(8, opts.channelId))

    const data = agreement.createData({
      masterId: opts.masterId,
      slaverId: 0xff,
      type: 0x02,
      code: controlCode.master.stepsRead,
      data: postModel.buf
    })
    let resultBuf: Buffer
    // const a = '00000000000000000000050000000000a100000001000000020000000000000000000000000000000000000000000100a2000000210000002c0000000000000000000000000000000000000000000200b00000022b0000029a00000000000000000000000000000000000000000003009000000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000009000000000000' // eslint-disable-line
    // const a = '00000000000000000000050000000000a100000001000000020000000000000000000000000000000000000000000100a2000000210000002c0000000000000000000000000000000000000000000200b0000000370000004200000000000000000000000000000000000000000003009000000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000063000000000000'  // eslint-disable-line
    if (isDev) {
      // const a = '68010100ff68a9000000003e0000ffffffffff000000000000000000000000000000000000000000a10004000000030000000000000000000000000000000000000000000000000000009568edededed'  // eslint-disable-line
      // const b = '0000000000010104000000000000000000000000000000000000009000000005000000000000000000000000000000000000000000000000000000000100900000000a000000000000000000000000000000000000000000000000000000000200900000000f0000000000000000000000000000000000000000000000000000000003007000000000000000000000000000000000000000000003000000000000000000' // eslint-disable-line
      const b = `00000000000108010503ea60ea60ea60ea600a8c00030000000000030000a10000000000010000138800000000000000000000000000000000000000000000030100a20000000013880000138800000000000000000000000000000000000000000000030200b000000000ea600000138800000000000000000000000000000000000000000000030300900000000a000000000000000000000000000000000000000000000000000000000304007000000000000000000000000000000000000000000003000000000000000000`
      //'000000000001010101000001000200030004000500060000000000000000a10000000000140000000a000000000000000000000000000000000000000000'
      // const b = '000000000000ff0300000000000000000000000000000000000000a10000000000de0000006f000000000000000000000000000000000000000000000100a200000000014d000001bc000000000000000000000000000000000000000000000200b000000000029a0000022b000000000000000000000000000000000000000000'  // eslint-disable-line
      // const b = '000000000001010000000000000000000000000000000000'
      resultBuf = Buffer.from(b, 'hex')
    } else {
      resultBuf = await this.post({ data })
      logger.info('读工步返回', resultBuf.toString('hex'))
    }

    const stepData = {}
    const dataModel = new BufModel([1, 1, 4, 1, 1, 1]) // eslint-disable-line
    const baseBufData = dataModel.getBufData(resultBuf)

    const { offset: lenOffset, byte: lenByte } = dataModel.sliceData[
      dataModel.sliceData.length - 1
    ]
    const protectLen = baseBufData.getIndex(4)
    const protectBuf = resultBuf.slice(lenOffset + lenByte)
    const protectBufModel = new BufModel(this.modelData.protect)
    for (let i = 0; i < protectLen; i++) {
      const protect = {}
      const start = protectBufModel.bufLength * i
      const bufData = protectBufModel.getBufData(
        protectBuf.slice(start, start + protectBufModel.bufLength)
      )
      PROTECT.forEach(item => {
        protect[item.type] = bufData.getIndex(item.index + 1)
      })
      const channelId = bufData.getIndex(0)
      if (!stepData[channelId]) {
        stepData[channelId] = {}
      }
      stepData[channelId].protect = protect
    }

    const stepStart =
      Number(protectLen) * protectBufModel.bufLength + dataModel.bufLength
    const stepsLen = baseBufData.getIndex(5)
    const stepsBuf = resultBuf.slice(stepStart)
    const stepsList: any[] = []
    const bufModel = new BufModel(this.modelData.workStep) // eslint-disable-line
    for (let i = 0; i < stepsLen; i++) {
      const start = bufModel.bufLength * i
      const bufData = bufModel.getBufData(
        stepsBuf.slice(start, start + bufModel.bufLength)
      )
      console.log(
        stepsBuf.slice(start, start + bufModel.bufLength).toString('hex')
      )
      console.log(bufData.getIndexHex(4))
      const workerItem = WORKSTEPS_MAP[bufData.getIndexHex(4)]
      if (workerItem) {
        const input = workerItem.input
        const workerArr = input.other
          ? input.worker.concat(input.other)
          : input.worker
        const worker = workerArr.map(key => this.readStepsInput(bufData, key))
        const channelId = bufData.getIndex(1)
        if (!stepData[channelId]) {
          stepData[channelId] = {}
        }
        if (!stepData[channelId].stepList) {
          stepData[channelId].stepList = []
        }
        stepData[channelId].stepList.push({
          id: bufData.getIndex(1),
          type: workerItem.type,
          name: workerItem.name,
          worker,
          limt: input.limt.map(key => this.readStepsInput(bufData, key))
        })
      }
    }
    return {
      stepData
    }
  }

  /** 读采样 */
  readTranslate() {
    if (this.translateReadNow) return
    const redisClient = RedisClient.getInstance()
    const masterId = 0
    const slaverId = 0
    const bufModel = new BufModel([1, 1, 1, 1, 2, { byte: 4, hasSigned: true}, 1, 1]) // eslint-disable-line

    const postModel = new BufWriteModel([1, 1, 4, 1])
    const postWrite = postModel.getWriteModel()
    postWrite.write(1, masterId)
    postWrite.write(2, this.setByt(32, [], 1))
    postWrite.write(1, this.setByt(8, [], 1))

    let oldTranslate: MasterTranslate | undefined
    if (this.translate.has(masterId)) {
      oldTranslate = this.translate.get(masterId)
      if (oldTranslate && oldTranslate.close) return
    }
    const translate: MasterTranslate = oldTranslate || {
      masterId,
      winArr: new Set<string>()
    }
    if (!translate.winArr.has('mainWin')) {
      translate.winArr.add('mainWin')
    }
    let timer: NodeJS.Timeout
    const getData = () => {
      timer = setTimeout(async () => {
        const translate = this.translate.get(masterId)
        const postBufData = agreement.createData({
          masterId,
          slaverId: 0xff,
          type: 0x02,
          code: controlCode.master.translateRead,
          data: postModel.buf
        })

        if (translate && translate.close) {
          getData()
        }

        try {
          let resultBuf: Buffer
          if (isDev) {
            // const a = '0000080001010000000000000001020000000000000000020200000000000000000302000000000000000004020000000000000000050200000000000000000602000000000000000007020000000000000000' // eslint-disable-line
            // 24
            // const t = Math.random() > 0.5 ? '03' : '00'
            // const a = `0000080000020000000000000000${t}00019000000affffff9c0000000201000014ffffff38000000030000001efffffed40000000402000028fffffe700000000502000032fffffe0c000000060200003cfffffda80000000702000046fffffd440000` // eslint-disable-line
            // const a = `0000080000900026080000000000000001900004a8000000000000000290000472fffffff500000003900004760000000000000004900006610000000000000005900004b2000000000000000690000489000000000000000790000dbe000003910000` // eslint-disable-line
            const a = `00000800000000000000000000000000010000000afffffff60000000200000014ffffffec000000030000001effffffe20000000400000028ffffffd80000000500000032ffffffce000000060000003cffffffc40000000700000046ffffffba0000` // eslint-disable-line
            resultBuf = Buffer.from(a, 'hex')
          } else {
            logger.info('读采样发送', postBufData.buf.toString('hex'))
            resultBuf = await this.post({
              data: postBufData
            })
            logger.info('读采样返回', resultBuf.toString('hex'))
          }
          const len = resultBuf.readUInt8(2)
          const dataBuf = resultBuf.slice(3)
          const list: any[] = []
          const nowUnix = dayjs().unix()
          for (let i = 0; i < len; i++) {
            const start = bufModel.bufLength * i
            const bufData = bufModel.getBufData(
              dataBuf.slice(start, start + bufModel.bufLength)
            )
            const errCode = bufData.getIndexHex(7)
            const workerCode = bufData.getIndexHex(2)
            list.push({
              slaverId: bufData.getIndex(0),
              channelId: bufData.getIndex(1),
              workerCode: workerCode,
              workerId: bufData.getIndex(3),
              U: bufData.getIndex(4),
              I: bufData.getIndex(5),
              endStatus: bufData.getIndex(6),
              errorCode: errCode,
              errorMsg: errCode !== '00' ? ERR_STATUS[errCode] : '',
              workerStatus: CHANNEL_STATUS[workerCode] || this.noWorkerStatus,
              createTime: nowUnix
            })
          }
          logger.info('存储redis', postBufData.buf.toString('hex'))
          await redisClient.setSamp(masterId, list)
          logger.info('redis存储成功', postBufData.buf.toString('hex'))
          if (translate) {
            const winArr = translate.winArr
            winArr.forEach(winName => {
              const win = winManager.getWin(winName)
              if (win) {
                ipcManage.send(
                  `/port/translate/${encodeURIComponent(
                    this.path
                  )}/${masterId}/${slaverId}`,
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
        }
      }, 1000)
    }
    getData()
    translate.close = () => {
      clearTimeout(timer)
      translate.close = undefined
      this.translateReadNow = false
    }
    this.translateReadNow = true
    this.translate.set(masterId, translate)
  }

  /** 停止读采样 */
  stopTranslate() {
    const masterId = 0
    const translate = this.translate.get(masterId)
    if (translate && translate.close) {
      translate.close()
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
    const listModel = Array(30).fill({ byte: 4, hasFload: true })
    const bufModel = new BufWriteModel([1, 1, 1].concat(listModel)) // eslint-disable-line
    const writeModel = bufModel.getWriteModel()
    writeModel.write(0, opts.masterId)
    writeModel.write(1, opts.slaverId)
    writeModel.write(2, opts.channelId)
    opts.list.forEach(item => {
      writeModel.write(item.index, item.value || 0)
    })
    const dataBuf = Buffer.concat([Buffer.from([0x00, 1]), bufModel.buf])
    const result = agreement.createData({
      masterId: opts.masterId,
      slaverId: 0xff,
      type: 0x02,
      code: controlCode.master.calSet,
      data: dataBuf
    })
    logger.info('写校准发送', result.buf.toString('hex'))
    await this.post({
      data: result
    })
  }

  async readCal(opts: any) {
    const dataModel = new BufWriteModel([1, 1, 4, 1]) // eslint-disable-line
    const dataWriteModel = dataModel.getWriteModel()
    dataWriteModel.write(1, opts.masterId)
    dataWriteModel.write(2, this.setByt(32, [opts.slaverId]))
    dataWriteModel.write(3, this.setByt(8, [opts.channelId]))
    const dataBuf = agreement.createData({
      masterId: opts.masterId,
      slaverId: 0xff,
      type: 0x02,
      code: controlCode.master.calRead,
      data: dataModel.buf
    })
    let resultBuf: Buffer
    if (isDev) {
      // resultBuf = Buffer.from('000001003f99999a00000000000000003dcccccd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003fb333330000000000000000000000000000000000000000000000000000000000000000', 'hex') // eslint-disable-line
      resultBuf = Buffer.from('0001000000e3388e3fe3380e4040555547408e38e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040f8e37e410e38da411ffff6411ffff7', 'hex') // eslint-disable-line
    } else {
      resultBuf = await this.post({ data: dataBuf })
    }
    const listModel = Array(30).fill({ byte: 4, hasFload: true })
    const bufModel = new BufModel([1, 1, 1].concat(listModel))
    const bufData = bufModel.getBufData(resultBuf.slice(2))
    const list = getCalList()
    list.forEach(item => {
      item.value = bufData.getIndex(item.index)
    })
    return { list }
  }

  /** 获取列表 */
  async getChannelList(opts: any) {
    if (opts.type) {
      const { masterId, slaverId } = opts
      const masterList = this.channelList[`${masterId}`]
      if (!masterList) {
        throw new Error(`不存在主控 ${masterId}`)
      }
      const slaverList = masterList.slaverList[`${slaverId}`]
      if (!slaverList) {
        throw new Error(`不存在从控 ${opts.master}`)
      }
      return slaverList
    }
    return this.channelList
  }

  /** 设置状态 */
  async setStatus(data: any) {
    const code = controlCode.master.status[data.status]
    if (!code) {
      throw new Error(`${data.status} Error`)
    }
    const splitBit = [1, 1, 4, 1]
    if (data.status === 'start') {
      splitBit.push(1)
    }
    const dataModel = new BufWriteModel(splitBit) // eslint-disable-line
    const dataWriteModel = dataModel.getWriteModel()
    dataWriteModel.write(2, this.setByt(32, data.slaverId))
    dataWriteModel.write(3, this.setByt(8, data.channelId))
    if (data.status === 'start') {
      const start = Number(data.startId)
      if (!start) {
        throw new Error('START ID ERROR')
      }
      dataWriteModel.write(4, start - 1)
    }

    const list = data.masterIdList || [data.masterId]
    await Bluebird.mapSeries(list, async (masterId: number) => {
      dataWriteModel.write(1, masterId)
      const result = agreement.createData({
        masterId: masterId,
        slaverId: 0xff,
        type: 0x02,
        code,
        data: dataModel.buf
      })
      logger.info('改变状态', dataModel.buf.toString('hex'))
      await this.post({ data: result })
    })
  }
}
