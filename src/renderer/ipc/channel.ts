import $command from '@/renderer/command'
import Vue from 'vue'

interface SetStatus {
  path: string
  slaverId?: number[]
  channelId?: number[]
  masterId?: number
  masterIdList?: number[]
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
  masterId: number
  slaverId?: number
  channelId?: number
}

interface ReadSteps {
  path: string
  masterId: number
  slaverId: number
  channelId: number[]
}

export function setChannelStatus(data: SetStatus) {
  return $command.invoke('/port/slaver/setStatus', data)
}

export async function changeStatus(params: SetStatus) {
  const set = async (startId?: number) => {
    const data = await setChannelStatus({
      ...params,
      startId
    })
    if (data.status) {
      Vue.prototype.$message.success(`成功`)
    }
  }
  if (params.status === 'start') {
    const data = await Vue.prototype
      .$prompt('请输入起始工步', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\d+/,
        inputErrorMessage: '工步id格式不正确'
      })
      .catch(err => {
        return {
          action: err
        }
      })
    if (data.action === 'confirm') {
      return set(Number(data.value))
    }
  } else {
    return set()
  }
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
