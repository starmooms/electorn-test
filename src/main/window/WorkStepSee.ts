import winManager from '../core/WinManager'
import ipcManage from '../core/IpcManage'
import USBManager from '../core/USBManager'
import agreement from '../core/Agreement'
import {
  controlCode,
  END_STATUS,
  WORKSTEPS,
  workStepsInput
} from '@/shared/config/port'
import { sliceBufFormNum, toHex } from '../utils'
import logger from '../core/Logger'
import BufModel, { BufData } from '../utils/ParsBuf'

interface Opts {
  path: string
  slaverId: number
  channelId: number
}

export default class WorkStepSee {
  opts: Opts
  usbManager: USBManager

  constructor(opts: Opts, usbManager: USBManager) {
    this.opts = opts
    this.usbManager = usbManager
    this.createdWin()
  }

  getInputData(bufData: BufData, key: string) {
    const inputItem = workStepsInput[key]
    console.log(inputItem)
    return {
      data: bufData.getIndex(inputItem.serial),
      unit: inputItem.unit,
      name: inputItem.name
    }
  }

  createdWin() {
    const basePath = `${encodeURIComponent(this.opts.path)}/${
      this.opts.slaverId
    }/${this.opts.channelId}`
    const winName = `port/WorkerSee/${basePath}`
    if (winManager.getWin(winName, true)) {
      return true
    }
    const portItem = this.usbManager.getPortData(this.opts.path)
    if (!portItem) {
      return false
    }

    /** 读工步 */
    const getStepChannel = `getWorkerStep/${basePath}`
    ipcManage.handle(getStepChannel, async () => {
      const buf = Buffer.from([0x00, this.opts.slaverId, this.opts.channelId])
      const data = agreement.setData(buf, controlCode.slaver.stepsRead)
      logger.info('读工步发送', data.buf.toString('hex'))
      // const a = '00000000000000000000040000010000a10000010002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' // eslint-disable-line
      // const a = '00000000000000000000050000000000a100000001000000020000000000000000000000000000000000000000000100a2000000210000002c0000000000000000000000000000000000000000000200b00000022b0000029a00000000000000000000000000000000000000000003009000000000000000000000000000000000000000000000000000000000000400700000000000000000000000000000000000000009000000000000' // eslint-disable-line
      // const resultBuf = Buffer.from(a, 'hex')

      const resultBuf = await this.usbManager.post({
        portItem,
        data
      })
      logger.info('结果Buffer', resultBuf)
      const stepsLen = resultBuf.readUInt8(10)
      const stepsBuf = resultBuf.slice(11)
      const stepsList: any[] = []
      const bufModel = new BufModel([1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 4, 1, 1, 4]) // eslint-disable-line
      logger.info('读工步数目', stepsLen)
      for (let i = 0; i < stepsLen; i++) {
        const start = bufModel.bufLength * i
        const bufData = bufModel.getBufData(
          stepsBuf.slice(start, start + bufModel.bufLength)
        )
        const workerItem = WORKSTEPS[bufData.getIndexHex(5)]
        if (workerItem) {
          const worker = workerItem.input.worker.map(key =>
            this.getInputData(bufData, key)
          )
          const limt = workerItem.input.limt.map(key =>
            this.getInputData(bufData, key)
          )
          stepsList.push({
            id: bufData.getIndex(3),
            name: workerItem.name,
            worker,
            limt
          })
        }
        // stepsList.push({
        //   workerId: bufData.getIndex(3),

        // })
        // stepsList.push({
        //   version: bufData.getIndex(0),
        //   slaverId: bufData.getIndex(1),
        //   channelId: bufData.getIndex(2),
        //   workerId: bufData.getIndex(3),
        //   pattern: bufData.getIndex(4),
        //   workerCode: bufData.getIndexHex(5),
        //   time: bufData.getIndex(6),
        //   U: bufData.getIndex(7),
        //   I: bufData.getIndex(8),
        //   W: bufData.getIndex(9),
        //   R: bufData.getIndex(10),
        //   loopNum: bufData.getIndex(11),
        //   loopStart: bufData.getIndex(12),
        //   loopNumNow: bufData.getIndex(13),
        //   IEnd: bufData.getIndex(14)
        // })
      }
      logger.info('stepsList', stepsList)
      return stepsList
    })
    const win = winManager.createdWin(winName, winName)

    /** 读采样 */
    const closeTranslate = this.usbManager.readSlaverTranslate(
      portItem,
      0,
      this.opts.slaverId,
      winName
    )

    win.on('closed', () => {
      ipcManage.removeHandler(getStepChannel)
      closeTranslate()
    })
  }
}
