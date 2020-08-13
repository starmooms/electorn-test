import $command from '@/renderer/command'

interface SetStatus {
  path: string
  slaverId: number
  channel: number
  status: string
}

interface SetSteps {
  path: string
  slaverId: number
  channel: number
  list: any[]
}

export function setChannelStatus(data: SetStatus) {
  $command.invoke('/port/slaver/setStatus', data)
}

/** 写工步 */
export function setSteps(data: SetSteps) {
  return $command.invoke('/port/writeWorkSteps', data)
}

/** 读工步 */
export function getWorkStep(name: string) {
  return $command.invoke(name)
}

// export default class Ipc {

//   install(vue: typeof Vue) {
//     vue.prototype.$ipc = this
//   }
// }
