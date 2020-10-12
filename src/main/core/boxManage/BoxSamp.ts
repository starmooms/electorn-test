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

  /** 发送读采样请求 */
  async readSamp() {
    const masterId = 0

    // 发送读采样请求
    this.readSampWrite.writer('masterId', masterId)
    let resultBuf: Buffer
    if (this.parent.isDev) {
      const a = `0000000801010000a10000000100000035980000000000000000000000000100000001a10000000100000035980000000000000000000000000100000002020000000100000035980000000000000000000000000100000003020000000100000035980000000000000000000000000100000004020000000100000035980000000000000000000000000100000005020000000100000035980000000000000000000000000100000006020000000100000035980000000000000000000000000100000007020000000100000035980000000000000000000000000100000000000100000001000000010001000000010001` // eslint-disable-line
      resultBuf = Buffer.from(a, 'hex')
    } else {
      logger.info('读采样发送', this.readSampWrite.buf.toString('hex'))
      resultBuf = await communi.post({
        control: CONTROL_CODE.sampRead,
        data: this.readSampWrite.buf,
        masterId
      })
      logger.info('读采样返回', resultBuf.toString('hex'))
    }
    const readModel = new BufModel({
      model: SAMP_MODEL,
      readBuf: resultBuf
    })
    const {
      sampList,
      saveSampList,
      channelStatus,
      changeFilePath,
      errorList
    } = this.readSampModel(masterId, readModel)

    try {
      await historyDbCache.saveSamp(saveSampList)
      if (channelStatus.length > 0) {
        await mainDb.saveChannelStatus(channelStatus)
      }
      if (errorList.length > 0) {
        await mainDb.saveErrorList(errorList)
      }
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
    // if (errorList.length > 0) {
    //   redisClient.saveError(errorList)
    // }
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

  /** 解析采样返回, 改变通道状态 */
  readSampModel(masterId: number, readModel: BufModel) {
    const nowUnix = dayjs().unix()
    const nowTime = dayjs().valueOf()
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

    const { sampList, changeFilePath } = this.readSampList(
      masterId,
      readModel,
      getProjectSamp,
      nowUnix,
      nowTime
    )
    this.readEndStatusList(masterId, readModel, getProjectSamp)
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
    nowTime: number
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
      let changeChannel: Port.ChannelChangeItem | null = null

      // 判断状态变化
      if (!nowStatus || !lastSamp || lastSamp.workerCode !== samp.workerCode) {
        nowStatus = CHANNEL_STATUS_END.includes(samp.workerCode) ? 'END' : 'RUN' // eslint-disable-line
        if (lastStatus !== nowStatus) {
          shouldSaveSamp = true
          channel.nowStatus = nowStatus
          channel.filePath = historyDbCache.getFilePath(samp.projectId)
          changeChannel = {
            masterId: samp.masterId,
            slaverId: samp.slaverId,
            channelId: samp.channelId,
            time: nowTime,
            status: nowStatus,
            filePath: channel.filePath
          }
          const projectId = samp.projectId
          const saveSampStatus = getProjectSamp(projectId, 'changeStatusList')
          saveSampStatus.push(changeChannel)
        }
      }

      // 判断是否需要存储采样
      if (!shouldSaveSamp && lastSamp) {
        if (lastSamp.projectId !== samp.projectId) {
          shouldSaveSamp = true
        } else if (nowStatus === 'RUN') {
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
                time: nowTime,
                filePath: channel.filePath,
                status: channel.nowStatus!
              })
            }
            if (
              !channel.lastSaveTime ||
              nowTime - channel.lastSaveTime >= saveConf.time
            ) {
              shouldSaveSamp = true
            } else if (
              saveConf.I &&
              Math.abs(lastSamp.I - samp.I) >= saveConf.I
            ) {
              shouldSaveSamp = true
            } else if (
              saveConf.U &&
              Math.abs(lastSamp.U - samp.U) >= saveConf.U
            ) {
              shouldSaveSamp = true
            }
          }
        }
      }

      if (shouldSaveSamp) {
        const saveSampList = getProjectSamp(samp.projectId, 'sampList')
        channel.lastSaveTime = nowTime
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
      start.push({
        masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        stepId: readItem.read('stepId'),
        workerCode: readItem.readHex('workerCode'),
        U: readItem.read('U') / 10
      })
    })
  }

  /** 读采样返回的结束状态列表 */
  readEndStatusList(
    masterId: number,
    readModel: BufModel,
    getProjectSamp: Port.GetProjectSamp
  ) {
    readModel.ecahList('errorList', readItem => {
      const projectId = readItem.read('projectId')
      const end = getProjectSamp(projectId, 'endList')
      end.push({
        masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        ...this.getStepData(readItem),
        ...this.getStatusData(readItem),
        endCode: readItem.read('endCode')
      })
    })
  }

  /** 读采样特征状态 */
  readFeatureList(
    masterId: number,
    readModel: BufModel,
    getProjectSamp: Port.GetProjectSamp
  ) {
    readModel.ecahList('featureList', readItem => {
      const projectId = readItem.read('projectId')
      const feature = getProjectSamp(projectId, 'featureList')
      feature.push({
        masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        ...this.getStepData(readItem),
        ...this.getStatusData(readItem),
        featureType: readItem.read('featureType')
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
