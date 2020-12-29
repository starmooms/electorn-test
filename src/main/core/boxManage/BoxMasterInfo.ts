import { CONTROL_CODE } from '@/shared/config/port'
import {
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
import { promise as ping } from 'ping'
import handleError from '@/shared/config/handleError'

/** 机柜主控控制 */
export default class BoxMasterInfo {
  parent: BoxManage
  constructor(parent: BoxManage) {
    this.parent = parent
  }

  /** 删除ip连接 */
  async closeIpItem(masterId: number) {
    await communi.tpcRequest.closeTcpItem(masterId)
    this.updateConnect()
  }

  /** 刷新boxMange 当前连接机柜 */
  updateConnect() {
    this.parent.updateConnectMaster()
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
  }

  /** 获取ip列表 */
  async getIpList(): Promise<IpConfigT.IpTcpItem[]> {
    const list: StoreT.IpListItem[] = configManage.userConfig.get('ipList')
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
    const list: StoreT.IpListItem[] = configManage.userConfig.get('ipList')
    const index = list.findIndex(item => {
      return masterId === item.masterId && ip === item.ip
    })
    const ipItem = list[index]
    if (!ipItem) {
      throw new handleError.TipsError(
        `IP列表中查找不到对应项 masterId:${masterId} Ip:${ip}`
      )
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
    configManage.userConfig.set('ipList', list)
    await this.closeIpItem(ipItem.masterId)
    return true
  }

  /** 刷新连接 */
  async refreshConnect() {
    await communi.tpcRequest.createdConnect()
    this.updateConnect()
    return await this.getIpList()
  }

  /** 编辑机柜信息 */
  async setMasterInfo(opts: ipcReq.MasterInfoSetOpts) {
    const ip = opts.ip
    const changeIp = opts.ipOld !== ip
    if (changeIp) {
      const ipResult = await ping.probe(ip)
      if (ipResult.alive) {
        throw new handleError.TipsError(`IP ${ip} 被占用`)
      }
    }

    const writeModel = new BufModel({
      model: MASERT_INFO_SET
    })
    writeModel.writerHex('machineId', opts.machineId)
    writeModel.writer('masterId', opts.masterId)
    writeModel.writerIp('ip', ip)
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
    if (changeIp) {
      const { list, index } = this.findIpItem(opts.masterId, opts.ipOld)
      list[index].ip = ip
      configManage.userConfig.set('ipList', list)
      await this.closeIpItem(opts.masterId)
      status = 1
    }
    return {
      status
    }
  }
}
