import SerialPort from 'serialport'
import agreement, { ReadResult } from './Agreement'
import logger from './Logger'
import {
  workStepsInput,
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

  constructor(path: string) {
    this.path = path
    this.created(path)
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
      logger.info('write Status', status)

      timer = setTimeout(() => {
        setError('PORT Time Out')
      }, timeout || 2000)
    })
  }

  /** 写工步 */
  async writeSteps(data: WStepsOpts) {
    const masterId = data.masterId
    const listLen = data.list.length
    const writerModel = new BufWriteModel2({
      model: WORKER_STEP_MODEL,
      listLen: {
        protectList: 1,
        workerList: listLen
      }
    })
    writerModel.writer('masterId', data.masterId)
    writerModel.writerBit('slaverId', data.slaverId)
    writerModel.writerBit('channelId', data.channelId)
    writerModel.writer('protectLen', 1)
    writerModel.writer('workerLen', listLen)
    writerModel.ecahList('protectList', writeItem => {
      PROTECT.forEach(item => {
        writeItem.writer(item.type, data.protect[item.type] || 0)
      })
    })
    writerModel.ecahList('workerList', (writeItem, index) => {
      const item = data.list[index]
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
          if (key === 'loopStart') {
            value = Number(value) - 1
          }
          writeItem.writer(key as string, value)
        }
      })
    })

    logger.info('写工步', writerModel.buf.toString('hex'))
    return this.post({
      control: CONTROL_CODE.stepsSet,
      data: writerModel.buf,
      masterId
    })
  }

  readStepsInput(readItem: BufWriteModel2, key: string) {
    const inputItem = workStepsInput[key]
    let data = readItem.read(key)
    if (key === 'loopStart') {
      data += 1
    }
    return {
      data,
      unit: inputItem.unit,
      name: inputItem.name.replace(/\(.+\)/, ''),
      type: key
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
      const b = `00000000000108010503ea60ea60ea60ea600a8c00030000000000030000a10000000000010000138800000000000000000000000000000000000000000000030100a20000000013880000138800000000000000000000000000000000000000000000030200b000000000ea600000138800000000000000000000000000000000000000000000030300900000000a000000000000000000000000000000000000000000000000000000000304007000000000000000000000000000000000000000000003000000000000000000`
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
    readModel.ecahList('protectList', readItem => {
      const channelId = readItem.read('channelId')
      if (!stepData[channelId]) {
        stepData[channelId] = {}
      }
      const channelStep = stepData[channelId]
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
        const channelId = readItem.read('channelId')
        if (!stepData[channelId]) {
          stepData[channelId] = {}
        }
        const channelStep = stepData[channelId]
        if (!channelStep.stepList) {
          channelStep.stepList = []
        }
        channelStep.stepList.push({
          id: readItem.read('workerId'),
          type: workerItem.type,
          name: workerItem.name,
          worker,
          limt: input.limt.map(key => this.readStepsInput(readItem, key))
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
            const a = `000008010000a1000${g}0000000${g}0000000000000100000204000000000000000000020000000000000000000000000003${d2}${d}0${g}0000000${g}00000000000004000000000000000000000000000500000000000000000000000000060000000000000000000000000007000000000000000000000000000100010000000000000000` // eslint-disable-line
            // const a = `000008000000900307360000055f00000001030405f7000005b700000002030405da0000058f00000003020005f400000000000000040200079a0000000000000005020006060000000000000006020005be000000000000000702000cf4000002ad0000` // eslint-disable-line
            // const a = `000008000002000c220000000000000001000000080000000a0000000202000d8dfffffffe00000003000000020000000000000004000000020000000e00000005000000010000000100000006000000020000001900000007000000020000001d0000` // eslint-disable-line
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

          readModel.ecahList('sampList', readItem => {
            const workerCode = readItem.readHex('workerCode')
            const errCode = readItem.readHex('errCode')
            const samp = {
              slaverId: readItem.read('slaverId'),
              channelId: readItem.read('channelId'),
              workerId: readItem.read('workerId'),
              U: readItem.read('U'),
              I: readItem.read('I'),
              endStatus: readItem.read('endCode'),
              stepsId: readItem.read('stepsId'),
              workerCode: workerCode,
              errorCode: errCode,
              errorMsg: errCode !== '00' ? CHANNEL_ERR_STATUS[errCode] : '',
              workerStatus: CHANNEL_STATUS[workerCode] || this.noWorkerStatus,
              createTime: nowUnix
            }
            list.push(samp)
            const channel = this.channelList[masterId].slaverList[samp.slaverId].list[samp.channelId] // eslint-disable-line
            const lastSamp = channel.samp // eslint-disable-line
            channel.samp = samp

            if (!lastSamp || lastSamp.workerCode !== samp.workerCode) {
              // 判断是否启动、或结束过度
              let lastStatus = ''
              if (lastSamp) {
                lastStatus = CHANNEL_STATUS_END.includes(lastSamp.workerCode) ? 'END' : 'RUN' // eslint-disable-line
              } else {
                // 不存在上次采样说明为刚启动时， 通过判断是否有启动时刻，来判断运行状态
                lastStatus = channel.workerStart ? 'RUN' : 'END'
              }
              const nowStatus = CHANNEL_STATUS_END.includes(samp.workerCode) ? 'END' : 'RUN' // eslint-disable-line

              if (lastStatus !== nowStatus) {
                if (nowStatus === 'RUN') {
                  channel.workerStart = nowUnix
                  channelStatus.push({
                    masterId,
                    slaverId: samp.slaverId,
                    channelId: samp.channelId,
                    start: nowUnix,
                    end: null
                  })
                } else {
                  channelStatus.push({
                    masterId,
                    slaverId: samp.slaverId,
                    channelId: samp.channelId,
                    start: channel.workerStart,
                    end: nowUnix
                  })
                  channel.workerStart = null
                }
              }
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
          await redisClient.setSamp(masterId, list)
          if (channelStatus.length > 0) {
            await redisClient.channelSetStart(this.port.path, channelStatus)
            ipcManage.commonMsg('updateChannelList', channelStatus)
          }

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
    const channelStatus = await redisClient.getChannelList(this.port.path)
    Object.entries(channelStatus).forEach(([mKey, masterItem]) => {
      const master = this.channelList[mKey]

      Object.entries(masterItem).forEach(([sKey, slaverItem]) => {
        const slaver = master.slaverList[sKey]

        Object.entries(slaverItem).forEach(([cKey, channelItem]) => {
          if (channelItem.start && !channelItem.end) {
            const channel = slaver.list[cKey]
            channel.workerStart = channelItem.start
          }
        })
      })
    })

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
    const slaverIds = data.slaverId
    const channelIds = data.channelId
    const writerModel = new BufWriteModel2({
      model: data.status === 'start' ? WORKER_START_MODEL : WORKER_SATUS_MODEL
    })
    writerModel.writerBit('slaver', slaverIds)
    writerModel.writerBit('channel', channelIds)

    if (data.status === 'start') {
      const start = Number(data.startId)
      if (!start) {
        throw new Error('START ID ERROR')
      }
      writerModel.writer('startWorkerId', start - 1)
    }

    const now = dayjs().unix()
    const list = data.masterIdList || [data.masterId]
    await Bluebird.mapSeries(list, async (masterId: number) => {
      writerModel.writer('masterId', masterId)
      logger.info('改变状态', writerModel.buf.toString('hex'))
      await this.post({
        control,
        data: writerModel.buf,
        masterId
      })
      // if (data.status === 'start') {
      //   slaverIds.forEach(slaverId => {
      //     channelIds.forEach(channelId => {
      //       const channel = this.channelList[masterId].slaverList[slaverId].list[channelId] // eslint-disable-line
      //       if (channel && !channel.workStart) {
      //         channel.workStart = now
      //         setStartList.push({
      //           masterId,
      //           slaverId: slaverId,
      //           channelId: channelId,
      //           start: now
      //         })
      //       }
      //     })
      //   })
      // }
    })

    // if (setStartList.length > 0) {
    //   ipcManage.commonMsg('updateChannelList', this.channelList)
    //   // const redisClient = RedisClient.getInstance()
    //   // await redisClient.channelSetStart(setStartList)
    // }
  }
}
