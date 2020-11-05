import NP from 'number-precision'
import { deepClone, TIME_FORMAT } from '@/shared/utils'
import BoxCal from '../BoxCal'
import Bluebird from 'bluebird'
import dayjs from 'dayjs'
import logger from '../../Logger'

/** 根据修调类型生成修调点队列 */
interface PointQueueItem {
  channelIds: number[]
  point: number
  pointIndex: number
}

/** 修调类型队列 */
interface TypeQueueItem {
  masterId: number
  slaverId: number
  calType: string
  calTypeName: string
  meanwhile: boolean
  pointerList: number[]
  unit: string
}

// interface Params {
//   runType: 1 | 5 // 1、通道校准 2、复检
//   typeList: TypeQueueItem[]
//   masterId: number
//   slaverId: number
//   channelIds: number[]
//   boxCal: BoxCal
// }

declare type Params = Pick<
  RunPointQueue,
  | 'runType'
  | 'typeList'
  | 'masterId'
  | 'slaverId'
  | 'channelIds'
  | 'boxCal'
  | 'standard'
>

/** 修调点队列 */
export default class RunPointQueue {
  typeList: TypeQueueItem[] = []
  typeNow!: TypeQueueItem

  masterId: number
  slaverId: number
  channelIds: number[] = []
  runType: 1 | 5
  runTypeName = ''
  standard: number

  pointQueue: PointQueueItem[] = []
  pointNow: PointQueueItem | null = null

  pointResultCache: CalibrateT.CalRunResultCache = {}
  abResultList: CalibrateTB.AbListItem[] = []

  isRun = false
  boxCal: BoxCal

  constructor({
    typeList,
    masterId,
    slaverId,
    channelIds,
    boxCal,
    runType,
    standard
  }: Params) {
    this.runType = runType
    this.typeList = typeList
    this.masterId = masterId
    this.slaverId = slaverId
    this.channelIds = channelIds
    this.boxCal = boxCal
    this.standard = standard
    this.runTypeName = this.runType === 1 ? '修调' : '复检'
  }

  start() {
    this.isRun = true
    this.next()
    this.boxCal.sendCalResult('info', null)
  }

  async end(isSuccess = false) {
    this.isRun = false
    if (isSuccess) {
      this.boxCal.sendCalResult(
        'msg',
        `${this.runTypeName}完成 ${dayjs().format(TIME_FORMAT)}`
      )
    }
    await this.closeCal()
    this.boxCal.stopCalEmit()
  }

  async stop() {
    await this.end()
    this.boxCal.sendCalResult(
      'msg',
      `${this.runTypeName}已暂停 ${dayjs().format(TIME_FORMAT)}`
    )
    return
  }

  setError(err: Error) {
    logger.error(err)
    this.end()
    this.boxCal.sendCalResult(
      'error',
      `${this.runTypeName}错误已停止 ${err.message}`
    )
  }

  /** 获取当前修调点 */
  getPointNow() {
    if (!this.pointNow) {
      throw new Error(`pointNow undefined`)
    }
    return this.pointNow
  }

  /** 根据通道号，获取修调点结果缓存 */
  getPointResultCache(channelId: number) {
    let cache = this.pointResultCache[channelId]
    if (!cache) {
      cache = {}
      this.pointResultCache[channelId] = cache
    }
    return cache
  }

  /** 获取调修点结果 */
  getPointResult(channelId: number, pointIndex: number) {
    const cache = this.getPointResultCache(channelId)
    if (cache) {
      const result = cache[pointIndex]
      if (result) {
        return result
      }
    }
    throw new Error(`pointerResult Error ${channelId}_${pointIndex}`)
  }

  /** 清空调修点结果 */
  clearPointRestul() {
    this.pointResultCache = {}
  }

  /** 运行下一个修调点 */
  async next() {
    try {
      if (!this.isRun) return
      if (this.pointQueue.length === 0) {
        return this.typeQueueStart()
      }
      this.pointNow = this.pointQueue.shift()!
      await this.pointSet()
      await Bluebird.delay(2000)
      if (!this.isRun) return
      await this.pointRead()
      await this.pointSendCheck()
      return this.next()
    } catch (err) {
      this.setError(err)
    }
  }

  /** 根据调修类型队列生成新的修调点队列 */
  async typeQueueStart() {
    try {
      if (this.typeList.length === 0) {
        await this.sendAbList()
        return this.end(true)
      }
      this.clearPointRestul()
      this.typeNow = this.typeList.shift()!

      // 是否可以批量修调
      if (this.typeNow.meanwhile) {
        this.typeNow.pointerList.forEach((pointe, index) => {
          this.addPointQueue(this.channelIds, pointe, index)
        })
      } else {
        this.channelIds.forEach(channelId => {
          this.typeNow.pointerList.forEach((pointe, index) => {
            this.addPointQueue([channelId], pointe, index)
          })
        })
      }
      return this.next()
    } catch (err) {
      this.setError(err)
    }
  }

