import BoxManage from './BoxManage'
import mainDb from '@/main/core/sqlite/MainDb'
import {
  WORKSTEPS_MAP,
  getCalList,
  channelList,
  PROTECT,
  WORKSTEPS_TYPE_MAP,
  WORKSTEPSINPUT,
  CHANNEL_ERR_STATUS,
  CHANNEL_STATUS,
  CHANNEL_STATUS_END,
  ERROR_STATUS,
  CONTROL_CODE
} from '@/shared/config/port'
import {
  WORKER_STEP_MODEL,
  WORKER_SATUS_MODEL,
  WORKER_START_MODEL,
  SAMP_MODEL,
  CAL_MODEL,
  COMMON_READ
} from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import historyDbCache from '@/main/core/sqlite/HistoryDBCache'
import logger from '@/main/core/Logger'
import dayjs from 'dayjs'

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
    }
  }

  sampSetStopRead() {
    this.clearTimer()
    this.isRead = false
  }

  async sampSetRead() {
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

  /** 读采样发送BufModel */
  getReadSampWrite() {
    const writeModel = new BufModel({
      model: COMMON_READ
    })
    writeModel.writerBit('slaverBit', [], 1)
    writeModel.writerBit('channelBit', [], 1)
    return writeModel
  }

  /** 读采样 */
  async readSamp() {
    const masterId = 0

    // 发送读采样请求
    this.readSampWrite.writer('masterId', masterId)
    let resultBuf: Buffer
    if (this.parent.isDev) {
      const a = `0000000800010000a10000000100000035980000000000000000000000000100000001a10000000100000035980000000000000000000000000100000002020000000100000035980000000000000000000000000100000003020000000100000035980000000000000000000000000100000004020000000100000035980000000000000000000000000100000005020000000100000035980000000000000000000000000100000006020000000100000035980000000000000000000000000100000007020000000100000035980000000000000000000000000100000001000000010001` // eslint-disable-line
      resultBuf = Buffer.from(a, 'hex')
    } else {
      logger.info('读采样发送', this.readSampWrite.buf.toString('hex'))
      resultBuf = await this.parent.post({
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
    this.readSampModel(masterId, readModel)
  }

  /** 解析采样返回 */
  readSampModel(masterId: number, readModel: BufModel) {
    // 解析读采样返回
    const nowUnix = dayjs().unix()
    const nowTime = dayjs().valueOf()
    /** 本此读取采样返回列表 */
    const list: any[] = []
    const channelStatus: Port.ChannelChangeItem[] = []
    const changeFilePath: Port.ChannelChangeItem[] = []
    const projectSamp: Port.SaveSampData = {}
    const getProjectSamp = (projectId, key) => {
      let sampItem = projectSamp[projectId]
      if (!sampItem) {
        sampItem = {
          projectId,
          sampList: [],
          changeStatusList: [],
          endStatusList: []
        }
        projectSamp[projectId] = sampItem
      }
      return sampItem[key]
    }

    // 采样列表返回
    readModel.ecahList('sampList', readItem => {
      const workerCode = readItem.readHex('workerCode')
      const errCode = readItem.readHex('errCode')
      const samp: Port.SampItem = {
        masterId: masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        workerCode: workerCode,
        workerId: readItem.read('workerId'),
        U: readItem.read('U') / 10,
        I: readItem.read('I') / 10,
        vol: readItem.read('vol') / 10,
        epower: readItem.read('epower') / 10,
        projectId: readItem.read('projectId'),
        loopNum: readItem.read('loopNum'),
        errorCode: errCode,
        errorMsg: errCode !== '00' ? CHANNEL_ERR_STATUS[errCode] : '',
        workerStatus: CHANNEL_STATUS[workerCode] || this.parent.noWorkerStatus,
        createTime: nowUnix
      }
      list.push(samp)
      if (samp.projectId === 0) return
          const fullId = `${masterId}_${samp.slaverId}_${samp.channelId}` // eslint-disable-line
      const channel = this.channelMap.get(fullId)
      if (!channel) {
        logger.error(`spam channel ${fullId} no found`)
        return
      }
          const lastSamp = channel.samp // eslint-disable-line
      channel.samp = samp

      let shouldSaveSamp = false // 是否保存采样
      const lastStatus = channel.nowStatus // 通道上次状态
      let nowStatus = lastStatus // 通道当前状态，默认为上回状态，下面通过采样判断
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
          channelStatus.push(changeChannel)
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

    // 采样结束状态列表
    readModel.ecahList('endStatusList', readItem => {
      const projectId = readItem.read('projectId')
      const saveSampEnd = getProjectSamp(projectId, 'endStatusList')
      saveSampEnd.push({
        masterId: masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        workerId: readItem.read('workerId'),
        endCode: readItem.readHex('endCode')
      })
    })

    // 采样错误列表
    const errorList: Port.SampErrorItem[] = []
    readModel.ecahList('errorList', readItem => {
      const errCode = readItem.readHex('errCode')
      errorList.push({
        masterId: readItem.read('masterId'),
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        action: '实时数据错误列表返回',
        errCode,
        params1: readItem.readHex('params1'),
        params2: readItem.readHex('params2'),
        createTime: nowTime,
        type: 'SampError',
        errMsg: ERROR_STATUS[errCode]
      })
    })
  }
}
