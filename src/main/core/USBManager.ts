import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import ipcManage from './IpcManage'
import { workSteps, controlCode, workStepsInput } from '@/shared/config/port'
import agreement from './Agreement'
import { FixZero, toHex, bytFull } from '../utils'
import logger from './Logger'
import BufModel from '../utils/ParsBuf'
import winManager from './WinManager'
import translateList from '../utils/mock'

const Delimiter = SerialPort.parsers.Delimiter

export interface ArgeementData {
  buf: Buffer
  sId: string
}

export interface PostParams {
  portPath?: string
  portItem?: PortItem
  data: {
    buf: Buffer
    sId: string
  }
  timeOut?: 2000
}

export interface PortItem {
  port: SerialPort
  parser: SerialPort.parsers.Delimiter
  emitList: any
  translate: any
}

export default class USBManager {
  cache = new Map<string, PortItem>()
  hasEvent = false
  stepList: any[] | null = null

  constructor() {
    this.init()
  }

  init() {
    this.start()
    this.setSlaverStatus()
    this.writeSteps()
    this.getPortList()
    this.setTranslate()
  }

  /** 开始监测USB */
  start() {
    if (this.hasEvent === false) {
      this.addEventUSBChange()
      this.hasEvent = true
    }
  }

  /** 结束监测USB */
  destory() {
    if (this.hasEvent === true) {
      this.cache.clear()
      usbDetection.stopMonitoring()
      this.hasEvent = false
    }
  }

  /** 获取串口列表 */
  getPortList() {
    ipcManage.on('/port/getPortList', () => {
      this.sendList()
    })
  }

  /** 发送列表 */
  sendList() {
    ipcManage.send('/port/sendList', async () => {
      const list = await SerialPort.list()
      const keys = Object.keys(this.cache)
      if (keys.length > 0) {
        keys.forEach(key => {
          const has = list.find(item => item.path === key)
          if (!has) {
            this.cache.delete(key)
          }
        })
      }
      return { list }
    })
  }

  /** USB端口监听 */
  addEventUSBChange() {
    usbDetection.startMonitoring()
    usbDetection.on('change', () => {
      this.sendList()
    })
  }

  getPortData(path: string) {
    let portData = this.cache.get(path)
    if (!portData) {
      const port = new SerialPort(path, {
        baudRate: 115200
      })
      const parser = new Delimiter({
        delimiter: agreement.getEnd()
      })
      portData = {
        port,
        parser,
        emitList: {},
        translate: {}
      }

      port.pipe(parser)
      parser.on('data', buf => {
        logger.info('串口返回数据', buf.toString('hex'))
        const result = agreement.readData(buf)
        if (portData && portData.emitList[result.sId]) {
          // console.log(`流水号回调${result.sId} 回调存在`)
          portData.emitList[result.sId](result.buf)
          delete portData.emitList[result.sId]
        } else {
          console.log(`流水号回调${result.sId} 不存在`)
        }
        // const msg = iconv.decode(buf, 'GBK')
        // logger.info(msg)
        // ipcManage.setSend(`portData:${path}`, msg)
      })
      this.cache.set(path, portData)
    }
    return portData
  }

  // portWrite() {
  //   ipcManage.setEmit('portWrite', (path: string, data: string) => {
  //     const portData = this.getPortData(path)
  //     if (portData) {
  //       portData.port.write(data)
  //     }
  //   })
  // }