  /** 添加修调点队列 */
  addPointQueue(channelIds: number[], point: number, pointIndex: number) {
    this.pointQueue.push({
      channelIds,
      point,
      pointIndex
    })
  }

  /** 设置修调点 */
  async pointSet() {
    const point = this.getPointNow()
    await this.boxCal.setCal({
      type: this.runType,
      masterId: this.typeNow.masterId,
      slaverId: this.typeNow.slaverId,
      channelIds: point.channelIds,
      calType: this.typeNow.calType,
      pointer: point.point
    })
  }

  /** 读修调点,缓存结果 */
  async pointRead() {
    const { channelIds, pointIndex } = this.getPointNow()
    const params = {
      masterId: this.typeNow.masterId,
      slaverId: this.typeNow.slaverId,
      channelIds: channelIds,
      calType: this.typeNow.calType,
      type: 1
    }
    const [sampResult, actualResult] = await Promise.all([
      this.boxCal.readCalSamp(params),
      this.boxCal.readCalSamp(params, true)
    ])
    channelIds.forEach(channelId => {
      const cache = this.getPointResultCache(channelId)
      const samp = this.boxCal.getCalResultSamp(sampResult, channelId)
      const actual = this.boxCal.getCalResultSamp(actualResult, channelId)
      cache[pointIndex] = {
        samp,
        actual
      }
    })
  }

  /** 检查是否需要发送ab值和结果列表 */
  async pointSendCheck() {
    if (this.runType === 1) {
      this.sendCalRunResult()
    } else if (this.runType === 5) {
      this.sendRecheckResult()
    }
  }

  /** 计算存储ab值，发送校准结果到页面 */
  async sendCalRunResult() {
    const { channelIds, pointIndex } = this.getPointNow()
    if (pointIndex > 0 && this.isRun) {
      const point1Index = pointIndex - 1
      const {
        masterId,
        slaverId,
        calType,
        calTypeName,
        pointerList,
        unit
      } = this.typeNow
      const point1Name = `${pointerList[point1Index]} ${unit}`
      const point2Name = `${pointerList[pointIndex]} ${unit}`

      const list = channelIds.map(channelId => {
        const point1 = this.getPointResult(channelId, point1Index)
        const point2 = this.getPointResult(channelId, pointIndex)

        const { a, b } = this.boxCal.computedCalAB(
          point1.samp,
          point1.actual,
          point2.samp,
          point2.actual
        )
        this.abResultList.push({
          a,
          b,
          pointIndex,
          channelId,
          calType
        })
        return {
          masterId,
          slaverId,
          channelId,
          pointIndex,
          calType,
          calTypeName,
          point1Name,
          point1Result: point1,
          point2Name,
          point2Result: point2,
          a,
          b,
          time: dayjs().format(TIME_FORMAT)
        }
      })
      this.boxCal.sendCalResult('calRunResult', list)
    }
  }

  /** 发送复检结果到页面 */
  async sendRecheckResult() {
    if (!this.isRun) return
    const { channelIds, pointIndex } = this.getPointNow()
    const { pointerList, calTypeName, calType, unit } = this.typeNow
    const base = {
      pointName: `${pointerList[pointIndex]} ${unit}`,
      calTypeName,
      calType,
      masterId: this.masterId,
      slaverId: this.slaverId,
      time: dayjs().format(TIME_FORMAT)
    }
    const list = channelIds.map(channelId => {
      const { samp, actual } = this.getPointResult(channelId, pointIndex)
      const diff = Math.abs(NP.minus(samp, actual))
      return {
        ...base,
        channelId,
        samp,
        actual,
        diff,
        status: diff <= this.standard
      }
    })
    this.boxCal.sendCalResult('calRecheckResult', list)
  }

  /** 发送ab列表 */
  async sendAbList() {
    if (this.runType !== 1) return
    try {
      await this.boxCal.setCal({
        type: 2,
        masterId: this.masterId,
        slaverId: this.slaverId,
        channelIds: this.channelIds,
        abList: this.abResultList
      })
    } catch (err) {
      const msg = '发送ab列表失败'
      logger.error(msg, err)
      throw new Error(`${msg} ${err.message}`)
    }
  }

  /** 发送关闭校准 */
  async closeCal() {
    try {
      await this.boxCal.setCal({
        type: 6,
        masterId: this.masterId,
        slaverId: this.slaverId,
        channelIds: this.channelIds
      })
    } catch (err) {
      logger.error('关闭校准错误', err)
      this.boxCal.sendCalResult('error', `通道关闭校准失败 ${err.message}`)
    }
  }
}
