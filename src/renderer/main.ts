import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Element from 'element-ui'

import '@/renderer/style/index.scss'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(Element, {
  size: 'mini'
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
