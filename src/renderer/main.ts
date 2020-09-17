import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './utils/class-component-hooks'
import Element from 'element-ui'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import '@/renderer/style/index.scss'

import command from '@/renderer/command'
import ElConfirm from '@/renderer/components/ElConfirm'
import TitleBox from '@/renderer/components/TitleBox.vue'
import '@/renderer/icons'
import { SettingStatus } from './store/modules/Setting'

const init = () => {
  Vue.config.productionTip = false
  Vue.use(Element, {
    size: 'mini'
  })

  Vue.use(command)
  Vue.component('title-box', TitleBox)
  Vue.use(ElConfirm)

  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
}

SettingStatus.getUserConfg()
  .then(data => {
    if (!data.status) throw data.err || 'DATA STATUS ERROR'
    init()
  })
  .catch(err => {
    alert(err)
  })
