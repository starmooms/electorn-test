/** 分容相关 */
declare namespace SortingT {
  /** 分容等级统计 */
  interface LevelResult {
    id: number
    desc: string
    num: number
    total: number
    percent: string
  }

  /** 分容机柜按统计 */
  interface BoxResult {
    masterId: number
    masterName: string
    num: number
    total: number
    percent: string
  }

  /** 分容结果亮灯通道 */
  interface BoxLampResult {
    [masterId: string]: {
      [slaverId: string]: number[]
    }
  }

  interface LevelEmitResult {
    list: Db.StoringData['list']
    levelResultList: LevelResult[]
    boxResultList: BoxResult[]
    boxLampResult: BoxLampResult
  }
}
