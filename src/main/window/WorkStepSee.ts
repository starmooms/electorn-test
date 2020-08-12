import winManager from '../core/WinManager'
import ipcManage from '../core/IpcManage'
import USBManager from '../core/USBManager'
import agreement from '../core/Agreement'
import { controlCode, END_STATUS } from '@/shared/config/port'
import { sliceBufFormNum, toHex } from '../utils'
import logger from '../core/Logger'

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
    ipcManage.handle(getStepChannel, () => {
      return new Promise((resolve, reject) => {
        const buf = Buffer.from([0x00, this.opts.slaverId, this.opts.channelId])
        const result = agreement.setData(buf, controlCode.slaver.stepsRead)
        logger.info('读工步发送')
        logger.info(result.buf.toString('hex'))
        logger.info(result)
        let isTimeOut = false
        const timer = setTimeout(() => {
          logger.info('超时未返回')
          isTimeOut = true
          reject(new Error('PORT Time Out'))
        }, 2000)
        portItem.emitList[result.sId] = (data: Buffer) => {
          if (isTimeOut) return
          const dataLen = data.readUInt8(10)
          logger.info('读工步数目', dataLen)
          const stepsBuf = data.slice(11)
          const stepsData: any[] = []
          for (let i = 0; i < dataLen; i++) {
            const stepBuf = stepsBuf.slice(28 * i, 28)
            // const bufArr = sliceBuf(stepBuf, [1, 1, 1, 2, 1, 1, 2, 4, 1, 2, 4, 4]) // eslint-disable-line
            // const bufArr = sliceBufFormNum(stepBuf, [1, 1, 1, 2, 1, 1, 2, 4, { byte: 1, hasSigned: true }, 2, 4, 4]) // eslint-disable-line
            const bufArr = sliceBufFormNum(stepBuf, [1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 4, 1, 1, 4])// eslint-disable-line
            stepsData.push({
              version: bufArr[0],
              slaverId: bufArr[1],
              channelId: bufArr[2],
              workerId: bufArr[3],
              pattern: bufArr[4],
              workerCode: toHex(bufArr[5], 1),
              time: bufArr[6],
              U: bufArr[7],
              I: bufArr[8],
              W: bufArr[9],
              R: bufArr[10],
              loopNum: bufArr[11],
              loopStart: bufArr[12],
              loopNumNow: bufArr[13],
              IEnd: bufArr[14]
              // loopId: bufArr[3],
              // workId2: bufArr[4],
              // endStatus: END_STATUS[toHex(bufArr[5], 1)] || 'Error END_STATUS',
              // U: bufArr[6],
              // I: bufArr[7],
              // temp: bufArr[8],
              // time: bufArr[9],
              // Ah: bufArr[10],
              // Wh: bufArr[11]
            })
          }
          clearTimeout(timer)
          logger.info('读工步数目', stepsData)
          resolve(stepsData)
        }
        portItem.port.write(result.buf)
      })
    })
    const win = winManager.createdWin(winName, winName)

    win.on('closed', () => {
      ipcManage.removeHandler(getStepChannel)
    })
  }
}
