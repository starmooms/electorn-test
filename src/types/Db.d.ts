/** 数据库相关 */
declare namespace Db {
  type sampList = Port.SampItem[]
  interface SaveSampList {
    projectId: number
    sampList: sampList
  }
}
