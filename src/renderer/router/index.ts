import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Main from '@/renderer/layout/Main/index.vue'
import Default from '@/renderer/layout/Default.vue'

Vue.use(VueRouter)

const HomeRouter: RouteConfig[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/renderer/views/Home/index.vue'),
    meta: {
      title: '机柜信息'
    }
  },
  {
    path: '/calibrate',
    name: 'calibrate',
    component: () => import('@/renderer/views/Calibrate/index.vue'),
    meta: {
      title: '通道校准'
    }
  },
  {
    path: '/upgrade',
    name: 'upgrade',
    component: () => import('@/renderer/views/Upgrade/index.vue'),
    meta: {
      title: '设备升级'
    }
  },
  {
    path: '/errorLog',
    name: 'errorLog',
    component: () => import('@/renderer/views/ErrorLog/index.vue'),
    meta: {
      title: '错误日志'
    }
  },
  {
    path: '/setting',
    name: 'setting',
    component: () => import('@/renderer/views/Setting/index.vue'),
    meta: {
      title: '设置',
      icon: 'setting'
    }
  }
]

const routes: Array<RouteConfig> = [
  {
    path: '/',
    component: Main,
    children: HomeRouter
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
        component: () => import('@/renderer/views/History/History.vue'),
        meta: {
          title: '查看历史'
        }
      },
      {
        path: '/nowChannel/:masterId/:slaverId/:channelId',
        name: 'nowChannel',
        component: () => import('@/renderer/views/History/channelCur.vue'),
        meta: {
          title: '查看通道'
        }
      },
      {
        path: '/sorting',
        name: 'Sorting',
        component: () => import('@/renderer/views/Sorting/index.vue'),
        meta: {
          title: '容量分选'
        }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

const getRouteTitle = (pageTitle: string) => {
  return `${pageTitle} - upper-computer`
}

router.beforeEach(async (to, from, next) => {
  document.title = getRouteTitle(to.meta.title || '')
  next()
})

export default router
export { HomeRouter }
