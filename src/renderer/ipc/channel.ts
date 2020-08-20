import $command from '@/renderer/command'

interface SetStatus {
  path: string
  slaverId: number
  channelId: number
  status: string
}

interface SetSteps {
  path: string
  slaverId: number
  channelId: number
  list: any[]
}

interface ChannelListOpts {
  type?: string
  path: string
  masterId: number
  slaverId?: number
  channelId?: number
}

interface ReadSteps {
  path: string
  masterId: number
  slaverId: number
  channelId: number
}

export function setChannelStatus(data: SetStatus) {
  return $command.invoke('/port/slaver/setStatus', data)
}

/** 写工步 */
export function setSteps(data: SetSteps) {
  return $command.invoke('/port/writeWorkSteps', data)
}

/** 读工步 */
export function getWorkStep(data: ReadSteps) {
  return $command.invoke('/port/readWorkSteps', data)
}

/** 开启/关闭 采样 */
export function translateSet(data: any) {
  return $command.invoke(`/port/translateSet`, data)
}

/** 设置校准 */
export function setCal(data: any) {
  return $command.invoke(`/port/cal/set`, data)
}

/** 设置校准 */
export function readCal(data: any) {
  return $command.invoke(`/port/cal/read`, data)
}

export function getChannelList(data: ChannelListOpts) {
  return $command.invoke(`/port/channelList`, data)
}


// export default class Ipc {

//   install(vue: typeof Vue) {
//     vue.prototype.$ipc = this
//   }
// }
