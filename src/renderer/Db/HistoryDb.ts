import HistoryDbCom from '@/shared/sqlite/HistoryDbCom'
import path from 'path'

export default class HistoryDb extends HistoryDbCom {
  constructor(filePath: string) {
    super(path.resolve(filePath))
  }

  /** 获取采样内容 */
  async getSampData(params) {
    const { sampData } = this.tables
    const data = await this.sqlite.all(
      `SELECT * FROM ${sampData} WHERE masterId=$masterId and slaverId=$slaverId and channelId=$channelId ORDER BY loopNum, stepId ASC`,
      params
    )
    return data
  }

  /** 获取通道列表 */
  async getChannelList() {
    const { channelInfo } = this.tables
    return this.sqlite.all(`SELECT * FROM ${channelInfo}`)
  }

  /** 获取工步信息 */
  async getWorkStep() {
    const { stepsInfo } = this.tables
    return this.sqlite.get(`SELECT * FROM ${stepsInfo} WHERE id=1`)
  }

  /** 获取分选信息 */
  async getSorting({ setpId, loopNum, levelList, levelAttr }: Db.GetStoring) {
    const { stepStatistics } = this.tables
    const setpSql = `stepId=${setpId} AND loopNum=${loopNum}`
    const result: Db.StoringData = {
      list: [],
      sortingResult: {}
    }
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
          `SELECT masterId,slaverId,channelId,fullId FROM ${stepStatistics} WHERE ${setpSql}${levelSql}`
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
        .all(`SELECT * FROM ${stepStatistics} WHERE ${setpSql}`)
        .then(list => {
          result.list = list
        }),
      ...levelSearch
    ])

    return result
  }
}
