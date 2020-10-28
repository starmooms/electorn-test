import mainDb from '@/main/core/sqlite/MainDb'
import {
  CHANNEL_ERR_STATUS,
  CHANNEL_STATUS,
  CHANNEL_STATUS_END,
  ERROR_STATUS,
  CONTROL_CODE
} from '@/shared/config/port'
import { SAMP_MODEL, COMMON_READ } from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import historyDbCache from '@/main/core/sqlite/HistoryDBCache'
import communi from '@/main/core/Request/Communi'
import logger from '@/main/core/Logger'
import dayjs from 'dayjs'
import ipcManage from '../IpcManage'
import winManager from '../WinManager'
import { BoxManage } from './BoxManage'
import { testFilePath } from '@/main/utils/mock'
import { TIME_FORMAT } from '@/shared/utils'

/** 机柜采样控制 */
export default class BoxSamp {
  private readSampNow = false
  parent: BoxManage
  channelMap: BoxManage['channelMap']

  isRead = false
  timer: NodeJS.Timeout | null = null
  readSampWrite = this.getReadSampWrite()

  constructor(parent: BoxManage) {
    this.parent = parent
    this.channelMap = this.parent.channelMap
  }

  clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /** 暂停读采样 */
  sampSetStopRead() {
    this.clearTimer()
    this.isRead = false
  }

  /** 开始读采样 */
  sampSetRead() {
    if (this.isRead === true) return
    this.clearTimer()
    this.setTimeNext()
    this.isRead = true
  }

  setTimeNext() {
    if (this.readSampNow) return
    this.timer = setTimeout(async () => {
      try {
        this.readSampNow = true
        await this.readSamp()
      } catch (err) {
        logger.error(err)
      } finally {
        this.readSampNow = false
        if (this.isRead) {
          this.setTimeNext()
        }
      }
    }, 1000)
  }

  /** 读采样 发送BufModel */
  getReadSampWrite() {
    const writeModel = new BufModel({
      model: COMMON_READ
    })
    writeModel.writerBit('slaverBit', [], 1)
    writeModel.writerBit('channelBit', [], 1)
    return writeModel
  }

  /** 读通用采样工步数据 */
  getStepData(bufModel: BufModel) {
    return {
      workerCode: bufModel.readHex('workerCode'),
      stepId: bufModel.read('stepId'),
      U: bufModel.read('U') / 10,
      I: bufModel.read('I') / 10,
      vol: bufModel.read('vol') / 10,
      epower: bufModel.read('epower') / 10
    }
  }

  /** 读通用采样状态数据 */
  getStatusData(bufModel: BufModel) {
    return {
      projectId: bufModel.read('projectId'),
      loopNum: bufModel.read('loopNum'),
      stepTime: bufModel.read('stepTime') / 10
    }
  }

  /** 主数据库记录通道状态 */
  async mainSaveChannelStatus(channelStatus: Port.ChannelChangeItem[]) {
    try {
      if (channelStatus.length > 0) {
        await mainDb.saveChannelStatus(channelStatus)
      }
    } catch (err) {
      logger.error('mainSaveChannelStatus Error:', err)
    }
  }

  /** 主数据库记录错误列表 */
  async mainSaveError(errorList: Port.ErrorListItem[]) {
    try {
      if (errorList.length > 0) {
        await mainDb.saveErrorList(errorList)
      }
    } catch (err) {
      logger.error('mainSaveError Error:', err)
    }
  }

