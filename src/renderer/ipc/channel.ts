import $command from '@/renderer/command'
import Vue from 'vue'
import { SettingStatus } from '../store/modules/Setting'
import { stepListSimple } from '@/renderer/utils/util'
import { kMaxLength } from 'buffer'

interface SetStatus {
  path: string
  masterId?: number
  masterIdList?: number[]
  slaverId?: number
  slaverIdList?: number[]
  channelId?: number
  channelIdList?: number[]
  startId?: number
  status: string
}

interface SetSteps {
  path: string
  masterId: number
  slaverId: number[]
  channelId: number[]
  list: any[]
  protect: any
}

interface ChannelListOpts {
  type?: string
  path: string
  masterId?: number
  slaverId?: number
  channelId?: number
}

interface ReadSteps {
  path?: string
  masterId: number
  slaverId: number
  channelId: number[]
}

// interface StepInputItem {
//   data: number
//   unit: string
//   name: string
// }

// interface StepsData {
//   stepData: {
//     [key: string]: {
//       protect: {
//         UCi: number
//         ICi: number
//         IDisCi: number
//         UMax: number
//         UMin: number
//         TimeMin: number
//         warnVal: number
//       }
//       stepList: {
//         id: number
//         type: string
//         name: string
//         worker: StepInputItem[]
//         limt: StepInputItem[]
//       }[]
//     }
//   }
// }

export function setChannelStatus(data: SetStatus) {
  return $command.invoke('/port/slaver/setStatus', data)
}

/** 自动检测portPath */
export function portPathRequest<T = any>(path: string, data: any) {
  if (!data.path) {
    const path = SettingStatus.portPath
    if (!path) {
      const msg = '请先设置串口'
      $command.errorMsg('请先设置串口')
      return {
        status: false,
        err: msg
      } as ipcReq.ResponseError
    }
    data = {
      path,
      ...data
    }
  }
  return $command.invoke<T>('/port/readWorkSteps', data)
}

/** 写工步 */
export function setSteps(data: SetSteps) {
  return $command.invoke('/port/writeWorkSteps', data)
}

/** 读工步 */
export function getWorkStep(data: ReadSteps) {
  return portPathRequest<Port.StepsData>('/port/readWorkSteps', data)
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
