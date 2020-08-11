import winManager from '../core/WinManager'
import ipcManage from '../core/IpcManage'
import USBManager from '../core/USBManager'
import agreement from '../core/Agreement'
import { controlCode, END_STATUS } from '@/shared/config/port'
import { sliceBufFormNum, toHex } from '../utils'

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
    ipcManage.setHandle(`getWorkerStep/${basePath}`, () => {
      return new Promise((resolve, reject) => {
        const buf = Buffer.from([
          0x00,
          0,
          this.opts.slaverId,
          this.opts.channelId
        ])
        const result = agreement.setData(buf, controlCode.slaver.stepsRead)
        let isTimeOut = false
        const timer = setTimeout(() => {
          isTimeOut = true
          reject(new Error('time out'))
        }, 2000)
        portItem.emitList[result.sId] = (data: Buffer) => {
          if (isTimeOut) return
          const dataLen = data.readUInt8(2)
          const stepsBuf = data.slice(3)
          const stepsData: any[] = []
          for (let i = 0; i < dataLen; i++) {
            const stepBuf = stepsBuf.slice(12 * i, 12)
            // const bufArr = sliceBuf(stepBuf, [1, 1, 1, 2, 1, 1, 2, 4, 1, 2, 4, 4]) // eslint-disable-line
            const bufArr = sliceBufFormNum(stepBuf, [1, 1, 1, 2, 1, 1, 2, 4, { byte: 1, hasSigned: true }, 2, 4, 4]) // eslint-disable-line
            stepsData.push({
              slaverId: bufArr[0],
              channcl: bufArr[1],
              workId: bufArr[2],
              loopId: bufArr[3],
              workId2: bufArr[4],
              endStatus: END_STATUS[toHex(bufArr[5], 1)] || 'Error END_STATUS',
              U: bufArr[6],
              I: bufArr[7],
              temp: bufArr[8],
              time: bufArr[9],
              Ah: bufArr[10],
              Wh: bufArr[11]
            })
          }
          clearTimeout(timer)
          resolve(stepsData)
        }
        portItem.port.write(result.buf)
      })
    })
    winManager.createdWin(winName, winName)
  }
}
