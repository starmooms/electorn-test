import {
  CHANNEL_ERR_STATUS,
  CHANNEL_STATUS,
  CHANNEL_STATUS_END,
  CONTROL_CODE
} from '@/shared/config/port'
import { SAMP_MODEL, COMMON_READ } from '@/shared/model'
import { BufWriteModel as BufModel } from '@/main/utils/bufModel'
import historyDbCache from '@/main/core/sqlite/HistoryDBCache'
import communi from '@/main/core/Request/Communi'
import logger from '@/main/core/Logger'
import dayjs from 'dayjs'
import ipcManage from '../IpcManage'
import { BoxManage } from './BoxManage'
import { TIME_FORMAT } from '@/shared/utils'
import SampSaveQueue from './libs/SampSaveQueue'

/** 记录采样参数 */
interface AddSampQueue {
  projectSamp: SampTB.SaveSampData
  errorList: Port.ErrorListItem[]
}

type ChUpdateStatus = Partial<
  Pick<Port.ChannelChangeItem, 'status' | 'filePath'>
>

interface ReadSampParams {
  masterId: number
  readModel: BufModel
  getProjectSamp: SampTB.GetProjectSamp
  createTime: string
}

/** 机柜采样控制 */
export default class BoxSamp {
  private readSampNow = false
  parent: BoxManage
  channelMap: BoxManage['channelMap']

  isRead = false
  timer: NodeJS.Timeout | null = null
  readSampWrite = this.getReadSampWrite()
  sampQueue = new SampSaveQueue()

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
        await this.startReadSamp()
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

  async startReadSamp() {
    const projectSamp: SampTB.SaveSampData = {} // 本此读取采样返回，需要写入对应的数据库
    const getProjectSamp: SampTB.GetProjectSamp = (projectId, key) => {
      let sampItem = projectSamp[projectId]
      if (!sampItem) {
        sampItem = {
          projectId,
          sampList: [],
          changeStatusList: [],
          startList: [],
          featureList: [],
          specialList: [],
          endList: []
        }
        projectSamp[projectId] = sampItem
      }
      return sampItem[key]
    }

    let errorList: Port.ErrorListItem[] = []

    logger.info('采样开始')
    await Promise.all(
      this.parent.connectMaster.map(async item => {
        try {
          const data = await this.readSamp(item.masterId, getProjectSamp)
          errorList = errorList.concat(data.errorList)
        } catch (err) {
          logger.error('readSamp_Error', err)
        }
      })
    )
    logger.info('采样结束')

    this.addSampQueue({ projectSamp, errorList })
  }

