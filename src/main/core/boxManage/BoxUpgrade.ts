import { BoxManage } from './BoxManage'
import { promises as fs } from 'fs'
import { UPGRADE_MODEL, UPGRADE_BACK_MODEL } from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import communi from '../Request/Communi'
import { CONTROL_CODE, ERROR_STATUS } from '@/shared/config/port'
import UpgradeDevice from './libs/UpgradeDevice'

/** 机柜升级控制 */
export default class BoxUpgrade {
  parent: BoxManage
  upgradeTask: UpgradeDevice | null = null

  constructor(parent: BoxManage) {
    this.parent = parent
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
    console.log('upgrade', opts)
  }

  async sendFileData(opts: any) {
    const { masterId } = opts
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

    const resultBuf = await communi.post({
      control: CONTROL_CODE.upgradeSend,
      data: writeModel.buf,
      masterId
    })

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
}

// 01
// 00
// ff
// 00000000 00
