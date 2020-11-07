import * as fs from 'fs'
import { promisify } from 'util'
import BoxUpgrade from '../BoxUpgrade'
import logger from '../../Logger'

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
    await this.readFileInfo()
    await this.openFile()
    return this.next()
  }

  end() {
    this.isRun = false
    if (this.fileHandle) {
      this.fileHandle.close()
    }
  }

  async next() {
    try {
      if (!this.queueItemNow || this.queueItemNow.last >= this.fileInfo.size) {
        const queueItem = this.queue.shift()
        if (!queueItem) return this.end()
        this.queueItemNow = queueItem
      }
      await this.sendFileData()
      return this.next()
    } catch (err) {
      logger.error(err)
      this.end()
    }
  }

  /** 读取文件信息 */
  async readFileInfo() {
    const info = await fs.promises.stat(this.filePath)
    const data = await fs.promises.readFile(this.filePath)
    logger.info(info)
    this.fileInfo = {
      size: info.size,
      check: this.getCheck(data)
    }
  }

  /** 打开文件 */
  async openFile() {
    this.fileHandle = await fs.promises.open(this.filePath, 'r')
  }

  async readFile(buf: Buffer, start: number, length: number, position: number) {
    return readPromsie(this.fileHandle.fd, buf, start, length, position)
  }

  /** 根据主控创建队列 */
  createMasterQueue(masterIds: number[]) {
    return masterIds.map(id => {
      return {
        masterId: id,
        last: 0
      }
    })
  }

  /** 获取校验和 */
  getCheck(buf: Buffer) {
    return buf.reduce((total, item) => (total += item), 0)
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
    this.queueItemNow.last = last + buf.length
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
    return
  }
}
