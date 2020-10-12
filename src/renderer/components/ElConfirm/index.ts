import Vue from 'vue'
import { MessageBox } from 'element-ui'

export declare type confrim = Parameters<typeof MessageBox.confirm>

export default {
  install() {
    Vue.prototype.$elConfirm = async (...args: confrim) => {
      return MessageBox.confirm(...args)
        .then(data => {
          return true
        })
        .catch(err => {
          if (err !== 'cancel') {
            console.error(err)
          }
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