  /** 发送读采样请求 */
  async readSamp() {
    const masterId = 0

    // 发送读采样请求
    this.readSampWrite.writer('masterId', masterId)
    let resultBuf: Buffer
    if (this.parent.useDev) {
      // const a = `00000008000008000000a10100004886ffffff60000000000000000000000000010001000000040001a10100003bd900000000000000000000000000000000010001000000040002a10100003b8a00000000000000000000000000000000010001000000040003a10100003bd600000000000000000000000000000000010001000000040004a10100004ad200000000000000000000000000000000010001000000040005a10100003c0a00000000000000000000000000000000010001000000040006a10100003b1f00000000000000000000000000000000010001000000040007a1010000821100001bad000000000000000000000000010001000000040003900000003bd200000000000000040000000601000000010001000000650004900000004a9e00000000000000040000000701000000010001000000650005900000003c0f00000000000000040000000601000000010001000000650006900000003b18000000000000000400000006010000000100010000006500079000000082160000000000000000000000000100000001000100000065000090000000482300000000000000030000000701000000010001000000650001900000003bc500000000000000040000000601000000010001000000650002900000003b790000000000000004000000060100000001000100000065` // eslint-disable-line
      // const a = `00000008000000000000b002000086cbffffc5880000007b000001a3000000004000010000012f0001b00200008888ffffc5a40000007a000001ac000000004000010000012e0002b00200008a88ffffc6de0000007c000001c0000000004000010000012e0003b00200008e23ffffffd50000000000000003000000004000010000012e0004b00200008b70ffffc4610000007f000001c7000000004000010000012e0005b002000086bcffffc64f0000137c0000441f0000000040000100002f6c000600000000001a000000000000000000000000000000000000000000000000070000000000170000000000000000000000000000000000000000000000` // eslint-disable-line
      const a = `000000080000010000000200000089b3ffffff60000000000000000000000000000000000000000001020000008f1200000000000000000000000000000000000000000000000002030000008f23000000dd00001387000048e900000000510001000046510003a3020000905b00000f8600000d5f0000316a0000000048000100004c410004a3020000906c0000118a00000cef00002fd1000000004b0001000044dd0005a3020000905400001cd100001197000040ed000000004c0001000043a200060000000000350000000000000000000000000000000000000000000000000700000000001900000000000000000000000000000000000000000000000002a300000091b10000271800001387000048e90100000051000100004651` // eslint-disable-line
      resultBuf = Buffer.from(a, 'hex')
    } else {
      logger.debug('读采样发送', this.readSampWrite.buf.toString('hex'))
      resultBuf = await communi.post({
        control: CONTROL_CODE.sampRead,
        data: this.readSampWrite.buf,
        masterId
      })
      logger.debug('读采样返回', resultBuf.toString('hex'))
    }
    logger.debug('sampStart ==> 开始处理采样')
    const readModel = new BufModel({
      model: SAMP_MODEL,
      readBuf: resultBuf
    })
    // readModel.showAll()
    const {
      sampList,
      saveSampList,
      channelStatus,
      changeFilePath,
      errorList
    } = this.readSampModel(masterId, readModel)
    logger.debug('数据处理完成')

    try {
      await Promise.all([
        historyDbCache.saveSamp(saveSampList),
        this.mainSaveChannelStatus(channelStatus),
        this.mainSaveError(errorList)
      ])
      logger.debug('存储数据完成')
      if (channelStatus.length > 0 || changeFilePath.length > 0) {
        ipcManage.commonMsg('updateChannelList', [
          ...channelStatus,
          ...changeFilePath
        ])
      }
    } catch (err) {
      logger.error(err)
    }
    this.sendWin(masterId, sampList)
    logger.debug('sampEnd ==> 采样处理结束')
  }

  /** 发送采样列表到渲染端 */
  sendWin(masterId: number, sampList: Port.SampItem[]) {
    const win = winManager.getWin('mainWin')
    if (win) {
      ipcManage.send(
        `/port/translate/${masterId}`,
        () => {
          return { list: sampList }
        },
        win
      )
    }
  }

  /** 判断是否需要存储采样 */
  sampShouldSave(last, now, save) {
    return save && Math.abs(last - now) >= save
  }

  /** 更新采样上次时间记录 */
  channelSaveTime({ data, channel }: Port.ChannelSaveSampTime) {
    if (!channel) {
      const fullId = `${data.masterId}_${data.slaverId}_${data.channelId}`
      channel = this.channelMap.get(fullId)
    }
    if (channel) {
      channel.lastSaveTime = data.stepTime
    }
  }

