import { ipcMain, ipcRenderer } from 'electron'
import SerialPort from 'serialport'
import usbDetection from 'usb-detection'
import winManager from './WinManager'
import * as iconv from 'iconv-lite'
import logger from './Logger'
import ipcManage from './IpcManage'
import { workSteps, controlCode, workStepsInput } from '../byt/port'
import agreement from './Agreement'
import { FixZero, toHex, bytFull } from '../utils'
import { typedKeys } from '@/shared/utils/index'

const Delimiter = SerialPort.parsers.Delimiter

export interface PortItem {
  port: SerialPort
  parser: SerialPort.parsers.Delimiter
}

export default class USBManager {
  cache = new Map<string, PortItem>()
  hasEvent = false
  stepList: any[] | null = null

  constructor() {
    this.init()
  }

  init() {
    ipcManage.setEmit('usbDetection', data => {
      if (data) {
        this.start()
      } else {
        this.destory()
      }
    })
    this.getSetpsList()
    this.writeWorkSteps()
    this.portWrite()
  }

  /** 开始监测USB */
  start() {
    this.sendList()
    if (this.hasEvent === false) {
      this.writePort()
      this.addEventUSBChange()
      this.hasEvent = true
    }
  }

  /** 结束监测USB */
  destory() {
    if (this.hasEvent === true) {
      this.cache.clear()
      usbDetection.stopMonitoring()
      ipcMain.removeHandler('writePort')
      this.hasEvent = false
    }
  }

  /** 发送列表 */
  async sendList() {
    const win = winManager.getWin('mainWin')
    if (win) {
      try {
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
        ipcManage.setSend('usbData', {
          type: 'list',
          list
        })
      } catch (err) {
        ipcManage.ipcError(err)
      }
    }
  }

  /** USB端口监听 */
  addEventUSBChange() {
    usbDetection.startMonitoring()
    usbDetection.on('change', () => {
      this.sendList()
    })
  }

  /** 获取选择工步列表 */
  getSetpsList() {
    ipcManage.setHandle('/port/setpsList', async () => {
      if (!this.stepList) {
        this.stepList = typedKeys(workSteps).map(key => {
          const step = workSteps[key]
          return {
            label: step.name,
            value: key,
            input: step.input || []
          }
        })
      }
      return this.stepList
    })
  }

  writePort() {
    ipcMain.handle('writePort', async (event, { path, data }) => {
      let portData = this.cache.get(path)
      if (!portData) {
        const port = new SerialPort(path, {
          baudRate: 115200
        })
        const parser = new Delimiter({
          delimiter: '\n'
        })

        port.pipe(parser)
        parser.on('data', msg => {
          logger.info(iconv.decode(msg, 'GBK'))
        })

        portData = { port, parser }
        this.cache.set(path, portData)
      }
      const status = portData.port.write(data, (s, d) => {
        console.log(s)
        console.log(d)
      })
      return status
    })
  }

  getPortData(path: string) {
    let portData = this.cache.get(path)
    if (!portData) {
      try {
        const port = new SerialPort(path, {
          baudRate: 115200
        })
        const parser = new Delimiter({
          delimiter: '\n'
        })
        port.pipe(parser)
        parser.on('data', buf => {
          console.log(buf)
          // const msg = iconv.decode(buf, 'GBK')
          // logger.info(msg)
          // ipcManage.setSend(`portData:${path}`, msg)
        })

        portData = { port, parser }
        this.cache.set(path, portData)
      } catch (err) {
        ipcManage.ipcError(err)
      }
    }
    return portData
  }

  portWrite() {
    ipcManage.setEmit('portWrite', (path: string, data: string) => {
      const portData = this.getPortData(path)
      if (portData) {
        portData.port.write(data)
      }
    })
  }

  /** 写工步 */
  writeWorkSteps() {
    ipcManage.setEmit('/port/writeWorkSteps', (data: any) => {
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
            ...bytFull(2, 2, 4, 4, 4, 4, 1, 1)
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
      console.log(agreement.setData(write, controlCode.writeWorkSteps))
      protItem.port.write(agreement.setData(write, controlCode.writeWorkSteps))
    })
  }
}
