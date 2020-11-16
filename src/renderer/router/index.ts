import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Main from '@/renderer/layout/Main/index.vue'
import Default from '@/renderer/layout/Default.vue'

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
      },
      {
        path: '/calibrate',
        name: 'calibrate',
        component: () => import('@/renderer/views/Calibrate/index.vue')
      },
      {
        path: '/upgrade',
        name: 'upgrade',
        component: () => import('@/renderer/views/Upgrade/index.vue')
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
        component: () => import('@/renderer/views/History/History.vue')
      },
      {
        path: '/nowChannel/:masterId/:slaverId/:channelId',
        name: 'nowChannel',
        props: {
          isHistory: false
        },
        component: () => import('@/renderer/views/History/channelCur.vue')
      },
      {
        path: '/sorting',
        name: 'Sorting',
        component: () => import('@/renderer/views/Sorting/index.vue')
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