  /** 解析采样返回, 改变通道状态 */
  readSampModel(masterId: number, readModel: BufModel) {
    const nowUnix = dayjs().unix()
    const nowDateTime = dayjs().format(TIME_FORMAT)
    const projectSamp: Port.SaveSampData = {} // 本此读取采样返回，需要写入对应的数据库
    const getProjectSamp: Port.GetProjectSamp = (projectId, key) => {
      let sampItem = projectSamp[projectId]
      if (!sampItem) {
        sampItem = {
          projectId,
          sampList: [],
          changeStatusList: [],
          endList: [],
          startList: [],
          featureList: []
        }
        projectSamp[projectId] = sampItem
      }
      return sampItem[key]
    }

    this.readStartList(masterId, readModel, getProjectSamp)
    const { sampList, changeFilePath } = this.readSampList(
      masterId,
      readModel,
      getProjectSamp,
      nowUnix,
      nowDateTime
    )
    this.readEndList(masterId, readModel, getProjectSamp)
    this.readFeatureList(masterId, readModel, getProjectSamp)
    const errorList = this.readErrorList(readModel)

    // 将需要存储的采样对象，改为列表数组
    let channelStatus: Port.ChannelChangeItem[] = []
    const saveSampList = Object.entries(projectSamp).map(data => {
      const saveSamp = data[1]
      const changeStatusItem = saveSamp.changeStatusList
      if (changeStatusItem.length > 0) {
        channelStatus = [...channelStatus, ...changeStatusItem]
      }
      return saveSamp
    })

    return {
      sampList,
      saveSampList,
      channelStatus,
      changeFilePath,
      errorList
    }
  }

  /** 读采样返回中的采样列表 */
  readSampList(
    masterId: number,
    readModel: BufModel,
    getProjectSamp: Port.GetProjectSamp,
    nowUnix: number,
    nowDateTime: string
  ) {
    /** 本此读取采样返回列表 */
    const sampList: Port.SampItem[] = []
    const changeFilePath: Port.ChannelChangeItem[] = []

    /** 读采样列表 */
    readModel.ecahList('sampList', readItem => {
      const workerCode = readItem.readHex('workerCode')
      const errCode = readItem.readHex('errCode')
      const samp: Port.SampItem = {
        masterId: masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        ...this.getStepData(readItem),
        ...this.getStatusData(readItem),
        errorCode: errCode,
        errorMsg: errCode !== '00' ? CHANNEL_ERR_STATUS[errCode] : '',
        workerStatus: CHANNEL_STATUS[workerCode] || this.parent.noWorkerStatus,
        endCode: '00',
        createTime: nowUnix
      }
      sampList.push(samp)
      if (samp.projectId === 0) return // 采样工程id为0，直接返回

      const fullId = `${masterId}_${samp.slaverId}_${samp.channelId}` // eslint-disable-line
      const channel = this.channelMap.get(fullId)
      if (!channel) {
        logger.error(`spam channel ${fullId} no found`)
        return
      }

      const lastSamp = channel.samp // eslint-disable-line
      channel.samp = samp

      const lastStatus = channel.nowStatus // 通道上次状态
      let nowStatus = lastStatus // 通道当前状态，默认为上回状态，下面通过采样判断

      let shouldSaveSamp = false // 是否保存采样
      let saveSampUpdateTime = false // 保存采样更新保存时间
      let changeChannel: Port.ChannelChangeItem | null = null

      // const testPath = testFilePath(samp)

      // 判断状态变化
      if (
        !nowStatus ||
        !lastSamp ||
        lastSamp.workerCode !== samp.workerCode ||
        lastSamp.projectId !== samp.projectId
      ) {
        nowStatus = CHANNEL_STATUS_END.includes(samp.workerCode) ? 'END' : 'RUN' // eslint-disable-line
        const filePath = historyDbCache.getFilePath(samp.projectId)
        if (lastStatus !== nowStatus || channel.filePath !== filePath) {
          channel.nowStatus = nowStatus
          channel.filePath = filePath
          changeChannel = {
            masterId: samp.masterId,
            slaverId: samp.slaverId,
            channelId: samp.channelId,
            time: nowDateTime,
            status: nowStatus,
            filePath: filePath
          }
          const projectId = samp.projectId
          const saveSampStatus = getProjectSamp(projectId, 'changeStatusList')
          saveSampStatus.push(changeChannel)
        }
      }

      // 判断是否需要存储采样
      if (!shouldSaveSamp && lastSamp && nowStatus === 'RUN') {
        const saveConf = historyDbCache.getSaveConf(samp.projectId)
        if (!saveConf) {
          shouldSaveSamp = true
        } else {
          if (!channel.filePath) {
            channel.filePath = historyDbCache.getFilePath(samp.projectId)
            changeFilePath.push({
              masterId: samp.masterId,
              slaverId: samp.slaverId,
              channelId: samp.channelId,
              time: nowDateTime,
              filePath: channel.filePath,
              status: channel.nowStatus!
            })
          }

          if (
            channel.lastSaveTime === null ||
            channel.lastSaveTime === samp.stepTime ||
            this.sampShouldSave(
              channel.lastSaveTime,
              samp.stepTime,
              saveConf.time
            )
          ) {
            saveSampUpdateTime = true
            shouldSaveSamp = true
          } else if (this.sampShouldSave(lastSamp.I, samp.I, saveConf.I)) {
            shouldSaveSamp = true
          } else if (this.sampShouldSave(lastSamp.U, samp.U, saveConf.U)) {
            shouldSaveSamp = true
          }
        }
      }

      if (shouldSaveSamp) {
        const saveSampList = getProjectSamp(samp.projectId, 'sampList')
        if (saveSampUpdateTime) {
          this.channelSaveTime({
            channel,
            data: samp
          })
        }
        saveSampList.push(samp)
      }
    })

    return {
      sampList,
      changeFilePath
    }
  }

