import SerialPort from 'serialport'
import agreement, { SetDataBack } from './Agreement'
import logger from './Logger'
import { FixZero, toHex, bytFull } from '../utils'
import {
  workStepsInput,
  workSteps,
  controlCode,
  WORKSTEPS,
  getCalList,
  channelList
} from '@/shared/config/port'
import BufModel, { BufData, BufWriteListModel } from '../utils/ParsBuf'

import winManager from './WinManager'
import ipcManage from './IpcManage'
import is from 'electron-is'
import MasterMode from './MasterMode'
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
  channelId: number
}

interface WStepsOpts extends BaseOpts {
  list: any[]
}

const Delimiter = SerialPort.parsers.Delimiter

export default class PortItem {
  path: string
  port!: SerialPort
  parser!: SerialPort.parsers.Delimiter
  translateReadNow = false
  translate = new Map<number, MasterTranslate>()
  emitList = new Map<string, (dataBuf: Buffer) => any>()
  channelList!: any
  modelData = {
    workStep: [1, 1, 1, 1, 1, 1, 4, 2, { byte: 4, hasSigned: true }, 4, 4, 4, 1, 4, 4] // eslint-disable-line
  }
  masterMode!: MasterMode

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
    const parser = new Delimiter({
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

  /** 写工步 */
  async writeSteps(data: WStepsOpts) {
    const listLen = data.list.length
    let dataBuf = Buffer.from([0x00, 0xff, ...Array(8).fill(0x00), listLen])
    const bufModel = new BufWriteListModel(listLen, this.modelData.workStep)
    data.list.forEach((item: any, index: number) => {
      const step = workSteps[item.setId]
      if (!step || !step.input) {
        throw new Error(`step ${item.setId} NO defind`)
      }
      const writeModel = bufModel.getWriteModel(index)
      writeModel.write(1, data.slaverId)
      writeModel.write(2, data.channelId)
      writeModel.write(3, index)
      writeModel.write(4, 0)
      writeModel.write(5, `0x${step.value}`)
      step.input.forEach((type: string) => {
        const inputMap = workStepsInput[type]
        if (inputMap) {
          let value = item[type]
          if (type === 'loopStart') {
            value = Number(value) - 1
          }
          writeModel.write(inputMap.serial, value)
        }
      })
    })
    dataBuf = Buffer.concat([dataBuf, bufModel.buf])
    const result = agreement.setData(dataBuf, controlCode.writeWorkSteps)
    this.port.write(result.buf)
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
    const buf = Buffer.from([0x00, opts.slaverId, opts.channelId])
    const data = agreement.setData(buf, controlCode.slaver.stepsRead)
    let resultBuf: Buffer
    // const a = '00000000000000000000050000000000a100000001000000020000000000000000000000000000000000000000000100a2000000210000002c0000000000000000000000000000000000000000000200b00000022b0000029a00000000000000000000000000000000000000000003009000000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000009000000000000' // eslint-disable-line
    // const a = '00000000000000000000050000000000a100000001000000020000000000000000000000000000000000000000000100a2000000210000002c0000000000000000000000000000000000000000000200b0000000370000004200000000000000000000000000000000000000000003009000000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000063000000000000'  // eslint-disable-line
    if (isDev) {
      const a = '00ff0000000000000000040000000000a100000000000a000000140000000000000000000000000000000000000000000000000100a300000000000affffffd8000000000000000000000000000000000000000014000000020090000001900000000000000000000000000000000000000000000000000000000000000300700000000000000000000000000000000000000000003c040000000000000000'  // eslint-disable-line
      resultBuf = Buffer.from(a, 'hex')
    } else {
      resultBuf = await this.post({ data })
    }

    const stepsLen = resultBuf.readUInt8(10)
    const stepsBuf = resultBuf.slice(11)
    const stepsList: any[] = []
    const bufModel = new BufModel(this.modelData.workStep) // eslint-disable-line
    for (let i = 0; i < stepsLen; i++) {
      const start = bufModel.bufLength * i
      const bufData = bufModel.getBufData(
        stepsBuf.slice(start, start + bufModel.bufLength)
      )
      const workerItem = WORKSTEPS[bufData.getIndexHex(5)]
      if (workerItem) {
        const input = workerItem.input
        const workerArr = input.other
          ? input.worker.concat(input.other)
          : input.worker
        const worker = workerArr.map(key => this.readStepsInput(bufData, key))
        if (workerItem.type === 'loop') {
          worker.unshift({
            data: resultBuf.readIntBE(2 + opts.channelId, 1) + 1,
            name: '当前工步序号',
            unit: ''
          })
        }
        stepsList.push({
          id: bufData.getIndex(3),
          type: workerItem.type,
          name: workerItem.name,
          worker,
          limt: input.limt.map(key => this.readStepsInput(bufData, key))
        })
      }
    }
    return stepsList
  }

  /** 读采样 */
  readTranslate() {
    if (this.translateReadNow) return
    const masterId = 0
    const slaverId = 0
    const bufModel = new BufModel([1, 1, 2, 4, 1, 1]) // eslint-disable-line
    let oldTranslate: MasterTranslate | undefined
    if (this.translate.has(masterId)) {
      oldTranslate = this.translate.get(masterId)
      if (oldTranslate && oldTranslate.close) return
    }
    const translate: MasterTranslate = oldTranslate || {
      masterId,
      winArr: new Set<string>()
    }
    let timer: NodeJS.Timeout
    const getData = () => {
      timer = setTimeout(async () => {
        const translate = this.translate.get(masterId)
        try {
          let resultBuf: Buffer
          if (isDev) {
            // const a = '0000080001010000000000000001020000000000000000020200000000000000000302000000000000000004020000000000000000050200000000000000000602000000000000000007020000000000000000' // eslint-disable-line
            const a = '0000080002000000000004000001020000000000040000020200000000000400000302000000000004000004020000000000040000050200000000000400000602000000000004000007020000000000040000' // eslint-disable-line
            resultBuf = Buffer.from(a, 'hex')
          } else {
            resultBuf = await this.post({
              data: agreement.setData(
                Buffer.from([0x00, toHex(slaverId, 1)]),
                controlCode.slaver.translateRead
              )
            })
          }
          const len = resultBuf.readUInt8(2)
          const dataBuf = resultBuf.slice(3)
          const list: any[] = []
          for (let i = 0; i < len; i++) {
            const start = bufModel.bufLength * i
            const bufData = bufModel.getBufData(
              dataBuf.slice(start, start + bufModel.bufLength)
            )
            list.push({
              channelId: bufData.getIndex(0),
              workerCode: bufData.getIndex(1),
              U: bufData.getIndex(2),
              I: bufData.getIndex(3),
              endStatus: bufData.getIndex(4),
              errorCode: bufData.getIndex(5)
            })
          }

          if (translate) {
            const winArr = translate.winArr
            winArr.forEach(winName => {
              const win = winManager.getWin(winName)
              if (win) {
                ipcManage.send(
                  `/port/translate/${this.path}/${masterId}/${slaverId}`,
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
    const bufModel = new BufWriteListModel(1, [1].concat(listModel)) // eslint-disable-line
    const writeModel = bufModel.getWriteModel(0)
    opts.list.forEach(item => {
      writeModel.write(item.index, item.value || 0)
    })
    bufModel.buf.writeUInt8(opts.channelId, 0)
    const dataBuf = Buffer.concat([
      Buffer.from([0x00, opts.slaverId, 1]),
      bufModel.buf
    ])
    const postBuf = agreement.setData(dataBuf, controlCode.slaver.calSet)
    console.log(dataBuf.toString('hex'))
    await this.post({
      data: postBuf
    })
  }

  async readCal(opts: any) {
    const dataBuf = agreement.setData(
      Buffer.from([0x00, opts.slaverId, opts.channelId]),
      controlCode.slaver.calRead
    )
    let resultBuf: Buffer
    if (isDev) {
      // resultBuf = Buffer.from('000001003f99999a00000000000000003dcccccd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003fb333330000000000000000000000000000000000000000000000000000000000000000', 'hex') // eslint-disable-line
      resultBuf = Buffer.from('00000101da388e3fda380ec047555540da388ec011c7b1404755d5c07ee3f840da380ec1f6ff1f41f6ff1fc10000000000000000000000000000000000000000000000000000000000000000000000000000000033e38a44669cad46cd5450458d03d948c78aa94a000000001be33d4900000000fe237449f34fc347', 'hex') // eslint-disable-line
    } else {
      resultBuf = await this.post({ data: dataBuf })
    }
    const listModel = Array(30).fill({ byte: 4, hasFload: true })
    const bufModel = new BufModel([1].concat(listModel))
    const bufData = bufModel.getBufData(resultBuf.slice(3))
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
      const masterList = this.channelList[`master_${masterId}`]
      if (!masterList) {
        throw new Error(`不存在主控 ${masterId}`)
      }
      const slaverList = masterList.slaverList[`slaver_${slaverId}`]
      if (!slaverList) {
        throw new Error(`不存在从控 ${opts.master}`)
      }
      return slaverList
    }
    return this.channelList
  }
}
