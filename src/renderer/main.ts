import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './utils/class-component-hooks'
import '@/renderer/components/ElementUI'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import '@/renderer/components/vxeTabel'

import '@/renderer/style/index.scss'

import command from '@/renderer/command'
import ElConfirm from '@/renderer/components/ElConfirm'
import TitleBox from '@/renderer/components/TitleBox.vue'
import '@/renderer/icons'
import { SettingStatus } from './store/modules/Setting'
import { beforeRender } from './ipc/storeConfig'
import '@/renderer/utils/BeforClose'
import { ChannelStatus } from './store/modules/Channel'

const init = () => {
  Vue.config.productionTip = false

  Vue.use(command)
  Vue.component('title-box', TitleBox)
  Vue.use(ElConfirm)

  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
}

beforeRender()
  .then(result => {
    if (!result.status) throw result.err || 'DATA STATUS ERROR'
    const data = result.data
    SettingStatus.UPDATE_USERCONFIG(data.userConfig)
    SettingStatus.UPDATE_MAINDBPATH(data.mainData)
    ChannelStatus.SET_MASTERCONNECT(data.connectMasterList)
    init()
  })
  .catch(err => {
    alert(err)
  })

// SettingStatus.getUserConfg()
//   .then(data => {
//     if (!data.status) throw data.err || 'DATA STATUS ERROR'
//     init()
//   })
//   .catch(err => {
//     alert(err)
//   })
