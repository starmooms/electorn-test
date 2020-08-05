import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Element from 'element-ui'

import '@/renderer/style/index.scss'
import 'element-ui/lib/theme-chalk/index.css'

import command from '@/renderer/command'
import '@/renderer/icons'

Vue.config.productionTip = false

Vue.use(Element, {
  size: 'mini'
})

Vue.use(command)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
