import $command from '@/renderer/command'

export function setChannelStatus(data: ipcReq.ChannelSetStatus) {
  return $command.invoke('/port/slaver/setStatus', data)
}

/** 写工步 */
export function setSteps(data: ipcReq.WriteSteps) {
  return $command.invoke('/port/writeWorkSteps', data)
}

/** 读工步 */
export function getWorkStep(data: ipcReq.ReadSteps) {
  return $command.invoke<Port.StepsData>('/port/readWorkSteps', data)
}

/** 开启/关闭 采样 */
export function sampSetReadStatus(data: ipcReq.SampReadStatus) {
  return $command.invoke(`/port/sampSetReadStatus`, data)
}

/** 设置校准 */
export function setCal(data: ipcReq.CalWriteOpts) {
  return $command.invoke(`/port/cal/set`, data)
}

/** 读校准 */
export function readCal(data: ipcReq.CalOpts) {
  return $command.invoke(`/port/cal/read`, data)
}

/** 设置点灯 */
export function lampSet(data: ipcReq.LampSetOpts) {
  return $command.invoke(`/port/lamp/set`, data)
}

/** 获取ip列表 */
export function getIpList() {
  return $command.invoke(`/port/masterInfo/ipList`)
}

/** 刷新链接返回ip列表 */
export function refreshIpConnect() {
  return $command.invoke(`/port/masterInfo/refreshConnect`)
}

/** 编辑机柜信息 */
export function setMasterInfo(data: ipcReq.MasterInfoSetOpts) {
  return $command.invoke(`/port/masterInfo/set`, data)
}

/** 删除某项ip */
export function delIpItem(data: ipcReq.MasterInfoDelIp) {
  return $command.invoke(`/port/masterInfo/delIp`, data)
}

/** 开始校准 */
export function calStart(data: ipcReq.CalStart) {
  return $command.invoke(`/port/cal/start`, data)
}

/** 停止校准 */
export function calStop() {
  return $command.invoke(`/port/cal/stop`)
}

/** 离开页面校准页面 */
export function calLeave() {
  return $command.invoke(`/port/cal/leave`)
}

/** 复检开始 */
export function recheck(data: ipcReq.CalRecheck) {
  return $command.invoke(`/port/cal/recheck`, data)
}

/** 读工装校准 */
export function calToolRead(data: ipcReq.CalToolReadSamp) {
  return $command.invoke(`/port/cal/calToolRead`, data)
}

/** 设置工装校准 */
export function calToolSet(data: ipcReq.CalToolSet) {
  return $command.invoke(`/port/cal/calToolSet`, data)
}

/** 检查工装ip */
export function calCheckToolIp(ip: string) {
  return $command.invoke(`/port/cal/connectToolIp`, ip)
}

/** 设置工装校准 */
export function upgradeStart(data: ipcReq.UpgradeForm) {
  return $command.invoke(`/port/upgrade/start`, data)
}

export function getChannelList() {
  return $command.invoke(`/port/channelList`)
}

// export default class Ipc {

//   install(vue: typeof Vue) {
//     vue.prototype.$ipc = this
//   }
// }