  /** 写工步 */
  writeSteps() {
    ipcManage.handle('/port/writeWorkSteps', (event, data: any) => {
      const protItem = this.getPortData(data.path)
      if (!protItem) return
      let writeArr = [
        '00',
        'ff',
        '0000000000000000',
        FixZero(data.list.length.toString('16'), 2)
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
      protItem.port.write(result.buf)
    })
  }

  /** 设置从控状态 */
  setSlaverStatus() {
    ipcManage.handle('/port/slaver/setStatus', (event, data: any) => {
      const protItem = this.getPortData(data.path)
      if (!protItem) return
      const buf = Buffer.alloc(3)
      buf.writeUIntBE(data.slaverId, 1, 1)
      buf.writeUIntBE(data.channel, 2, 1)
      const result = agreement.setData(buf, controlCode.slaver[data.status])
      protItem.port.write(result.buf)
    })
  }

  /** 开始/关闭读从控采样 */
  setTranslate() {
    ipcManage.handle('/port/translateSet', (event, data) => {
      const portItem = this.getPortData(data.path)
      if (!portItem) return
      const masterId = 0
      const slaverId = 0
      if (data.status === true) {
        const bufModel = new BufModel([1, 1, 2, 4, 1, 1]) // eslint-disable-line

        if (!portItem.translate[masterId]) {
          portItem.translate[masterId] = {}
        }
        const time = setInterval(async () => {
          try {
            const resultBuf = await this.post({
              portItem,
              data: agreement.setData(
                Buffer.from([0x00, toHex(slaverId, 1)]),
                0xc5
              )
            })
            // const a =
            //   '0000080001010000000000000001020000000000000000020200000000000000000302000000000000000004020000000000000000050200000000000000000602000000000000000007020000000000000000'
            // const resultBuf = await Buffer.from(a, 'hex')
            console.log('采样返回数据', resultBuf.toString('hex'))

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

            // const list = translateList()

            portItem.translate[masterId].winArr.forEach(name => {
              const win = winManager.getWin(name)
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
          } catch (err) {
            console.log(err)
            // throw err
          }
        }, 1000)
        const translateItem = portItem.translate[masterId]
        if (!translateItem.winArr) {
          translateItem.winArr = []
        }
        translateItem.close = () => {
          clearInterval(time)
          // delete portItem.translate[masterId]
        }
      } else {
        if (
          portItem.translate[masterId] &&
          portItem.translate[masterId].close
        ) {
          portItem.translate[masterId].close()
        }
      }
    })
  }

  /** 读从采样 */
  readSlaverTranslate(
    portItem: PortItem,
    masterId: number,
    slaverId: number,
    winName: string
  ) {
    const bufModel = new BufModel([1, 1, 2, 4, 1, 1]) // eslint-disable-line
    masterId = 0
    if (!portItem.translate[masterId]) {
      portItem.translate[masterId] = {
        winArr: []
      }
    }
    const winArr = portItem.translate[masterId].winArr
    winArr.push(winName)
    const close = () => {
      const index = winArr.findIndex(item => {
        return winName === item
      })
      if (index >= 0) {
        winArr.splice(index, 1)
      }
    }
    return close
  }

  /** 设置校准 */
  setCal() {
    ipcManage.handle('/port/cal/set', (event, data: any) => {
      const protItem = this.getPortData(data.path)
      if (!protItem) return
      const buf = Buffer.from([
        0x00,
        toHex(data.slaverId, 1),
        toHex(data.list.length, 1)
      ])
      const writeArr = []
      data.list.forEach((item: any) => {
        const calItem = [
          toHex(data.channelId, 1),
          ...Array(30).fill(toHex(0, 4))
        ]
      })
    })
  }

  /** 串口请求 */
  post(opts: PostParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const data = opts.data
      let portItem = opts.portItem
      if (!portItem && opts.portPath) {
        portItem = this.getPortData(opts.portPath)
      }
      if (!portItem) {
        reject(new Error('no found portItem'))
        return
      }
      const timer = setTimeout(() => {
        // logger.info('超时未返回')
        delete portItem!.emitList[data.sId]
        reject(new Error('PORT Time Out'))
      }, 2000)
      portItem.emitList[data.sId] = (buf: Buffer) => {
        resolve(buf)
        clearTimeout(timer)
      }
      portItem.port.write(data.buf)
    })
  }
}