  /** 采样数据处理完成后存储更新状态 */
  addSampQueue({ projectSamp, errorList }: AddSampQueue) {
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

    // 发送通道状态到页面
    if (channelStatus.length > 0) {
      ipcManage.commonMsg('updateChannelList', [...channelStatus])
    }

    // 过滤掉文件改变
    const filterUpdateFile = channelStatus.filter(v => !v.isUpdateFile)

    // 推送进队列
    this.sampQueue.addQueue({
      saveSampList,
      channelStatus: filterUpdateFile,
      errorList
    })
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

  /** 发送采样列表到渲染端 */
  sendWin(masterId: number, sampList: SampTB.SampItem[]) {
    ipcManage.send(`/port/translate/${masterId}`, { list: sampList })
  }

  /** 发送读采样请求 */
  async readSamp(masterId: number, getProjectSamp: SampTB.GetProjectSamp) {
    // 发送读采样请求
    this.readSampWrite.writer('masterId', masterId)
    let resultBuf: Buffer
    if (this.parent.useDev) {
      const a = `00000008000800000000a300000000000000000000000000000000000000000093000100000001000100000000000000000000000000000000000000000000930001000000010002a3000000000000000000000000000000000000000000930001000000010003a3000000000000000000000000000000000000000000930001000000010004a3000000000000000000000000000000000000000000930001000000010005a3000000000000000000000000000000000000000000930001000000010006a3000000000000000000000000000000000000000000930001000000010007a30000000000000000000000000000000000000000009300010000000000000000009300a300008df800000000000100010000009300a30000002800000000000100020000009300a30000932900000000000100030000009300a30000926d00000000000100040000009300a3000091bf00000000000100050000009300a30000932900000000000100060000009300a30000906f00000000000100070000009300a3000090f5000000000001` // eslint-disable-line
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
    // logger.info('sampStart ==> 开始处理采样')

    const readModel = new BufModel({
      model: SAMP_MODEL,
      readBuf: resultBuf
    })
    // readModel.showAll()
    const { sampList, errorList } = this.readSampModel(
      masterId,
      readModel,
      getProjectSamp
    )

    this.sendWin(masterId, sampList)
    // logger.info('sampEnd ==> 采样处理结束')
    return {
      sampList,
      errorList
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
  readSampModel(
    masterId: number,
    readModel: BufModel,
    getProjectSamp: SampTB.GetProjectSamp
  ) {
    const createTime = dayjs().format(TIME_FORMAT)

    const params = {
      masterId,
      readModel,
      getProjectSamp,
      createTime
    }

    this.readStartList(params)
    const { sampList } = this.readSampList(params)
    this.readEndList(params)
    this.readFeatureList(params)
    const errorList = this.readErrorList(readModel)

    return {
      sampList,
      errorList
    }
  }

  /** 修改通道状态，并返回通道修改对象 */
  setChannel(
    channel: Port.ChannelItem,
    samp: SampTB.SampItem,
    update: ChUpdateStatus
  ) {
    Object.keys(update).forEach((key: string) => {
      channel[key] = update[key]
    })
    const data: Port.ChannelChangeItem = {
      masterId: samp.masterId,
      slaverId: samp.slaverId,
      channelId: samp.channelId,
      time: samp.createTime,
      status: channel.status!,
      filePath: channel.filePath!,
      isUpdateFile: false
    }
    return data
  }

  /** 读采样返回中的采样列表 */
  readSampList({ masterId, readModel, getProjectSamp, createTime }: ReadSampParams) { // eslint-disable-line
    /** 本此读取采样返回列表 */
    const sampList: SampTB.SampItem[] = []

    /** 读采样列表 */
    readModel.ecahList('sampList', readItem => {
      const workerCode = readItem.readHex('workerCode')
      const errCode = readItem.readHex('errCode')
      const samp: SampTB.SampItem = {
        masterId: masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        ...this.getStepData(readItem),
        ...this.getStatusData(readItem),
        errorCode: errCode,
        errorMsg: errCode !== '00' ? CHANNEL_ERR_STATUS[errCode] : '',
        workerStatus: CHANNEL_STATUS[workerCode] || this.parent.noWorkerStatus,
        endCode: '00',
        createTime: createTime
      }
      sampList.push(samp)
      const projectId = samp.projectId
      if (projectId === 0) return // 采样工程id为0，直接返回

      const fullId = `${masterId}_${samp.slaverId}_${samp.channelId}` // eslint-disable-line
      const channel = this.channelMap.get(fullId)
      if (!channel) {
        logger.error(`spam channel ${fullId} no found`)
        return
      }

      const lastSamp = channel.samp // eslint-disable-line
      channel.samp = samp
      const lastStatus = channel.status // 通道上次状态
      let nowStatus = lastStatus // 通道当前状态，默认为上回状态，下面通过采样判断
      let shouldSaveSamp = false // 是否保存采样
      let saveSampUpdateTime = false // 保存采样更新保存时间

      /** 更新通道状态 */
      const changeStatus = (update: ChUpdateStatus, isUpdateFile = false) => {
        const data = this.setChannel(channel, samp, update)
        const saveSampStatus = getProjectSamp(projectId, 'changeStatusList')
        data.isUpdateFile = isUpdateFile
        saveSampStatus.push(data)
      }

      // 判断状态变化
      if (
        !nowStatus ||
        !lastSamp ||
        lastSamp.workerCode !== workerCode ||
        lastSamp.projectId !== projectId
      ) {
        nowStatus = CHANNEL_STATUS_END.includes(workerCode) ? 'END' : 'RUN' // eslint-disable-line
        const filePath = historyDbCache.getFilePath(projectId)
        if (lastStatus !== nowStatus || channel.filePath !== filePath) {
          changeStatus({
            status: nowStatus,
            filePath
          })
        }
      }

      // 判断是否需要存储采样
      if (!shouldSaveSamp && lastSamp && nowStatus === 'RUN') {
        const saveConf = historyDbCache.getSaveConf(samp.projectId)
        if (!saveConf) {
          shouldSaveSamp = true
        } else {
          if (!channel.filePath) {
            // 上位机初始化时，如果通道正在运行，历史数据库没有打开
            // 首次读采样，打开数据库。 第二次读采样，才将文件路径绑定到通道上
            // 仅更新路径
            const filePath = historyDbCache.getFilePath(projectId)
            changeStatus({ filePath }, true)
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
          this.channelSaveTime({ channel, data: samp })
        }
        saveSampList.push(samp)
      }
    })

    return {
      sampList
    }
  }

  /** 读采样开始状态 */
  readStartList({ masterId, readModel, getProjectSamp, createTime }: ReadSampParams) { // eslint-disable-line
    readModel.ecahList('startList', readItem => {
      const projectId = readItem.read('projectId')
      const start = getProjectSamp(projectId, 'startList')
      const data = {
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
        endCode: '00',
        createTime
      }
      start.push(data)
      this.channelSaveTime({ data })
    })
  }

  /** 读采样返回的结束状态列表 */
  readEndList({ masterId, readModel, getProjectSamp, createTime }: ReadSampParams) { // eslint-disable-line
    readModel.ecahList('endList', readItem => {
      const projectId = readItem.read('projectId')
      const result = {
        masterId,
        slaverId: readItem.read('slaverId'),
        channelId: readItem.read('channelId'),
        ...this.getStepData(readItem),
        ...this.getStatusData(readItem),
        endCode: readItem.readHex('endCode'),
        errorCode: '00',
        createTime
      }
      const list = getProjectSamp(
        projectId,
        result.endCode === '0f' ? 'specialList' : 'endList'
      )
      list.push(result)
    })
  }

  /** 读采样特征状态 */
  readFeatureList({ masterId, readModel, getProjectSamp, createTime }: ReadSampParams) { // eslint-disable-line
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
        endCode: '00',
        createTime
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
