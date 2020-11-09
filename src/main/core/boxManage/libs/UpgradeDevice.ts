import * as fs from 'fs'
import { promisify } from 'util'
import BoxUpgrade from '../BoxUpgrade'
import logger from '../../Logger'
import NP from 'number-precision'
import _throttle from 'lodash/throttle'

// const fs = fsOrigin.promises
const readPromsie = promisify(fs.read)

// const readFun = (...args) => {
//   args[0] = args[0].fd
//   return readPromsie(...args)
// }

declare type Params = Pick<
  UpgradeDevice,
  'filePath' | 'masterIds' | 'boxUpgrade' | 'upgradeType'
>
declare type MasterQueue = ReturnType<UpgradeDevice['createMasterQueue']>

interface FileInfo {
  size: number
  check: number
}

/** 更新设备 */
export default class UpgradeDevice {
  filePath: string
  fileInfo!: FileInfo
  fileHandle!: fs.promises.FileHandle

  boxUpgrade: BoxUpgrade
  sizeLimt = 1 * 1024
  masterIds: number[]
  isRun = false

  upgradeType: 1 | 2
  upgradeName = ''

  queue: MasterQueue
  queueItemNow!: MasterQueue[0]

  percent = 0
  percentTotal = 0
  percentCur = 0
  sendPercentFun: any = null

  constructor({ filePath, masterIds, boxUpgrade, upgradeType }: Params) {
    this.filePath = filePath
    this.masterIds = masterIds
    this.queue = this.createMasterQueue(masterIds)
    this.boxUpgrade = boxUpgrade
    this.upgradeType = upgradeType
    this.upgradeName = this.getUpgradTypeName(upgradeType)
  }

  getUpgradTypeName(type: number) {
    if (type === 1) return '机柜'
    if (type === 2) return '从控'
    return ''
  }

  /** 开始升级 */
  async start() {
    if (this.isRun) return
    this.isRun = true
    await this.readFileInfo()
    await this.openFile()
    this.next()
    return
  }

  end(isSuccess = false) {
    this.isRun = false
    if (this.fileHandle) {
      this.fileHandle.close()
    }
    if (isSuccess) {
      this.boxUpgrade.sendUpdateInfo('success', `${this.upgradeName} 升级成功`)
    }
    this.boxUpgrade.upgradeEmitEnd()
  }

  setError(err: Error) {
    this.boxUpgrade.sendUpdateInfo(
      'error',
      `${this.upgradeName}升级发生错误已退出，${err.message}`
    )
    this.end()
  }

  async next() {
    try {
      if (!this.queueItemNow || this.queueItemNow.last >= this.fileInfo.size) {
        const queueItem = this.queue.shift()
        if (!queueItem) return this.end(true)
        this.queueItemNow = queueItem
      }
      await this.sendFileData()
      await this.checkRestart()
      this.next()
      return
    } catch (err) {
      logger.error(err)
      this.setError(err)
    }
  }

  /** 读取文件信息 */
  async readFileInfo() {
    const info = await fs.promises.stat(this.filePath)
    const data = await fs.promises.readFile(this.filePath)
    this.fileInfo = {
      size: info.size,
      check: this.getCheck(data)
    }
    this.percentTotal = NP.times(this.fileInfo.size, this.queue.length)
  }

  /** 打开文件 */
  async openFile() {
    this.fileHandle = await fs.promises.open(this.filePath, 'r')
  }

  /** 读文件 */
  async readFile(buf: Buffer, start: number, length: number, position: number) {
    return readPromsie(this.fileHandle.fd, buf, start, length, position)
  }

  /** 根据主控创建队列 */
  createMasterQueue(masterIds: number[]) {
    return masterIds.map((id, index) => {
      return {
        index,
        masterId: id,
        last: 0
      }
    })
  }

  /** 获取校验和 */
  getCheck(buf: Buffer) {
    return buf.reduce((total, item) => (total += item), 0)
  }

  /** 计算百分比 */
  updatePercent(bufLen: number) {
    this.percentCur += bufLen
    this.percent = NP.round(NP.divide(this.percentCur, this.percentTotal), 6)
    this.sendPercent()
  }

  /** 发送百分比信息 */
  sendPercent() {
    if (!this.sendPercentFun) {
      this.sendPercentFun = _throttle(() => {
        if (this.isRun && this.percent < 1) {
          this.boxUpgrade.sendUpdateInfo('info', '')
        }
      }, 1000)
    }
    this.sendPercentFun()
  }

  /** 发送文件数据 */
  async sendFileData() {
    const { masterId, last } = this.queueItemNow
    const sizeLimt = this.sizeLimt
    let buf = Buffer.alloc(sizeLimt)
    const result = await this.readFile(buf, 0, sizeLimt, last)
    const sizeRead = result.bytesRead
    if (sizeRead !== sizeLimt) {
      buf = buf.slice(0, sizeRead + 1)
    }
    this.queueItemNow.last = last + sizeRead
    const check = this.getCheck(buf)
    logger.debug(buf.toString('hex'))
    await this.boxUpgrade.sendFileData({
      upgradeType: this.upgradeType,
      masterId,
      total: this.fileInfo.size,
      offset: last,
      size: sizeRead,
      check,
      buf,
      totalCheck: this.fileInfo.check
    })
    this.updatePercent(sizeRead)
    return
  }

  /** 机柜发送完文件后重启 */
  async checkRestart() {
    const runItem = this.queueItemNow
    if (runItem && runItem.last >= this.fileInfo.size) {
      await this.boxUpgrade.masterRestart({
        masterId: this.queueItemNow.masterId,
        restartType: this.upgradeType
      })
    }
  }
}
