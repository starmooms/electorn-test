import Vue from 'vue'
import Element from 'element-ui'

// declare type defaultOpts = Parameters<typeof Message>

Vue.use(Element, {
  size: 'mini'
})

// 对message进行全局默认设置
function setMessageGlobal(defaultOpts: any) {
  const origin = Vue.prototype.$message
  const typeKeys = ['success', 'warning', 'info', 'error']
  const getOpts = (opts, otherOpts) => {
    if (typeof opts === 'string') {
      opts = {
        message: opts
      }
    }
    return {
      ...otherOpts,
      ...opts
    }
  }

  const ProxyMessage = new Proxy(origin, {
    get(target, name) {
      if (typeKeys.includes(name as string)) {
        return function(opts) {
          opts = getOpts(opts, {
            type: name
          })
          ProxyMessage(opts)
        }
      }
      return Reflect.get(target, name)
    },
    apply: function(target, thisArg, args) {
      args[0] = getOpts(args[0], defaultOpts)
      return target(...args)
    }
  })
  Vue.prototype.$message = ProxyMessage
}
setMessageGlobal({
  showClose: true
})

// function getNewMessage() {
//   const defaultOpts = {
//     showClose: true
//   }
//   const getOpts = options => {
//     if (typeof options === 'string') {
//       options = {
//         message: options
//       }
//     }
//     return { ...defaultOpts, ...options }
//   }
//   const originMessage = Vue.prototype.$message
//   const newMessage = function(options) {
//     originMessage(getOpts(options))
//   }
//   const typeKey = ['success', 'warning', 'info', 'error']
//   Object.keys(originMessage).forEach(key => {
//     if (typeKey.includes(key)) {
//       newMessage[key] = function(options) {
//         originMessage[key](getOpts(options))
//       }
//     } else {
//       newMessage[key] = originMessage[key]
//     }
//   })
//   return newMessage
// }
// Vue.prototype.$message = getNewMessage()
