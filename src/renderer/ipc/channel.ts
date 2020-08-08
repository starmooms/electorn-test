import $command from '@/renderer/command'

interface SetStatus {
  path: string
  slaverId: number
  channel: number
  status: string
}

export function setChannelStatus(data: SetStatus) {
  $command.send('/port/slaver/setStatus', data)
}

// export default class Ipc {

//   install(vue: typeof Vue) {
//     vue.prototype.$ipc = this
//   }
// }
