/** 数据库相关 */
declare namespace Db {
  type SaveSampList = Port.SaveSampItem
  type sampList = SaveSampList['sampList']
  type startList = SaveSampList['startList']
  type endList = SaveSampList['endList']
  type featureList = SaveSampList['featureList']
  type changeStatusList = SaveSampList['changeStatusList']
  // interface SaveSampList {
  //   projectId: number
  //   sampList: sampList
  //   changeStatusList: changeStatusList
  // }

  interface ListQuery {
    page: number
    limit: number
  }

  interface PageUtilParams extends ListQuery {
    tableName: string
    where?: string
    order?: string
  }

  interface ListData<T = any> {
    limit: number
    page: number
    total: number
    list: any[]
  }

  interface ErrorItem extends Port.ErrorListItem {
    id: number
  }

  interface RErrorItem extends ErrorItem {
    typeStr: string
    errCodeStr: string
  }

  /** 主数据库获取历史列表 */
  interface GetHistoryParams extends ListQuery {
    fileId: string
    startTime: number
    endTime: number
  }
  /** 工步解析后 */
  interface StepList {
    id: number
    type: string
    name: string
    input: {
      [key: string]: number
    }
  }

  /** 渲染端使用历史文件列表 */
  interface RHistoryItem {
    id: number
    masterIds: string
    slaverIds: string
    channelIds: string
    fileId: string
    filePath: string
    startTime: string
    endTime: string
    // 格式化id
    masterIdArr: number[]
    masterIdShowStr: string
    slaverIdArr: number[]
    slaverIdShowStr: string
    channelIdArr: number[]
    channelIdShowStr: string
  }

  /** 获取容量分选参数 */
  interface GetStoring {
    stepId: number
    loopNum: number
    levelList: Store.LevelItem[]
    levelAttr: string[]
  }

  interface LevelChResult {
    masterId: number
    slaverId: number
    channelId: number
    fullId: string
  }

  interface StoringResult {
    [key: string]: {
      id: number
      desc: string
      levelResult: LevelChResult[]
    }
  }

  /** 分容返回 */
  interface StoringData {
    list: any[]
    sortingResult: StoringResult
  }

  /** 分容统计表校验 */
  interface StaticItem {
    start: null | {
      U: number
      I: number
    }
    end: null | {}
    avgU: null | number
  }

}
