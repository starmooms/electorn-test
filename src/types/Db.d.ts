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
}
