import { ipcMain, ipcRenderer, IpcMainEvent } from 'electron'
import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import * as iconv from 'iconv-lite'
import ipcManage from './IpcManage'
import { workSteps, controlCode, workStepsInput } from '@/shared/config/port'
import agreement from './Agreement'
import { FixZero, toHex, bytFull } from '../utils'

const Delimiter = SerialPort.parsers.Delimiter

export interface PortItem {
  port: SerialPort
  parser: SerialPort.parsers.Delimiter
  emitList: any
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
        delimiter: '\n'
      })
      portData = {
        port,
        parser,
        emitList: {}
      }

      port.pipe(parser)
      parser.on('data', buf => {
        console.log(buf)
        const result = agreement.readData(buf)
        if (portData && portData.emitList[result.sId]) {
          portData.emitList[result.sId](result)
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
            ...['00', 'ff', '00', toHex(index, 1), toHex(0, 1), step.value],
            ...bytFull(2, 2, 4, 4, 4, 4, 1, 1, 4)
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
}
