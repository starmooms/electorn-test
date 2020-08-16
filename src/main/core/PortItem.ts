import SerialPort from 'serialport'
import agreement, { SetDataBack } from './Agreement'
import logger from './Logger'
import { FixZero, toHex, bytFull } from '../utils'
import {
  workStepsInput,
  workSteps,
  controlCode,
  WORKSTEPS
} from '@/shared/config/port'
import BufModel, { BufData } from '../utils/ParsBuf'

import winManager from './WinManager'
import ipcManage from './IpcManage'

interface MasterTranslate {
  masterId: number
  winArr: Set<string>
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
  port: SerialPort
  parser: SerialPort.parsers.Delimiter
  translate = new Map<number, MasterTranslate>()
  emitList = new Map<string, (dataBuf: Buffer) => any>()

  constructor(path: string) {
    const { port, parser } = this.created(path)
    this.port = port
    this.parser = parser
  }

  created(path: string) {
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
    return { port, parser }
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
    })
  }

  /** 写工步 */
  async writeSteps(data: WStepsOpts) {
    let writeArr = [
      '00',
      'ff',
      '0000000000000000',
      FixZero(data.list.length.toString(16), 2)
    ]
    data.list.forEach((item: any, index: number) => {
      const step = workSteps[item.setId]
      if (step && step.input) {
        const stepByt = [
          ...[
            '00',
            toHex(data.slaverId, 1),
            toHex(data.channelId, 1),
            toHex(index, 1),
            toHex(0, 1),
            step.value
          ],
          ...bytFull(4, 2, 4, 4, 4, 4, 1, 4, 4)
        ]
        step.input.forEach((type: string) => {
          const inputMap = workStepsInput[type]
          if (inputMap) {
            stepByt[inputMap.serial] = toHex(item[type], inputMap.len)
          }
        })
        writeArr = writeArr.concat(stepByt)
      }
    })
    const write = writeArr.join('')
    const result = agreement.setData(write, controlCode.writeWorkSteps)
    this.port.write(result.buf)
  }

  readStepsInput(bufData: BufData, key: string) {
    const inputItem = workStepsInput[key]
    return {
      data: bufData.getIndex(inputItem.serial),
      unit: inputItem.unit,
      name: inputItem.name.replace(/\(.+\)/, '')
    }
  }

  /** 读工步 */
  async readSteps(opts: BaseOpts) {
    const buf = Buffer.from([0x00, opts.slaverId, opts.channelId])
    const data = agreement.setData(buf, controlCode.slaver.stepsRead)
    // const a = '00000000000000000000050000000000a100000001000000020000000000000000000000000000000000000000000100a2000000210000002c0000000000000000000000000000000000000000000200b00000022b0000029a00000000000000000000000000000000000000000003009000000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000009000000000000' // eslint-disable-line
    const a = '00000000000000000000050000000000a100000001000000020000000000000000000000000000000000000000000100a2000000210000002c0000000000000000000000000000000000000000000200b0000000370000004200000000000000000000000000000000000000000003009000000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000063000000000000'  // eslint-disable-line
    const resultBuf = Buffer.from(a, 'hex')
    // const resultBuf = await this.post({ data })
    const stepsLen = resultBuf.readUInt8(10)
    const stepsBuf = resultBuf.slice(11)
    const stepsList: any[] = []
    const bufModel = new BufModel([1, 1, 1, 1, 1, 1, 4, 2, 4, 4, 4, 4, 1, 4, 4]) // eslint-disable-line
    for (let i = 0; i < stepsLen; i++) {
      const start = bufModel.bufLength * i
      const bufData = bufModel.getBufData(
        stepsBuf.slice(start, start + bufModel.bufLength)
      )
      const workerItem = WORKSTEPS[bufData.getIndexHex(5)]
      if (workerItem) {
        const worker = workerItem.input.worker.map(key =>
          this.readStepsInput(bufData, key)
        )
        const limt = workerItem.input.limt.map(key =>
          this.readStepsInput(bufData, key)
        )
        stepsList.push({
          id: bufData.getIndex(3),
          name: workerItem.name,
          worker,
          limt
        })
      }
      return stepsList
    }
  }

  /** 读采样 */
  readTranslate() {
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
        try {
          // const resultBuf = await this.post({
          //   data: agreement.setData(Buffer.from([0x00, toHex(slaverId, 1)]))
          // })
          const a =
            '0000080001010000000000000001020000000000000000020200000000000000000302000000000000000004020000000000000000050200000000000000000602000000000000000007020000000000000000'
          const resultBuf = Buffer.from(a, 'hex')
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
          const translate = this.translate.get(masterId)
          if (translate) {
            const winArr = translate.winArr
            winArr.forEach(winName => {
              const win = winManager.getWin(winName)
              if (win) {
                ipcManage.send(
                  `/port/translate/${slaverId}`,
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
          getData()
        }
      }, 1000)
    }
    getData()
    translate.close = () => {
      clearTimeout(timer)
      translate.close = undefined
    }
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
    const masterId = opts.masterId
    const winName = opts.winName
    const translate = this.translate.get(masterId)
    if (translate) {
      translate.winArr.add(winName)
    } else {
      this.translate.set(masterId, {
        masterId,
        winArr: new Set([winName])
      })
    }
    return () => {
      this.translate.delete(winName)
    }
  }
}
