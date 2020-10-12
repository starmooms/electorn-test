/** 数据库相关 */
declare namespace Db {
  type SaveSampList = Port.SaveSampItem
  type sampList = SaveSampList['sampList']
  type endStatusList = SaveSampList['endStatusList']
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
}
