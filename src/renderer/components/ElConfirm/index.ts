import Vue from 'vue'
import { MessageBox } from 'element-ui'

declare module 'element-ui/types/message-box' {
  interface ElMessageBoxOptions {
    /** 反转提示框 确定和取消 */
    userReversal?: boolean
  }
}

export declare type confrim = Parameters<typeof MessageBox.confirm>

export default {
  install() {
    Vue.prototype.$elConfirm = async (...args: confrim) => {
      const opts = args[1]
      let reversal = false
      if (opts && opts.userReversal) {
        reversal = true
        args[1] = {
          confirmButtonText: '取消',
          cancelButtonText: '确定',
          distinguishCancelAndClose: true,
          ...opts
        }
      }
      return MessageBox.confirm(...args)
        .then(() => {
          if (reversal) return false
          return true
        })
        .catch(err => {
          if (typeof err !== 'string') console.error(err)
          if (reversal && err === 'cancel') return true
          return false
        })
    }
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $elConfirm: (...args: confrim) => Promise<boolean>
  }
}
