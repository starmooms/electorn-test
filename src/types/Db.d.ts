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

  interface GetHistoryParams extends ListQuery {
    fileId: string
    startTime: number
    endTime: number
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
  }

  interface StepList {
    id: number
    type: string
    name: string
    input: {
      [key: string]: number
    }
  }
}
