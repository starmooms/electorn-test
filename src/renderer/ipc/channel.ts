import $command from '@/renderer/command'
import Vue from 'vue'
import { SettingStatus } from '../store/modules/Setting'
import { stepListSimple } from '@/renderer/utils/util'
import { kMaxLength } from 'buffer'

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

export async function changeStatus(
  params: SetStatus,
  isSingle = false,
  vm?: Vue
) {
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
    if (isSingle && vm) {
      // if (!params.slaverId || params.masterId === void 0 || !params.channelId) {
      //   Vue.prototype.$message.error(`缺少参数`)
      //   return
      // }
      // const channelId = params.channelId[0]
      // const masterId = params.masterId
      // const slverId = params.slaverId[0]
      // const data = await getWorkStep({
      //   path: params.path,
      //   masterId: params.masterId,
      //   slaverId: slverId,
      //   channelId: [channelId]
      // })
      // if (!data.status) return
      // const stepData = data.data.stepData[channelId]
      // const { stepList } = stepListSimple(stepData)
      // if (stepList.length <= 0) {
      //   Vue.prototype.$message.error(
      //     `${masterId + 1}-${slverId + 1}-${channelId + 1}工步不存在`
      //   )
      //   return
      // }
      // const c = Vue.component('step-select', {
      //   data() {
      //     return {
      //       value: null
      //     }
      //   },
      //   render(h) {
      //     const self = this as any
      //     return h(
      //       'el-select',
      //       {
      //         domProps: {
      //           value: self.value
      //         },
      //         props: {
      //           value: self.value
      //         },
      //         on: {
      //           input(val) {
      //             console.log(this)
      //             self.value = val
      //           }
      //         }
      //       },
      //       [
      //         stepList.map((item, index) => {
      //           return h('el-option', {
      //             key: index,
      //             props: {
      //               label: item.msg,
      //               value: item.id
      //             },
      //             on: {
      //               change(a) {
      //                 console.log(a)
      //               }
      //             }
      //           })
      //         })
      //       ]
      //     )
      //   },
      //   destroyed() {
      //     console.log('??')
      //   },
      //   mounted() {
      //     console.log('??')
      //   }
      // })
      // const vm = new Vue({
      //   components: {
      //     stepSelect: c
      //   },
      //   render(h) {
      //     return h('step-select')
      //   }
      // })
      // console.log(vm)
      // const h = vm.$createElement
      // // let self = {
      // //   value: 1 as null | number
      // // }
      // // self = Vue.observable(self)
      // const self = Vue.observable({ value: null })
      // await Vue.prototype.$msgbox({
      //   title: '提示',
      //   message: h(
      //     'el-select',
      //     {
      //       // domProps: {
      //       //   value: self.value
      //       // },
      //       props: {
      //         value: self.value
      //       },
      //       on: {
      //         input(val) {
      //           console.log(this)
      //           self.value = val
      //         }
      //       }
      //     },
      //     [
      //       stepList.map((item, index) => {
      //         return h('el-option', {
      //           key: index,
      //           props: {
      //             label: item.msg,
      //             value: item.id
      //           },
      //           on: {
      //             change(a) {
      //               console.log(a)
      //             }
      //           }
      //         })
      //       })
      //     ]
      //   )
      // })
      // const data = await Vue.prototype
      //   .$prompt('请输入起始工步', '提示', {
      //     confirmButtonText: '确定',
      //     cancelButtonText: '取消',
      //     inputPattern: /\d+/,
      //     inputErrorMessage: '工步id格式不正确'
      //   })
      //   .catch(err => {
      //     return {
      //       action: err
      //     }
      //   })
      // if (data.action === 'confirm') {
      //   return set(Number(data.value))
      // }
    }
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

// export default class Ipc {

//   install(vue: typeof Vue) {
//     vue.prototype.$ipc = this
//   }
// }
