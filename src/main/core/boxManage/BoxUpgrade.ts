import { BoxManage } from './BoxManage'
import {
  UPGRADE_MODEL,
  UPGRADE_BACK_MODEL,
  RESTART_MASTER
} from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import communi from '../Request/Communi'
import { CONTROL_CODE, ERROR_STATUS } from '@/shared/config/port'
import UpgradeDevice from './libs/UpgradeDevice'
import logger from '../Logger'
import ipcManage from '../IpcManage'

/** 机柜升级控制 */
export default class BoxUpgrade {
  parent: BoxManage
  upgradeTask: UpgradeDevice | null = null

  constructor(parent: BoxManage) {
    this.parent = parent
  }

  upgradeEmitEnd() {
    this.upgradeTask = null
  }

  async upgradeStart(opts: ipcReq.UpgradeForm) {
    if (this.upgradeTask && this.upgradeTask.isRun) {
      throw new Error(`${this.upgradeTask.upgradeName} 升级中`)
    }

    this.upgradeTask = new UpgradeDevice({
      filePath: opts.filePath,
      masterIds: opts.masterIds,
      upgradeType: opts.upgradeType,
      boxUpgrade: this
    })
    await this.upgradeTask.start()
    return
  }

  async sendFileData(opts: any) {
    const { masterId } = opts
    // return new Promise(r => {
    //   setTimeout(() => {
    //     r(1)
    //   }, 1000)
    // })
    const writeModel = new BufModel({
      model: UPGRADE_MODEL
    })
    writeModel.writer('upgradeType', opts.upgradeType)
    writeModel.writer('masterId', masterId)
    writeModel.writer('total', opts.total)
    writeModel.writer('offset', opts.offset)
    writeModel.writer('size', opts.size)
    writeModel.writer('check', opts.check)
    writeModel.writer('totalCheck', opts.totalCheck)
    writeModel.concat(opts.buf)

    logger.debug('升级发送', writeModel.buf.toString('hex'))

    const resultBuf = await communi.post({
      control: CONTROL_CODE.upgradeSend,
      data: writeModel.buf,
      masterId
    })

    logger.debug('升级返回', resultBuf.toString('hex'))

    const readModel = new BufModel({
      model: UPGRADE_BACK_MODEL,
      readBuf: resultBuf
    })
    const errCode = readModel.readHex('errCode')
    if (errCode !== '00') {
      throw new Error(`ErrorCode ${ERROR_STATUS[errCode]}`)
    }
    return true
  }

  async masterRestart(opts: any) {
    const { masterId, restartType } = opts
    const writeModel = new BufModel({
      model: RESTART_MASTER
    })
    writeModel.writer('masterId', masterId)
    if (restartType === 2) {
      writeModel.writerBit('slaverId', [], 1)
    }
    await communi.post({
      control: CONTROL_CODE.restartMaster,
      data: writeModel.buf,
      masterId
    })
    return
  }

  /** 发送升级信息到桌面 */
  sendUpdateInfo(type: string, data: any) {
    const result = {
      data,
      type,
      info: this.upgradeTask
        ? {
            isRun: this.upgradeTask.isRun,
            percent: this.upgradeTask.percent,
            upgradeType: this.upgradeTask.upgradeType
          }
        : null
    }
    ipcManage.send('/boxUpdate/updateInfo', result)
  }
}

// 01
// 00
// ff
// 00000000 00
