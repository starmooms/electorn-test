/** 数据库相关 */
declare namespace Db {
  type sampList = Port.SampItem[]
  type changeStatusList = Port.ChannelChangeItem[]

  interface SaveSampList {
    projectId: number
    sampList: sampList
    changeStatusList: changeStatusList
  }
}
