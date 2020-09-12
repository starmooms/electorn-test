import { setChannelStatus as changelStatus, getWorkStep } from '../ipc/channel'
import Vue from 'vue'
import { stepListSimple } from './util'

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

export default async function setChannelStatus(
  params: SetStatus,
  isSingle = false
) {
  const set = async (startId?: number) => {
    const data = await changelStatus({
      ...params,
      startId
    })
    if (data.status) {
      Vue.prototype.$message.success(`成功`)
    }
  }

  if (params.status === 'start') {
    if (isSingle) {
      const channelId = params.channelId
      const masterId = params.masterId
      const slaverId = params.slaverId
      if (masterId !== void 0 && slaverId !== void 0 && channelId !== void 0) {
        const data = await getWorkStep({
          path: params.path,
          masterId,
          slaverId,
          channelId: [channelId]
        })
        if (!data.status) return
        const stepData = data.data.stepData[channelId]
        const { stepList } = stepListSimple(stepData)
        if (stepList.length <= 0) {
          Vue.prototype.$message.error(
            `${masterId + 1}-${slaverId + 1}-${channelId + 1}工步不存在`
          )
          return
        }

        const h = new Vue({
          data: {
            value: null
          },
          render(h) {
            const self = this
            return h(
              'el-select',
              {
                // domProps: {
                //   value: self.value
                // },
                props: {
                  value: self.value
                },
                on: {
                  input(val) {
                    console.log(this)
                    self.value = val
                  }
                }
              },
              [
                stepList.map((item, index) => {
                  return h('el-option', {
                    key: index,
                    props: {
                      label: item.msg,
                      value: item.id
                    },
                    on: {
                      change(a) {
                        console.log(a)
                      }
                    }
                  })
                })
              ]
            )
          }
        })

        // document.body.appendChild(h.$mount().$el)
        console.log(h.$mount()._vnode)
        const prompt = await Vue.prototype
          .$msgbox({
            title: '',
            message: h.$mount()._vnode
          })
          .catch(err => {
            return {
              action: err
            }
          })
        if (prompt.action === 'confirm') {
          return set(Number(prompt.value))
        }

        // console.log(h.$mount())
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
      }
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
  } else {
    return set()
  }
}
