import HistoryDbCom from '@/shared/sqlite/HistoryDbCom'
import path from 'path'
import { getFullIdData, getStaticInsert } from '@/shared/sqlite/sqlUtil'
import { resolve } from 'bluebird'

export default class HistoryDb extends HistoryDbCom {
  constructor(filePath: string) {
    super(path.resolve(filePath))
  }

  /** 获取采样内容 */
  async getSampData(params) {
    const { sampData } = this.tables
    const data = await this.sqlite.all(
      `SELECT * FROM ${sampData} WHERE masterId=$masterId and slaverId=$slaverId and channelId=$channelId ORDER BY loopNum, stepId ASC;`,
      params
    )
    return data
  }

  /** 获取通道列表 */
  async getChannelList() {
    const { channelInfo } = this.tables
    return this.sqlite.all(`SELECT * FROM ${channelInfo};`)
  }

  /** 获取工步信息 */
  async getWorkStep() {
    const { stepsInfo } = this.tables
    return this.sqlite.get<Db.StartInfo>(`SELECT * FROM ${stepsInfo} LIMIT 1;`)
  }

  /** 整理统计表 */
  async checkStatic({
    loopNum,
    stepId
  }: Pick<Db.GetStoring, 'loopNum' | 'stepId'>) {
    const { stepStatistics, sampData } = this.tables
    const staticMap = new Map<string, Db.StaticItem>()
    const getMap = (row: any) => {
      const fullId = `${row.masterId}_${row.slaverId}_${row.channelId}`
      let staticItem = staticMap.get(fullId)
      if (!staticItem) {
        staticItem = {
          start: null,
          end: null,
          avgU: null
        }
        staticMap.set(fullId, staticItem)
      }
      return staticItem
    }

    console.time()
    await Promise.all([
      this.sqlite.each(
        `SELECT masterId, slaverId, channelId, U, workCode FROM ${sampData} WHERE id IN (
        SELECT MIN(id) id FROM ${sampData} WHERE loopNum=${loopNum} AND stepId=${stepId} GROUP BY masterId, slaverId, channelId
      );`,
        row => {
          const item = getMap(row)
          item.start = row
        }
      ),
      this.sqlite.each(
        `SELECT masterId, slaverId, channelId, U, I, epower, vol, stepTime, endCode FROM ${sampData} WHERE id IN (
        SELECT MAX(id) id FROM ${sampData} WHERE loopNum=${loopNum} AND stepId=${stepId} GROUP BY masterId, slaverId, channelId
      );`,
        row => {
          const item = getMap(row)
          item.end = row
        }
      ),
      this.sqlite.each(
        `SELECT masterId, slaverId, channelId, ROUND(AVG(U),2) FROM ${sampData} WHERE loopNum=${loopNum} AND stepId=${stepId} GROUP BY masterId, slaverId, channelId`,
        row => {
          const item = getMap(row)
          item.avgU = row['ROUND(AVG(U),2)']
        }
      )
    ])
    console.timeEnd()

    const getUpdateSql = getStaticInsert(stepStatistics)
    staticMap.forEach(staticItem => {
      const { start, end, avgU } = staticItem
      if (start && end && avgU != null) {
        getUpdateSql.insert({
          ...getFullIdData(start),
          loopNum,
          stepId,
          workCode: `'${start.workCode}'`,
          startU: start.U,
          endU: end.U,
          endI: end.I,
          vol: end.vol,
          epower: end.epower,
          endCode: `'${end.endCode}'`,
          stepTime: end.stepTime,
          avgU: avgU
        })
        // sql += `INSERT INTO ${stepStatistics} ${updateSql};`
      }
    })
    const sql = getUpdateSql.getSql()
    if (sql) {
      await this.sqlite.exec(sql)
    }
    return
  }

  /** 获取分选信息 */
  async getSorting({ stepId, loopNum, levelList, levelAttr }: Db.GetStoring) {
    const { stepStatistics } = this.tables
    const stepSql = `stepId=${stepId} AND loopNum=${loopNum}`
    const result: Db.StoringData = {
      list: [],
      sortingResult: {}
    }
    await this.checkStatic({
      loopNum,
      stepId
    })
    const levelSearch = levelList.map(async level => {
      // 遍历等级
      let levelSql = ''
      levelAttr.forEach(attr => {
        // 遍历属性值
        let attrSql = ''
        const min = level[`${attr}_min`]
        const max = level[`${attr}_max`]
        if (min != null) {
          attrSql += `${attr}>=${min}`
        }
        if (max != null) {
          if (attrSql) {
            attrSql += ` AND `
          }
          attrSql += `${attr}<${max}`
        }
        if (attrSql) {
          levelSql += ` AND ${attrSql}`
        }
      })

      let levelResult: Db.LevelChResult[] = []

      if (levelSql) {
        levelResult = await this.sqlite.all(
          `SELECT masterId,slaverId,channelId,fullId FROM ${stepStatistics} WHERE ${stepSql}${levelSql};`
        )
      }
      result.sortingResult[level.id] = {
        id: level.id,
        desc: level.desc,
        levelResult
      }
      return
    })
    await Promise.all([
      this.sqlite
        .all(
          `SELECT * FROM ${stepStatistics} WHERE ${stepSql} ORDER BY masterId,slaverId,channelId;`
        )
        .then(list => {
          result.list = list
        }),
      ...levelSearch
    ])

    return result
  }
}
