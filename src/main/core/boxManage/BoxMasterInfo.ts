import { CONTROL_CODE } from '@/shared/config/port'
import {
  LAMP_MODEL,
  MASERT_INFO_READ,
  VERSERION,
  MASERT_INFO,
  MASERT_INFO_SET
} from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import logger from '@/main/core/Logger'
import communi from '@/main/core/Request/Communi'
import { BoxManage } from './BoxManage'
import configManage from '../ConfigManage'
import { getMasterInfoObj } from '@/shared/utils'

/** 机柜主控控制 */
export default class BoxMasterInfo {
  parent: BoxManage
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  async getMasterInfo(masterId: number) {
    const info: IpConfigT.MasterInfo = getMasterInfoObj()
    info.status = communi.tpcRequest.getClientStatus(masterId)
    if (info.status === 2) {
      try {
        const writeModel = new BufModel({
          model: MASERT_INFO_READ
        })
        writeModel.writer('version', VERSERION)
        writeModel.writer('masterId', masterId)
        logger.debug('读主控信息发送', writeModel.buf.toString('hex'))
        const resultBuf = await communi.post({
          control: CONTROL_CODE.masterInfoRead,
          data: writeModel.buf,
          masterId,
          requestType: 'Tcp'
        })
        logger.debug('读主控信息返回', resultBuf.toString('hex'))
        const readModel = new BufModel({
          model: MASERT_INFO,
          readBuf: resultBuf
        })
        // readModel.showAll()
        info.version = readModel.readStr('version')
        info.masterId = readModel.read('masterId')
        info.machineId = readModel.readHex('machineId')
        info.ip = readModel.readIp('ip')
        info.mask = readModel.readIp('mask')
        info.gateway = readModel.readIp('gateway')
        readModel.ecahList('slaverList', readItem => {
          info.slaverList.push({
            version: readItem.readStr('version'),
            slaverId: readItem.read('slaverId'),
            machineId: readItem.readHex('machineId')
          })
        })
      } catch (err) {
        logger.error(err)
        info.status = 4
        info.errMsg = err.message
      }
    }
    return info

    // if (!communi.tpcRequest) {
    //   throw new Error('未生成Tcp管理对象')
    // }
    // list.map(ip => {
    //   try {
    //     communi.tpcRequest!.getMasterInfo(ip)
    //   } catch (err) {
    //     logger.error(err)
    //   }
    // })
  }

  /** 获取ip列表 */
  async getIpList(): Promise<IpConfigT.IpTcpItem[]> {
    const list: Store.IpListItem[] = configManage.userConfig.get('base.ipList')
    const resultListP = list.map(async item => {
      const masterInfo = await this.getMasterInfo(item.masterId)
      return {
        ...item,
        masterInfo
      }
    })
    const data = await Promise.all(resultListP)
    return data
  }

  findIpItem(masterId: number, ip: string) {
    const list: Store.IpListItem[] = configManage.userConfig.get('base.ipList')
    const index = list.findIndex(item => {
      return masterId === item.masterId && ip === item.ip
    })
    const ipItem = list[index]
    if (!ipItem) {
      throw new Error('查找不到对应项')
    }
    return {
      index,
      ipItem,
      list
    }
  }

  /** 删除ip */
  async delIpItem(opts: ipcReq.MasterInfoDelIp) {
    const { list, ipItem, index } = this.findIpItem(opts.masterId, opts.ip)
    list.splice(index, 1)
    configManage.userConfig.set('base.ipList', list)
    await communi.tpcRequest.closeTcpItem(ipItem.masterId)
    return true
  }

  /** 刷新连接 */
  async refreshConnect() {
    await communi.tpcRequest.createdConnect()
    return await this.getIpList()
  }

  /** 编辑机柜信息 */
  async setMasterInfo(opts: ipcReq.MasterInfoSetOpts) {
    const writeModel = new BufModel({
      model: MASERT_INFO_SET
    })
    writeModel.writerHex('machineId', opts.machineId)
    writeModel.writer('masterId', opts.masterId)
    writeModel.writerIp('ip', opts.ip)
    writeModel.writerIp('mask', opts.mask)
    writeModel.writerIp('gateway', opts.gateway)
    logger.debug('编辑主控信息发送', writeModel.buf.toString('hex'))
    const resultBuf = await communi.post({
      control: CONTROL_CODE.masterInfoSet,
      data: writeModel.buf,
      masterId: opts.masterId,
      requestType: 'Tcp'
    })
    logger.debug('编辑主控信息返回', resultBuf.toString('hex'))
    let status = 2
    if (opts.ipOld !== opts.ip) {
      const { list, index } = this.findIpItem(opts.masterId, opts.ipOld)
      list[index].ip = opts.ip
      configManage.userConfig.set('base.ipList', list)
      await communi.tpcRequest.closeTcpItem(opts.masterId)
      status = 1
    }
    return {
      status
    }
  }
}
