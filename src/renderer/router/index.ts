import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Main from '@/renderer/layout/Main/index.vue'
import Default from '@/renderer/layout/Default.vue'
import { SettingStatus } from '../store/modules/Setting'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    component: Main,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/renderer/views/Home/index.vue')
      },
      {
        path: '/setting',
        name: 'setting',
        component: () => import('@/renderer/views/Setting/index.vue')
      },
      {
        path: '/errorLog',
        name: 'errorLog',
        component: () => import('@/renderer/views/ErrorLog/index.vue')
      }
    ]
  },
  {
    path: '/',
    name: 'Default',
    component: Default,
    children: [
      // {
      //   path: '/port/WorkerSee/:path/:masterId/:slaverId/:channelId',
      //   name: 'WorkerSee',
      //   component: () => import('@/renderer/views/WorkerSee/index.vue')
      // },
      // {
      //   path: '/port/SlaverTrend/:path/:masterId/:slaverId',
      //   name: 'SlaverTrend',
      //   component: () => import('@/renderer/views/SlaverTrend.vue')
      // },
      {
        path: '/history/:filePath',
        name: 'History',
        props: {
          isHistory: true
        },
        component: () => import('@/renderer/views/History/index.vue')
      },
      {
        path: '/nowChannel/:masterId/:slaverId/:channelId',
        name: 'nowChannel',
        props: {
          isHistory: false
        },
        component: () => import('@/renderer/views/History/index.vue')
      },
      {
        path: '/sorting',
        name: 'Sorting',
        component: () => import('@/renderer/views/Sorting/index.vue')
      },
      {
        path: '/calibrate',
        name: 'Calibrate',
        meta: {
          titleBar: true
        },
        component: () => import('@/renderer/views/Calibrate/index.vue')
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

router.beforeEach(async (to, from, next) => {
  // console.log(to, from, next)
  // if (to.meta.titleBar) {
  //   SettingStatus.UPDATE_TITLEBAR(true)
  // }
  next()
})

export default router