  /** 读采样开始状态 */
  readStartList(
    masterId: number,
    readModel: BufModel,
    getProjectSamp: Port.GetProjectSamp
  ) {
    readModel.ecahList('startList', readItem => {
      const projectId = readItem.read('projectId')
      const start = getProjectSamp(projectId, 'startList')
      const data: Port.SampStart = {
        masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        stepId: readItem.read('stepId'),
        workerCode: readItem.readHex('workerCode'),
        U: readItem.read('U') / 10,
        I: readItem.read('I') / 10,
        loopNum: readItem.read('loopNum'),
        vol: 0,
        epower: 0,
        stepTime: 0,
        errorCode: '00',
        endCode: '00'
      }
      start.push(data)
      this.channelSaveTime({ data })
    })
  }

  /** 读采样返回的结束状态列表 */
  readEndList(
    masterId: number,
    readModel: BufModel,
    getProjectSamp: Port.GetProjectSamp
  ) {
    readModel.ecahList('endList', readItem => {
      const projectId = readItem.read('projectId')
      const end = getProjectSamp(projectId, 'endList')
      end.push({
        masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        ...this.getStepData(readItem),
        ...this.getStatusData(readItem),
        endCode: readItem.readHex('endCode'),
        errorCode: '00'
      })
    })
  }

  /** 读采样特征状态 */
  readFeatureList(
    masterId: number,
    readModel: BufModel,
    getProjectSamp: Port.GetProjectSamp
  ) {
    logger.debug('读特征列表')
    readModel.ecahList('featureList', readItem => {
      const projectId = readItem.read('projectId')
      const feature = getProjectSamp(projectId, 'featureList')
      logger.debug(`读到特征列表`)
      feature.push({
        masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        ...this.getStepData(readItem),
        ...this.getStatusData(readItem),
        featureType: readItem.read('featureType'),
        errorCode: '00',
        endCode: '00'
      })
    })
  }

  /** 读采样错误列表 */
  readErrorList(readModel: BufModel) {
    const errorList: Port.ErrorListItem[] = []
    readModel.ecahList('errorList', readItem => {
      errorList.push({
        masterId: readItem.read('masterId'),
        slaverIds: readItem.read('slaverId'),
        channelIds: readItem.read('channelId'),
        type: 2,
        action: '实时数据错误列表返回',
        errCode: readItem.readHex('errCode'),
        params1: readItem.readHex('params1'),
        params2: readItem.readHex('params2')
      })
    })
    return errorList
  }
}
