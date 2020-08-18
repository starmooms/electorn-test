import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Main from '@/renderer/layout/Main/index.vue'
import Default from '@/renderer/layout/Default.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Main',
    component: Main,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/renderer/views/Home/index.vue')
      },
      {
        path: '/protList',
        name: 'portList',
        component: () => import('@/renderer/views/PortList/index.vue')
      }
    ]
  },
  {
    path: '/',
    name: 'Default',
    component: Default,
    children: [
      {
        path: '/port/WorkerSee/:path/:slaverId/:channelId',
        name: 'WorkerSee',
        component: () => import('@/renderer/views/WorkerSee.vue')
      },
      {
        path: '/port/SlaverTrend/:path/:masterId/:slaverId',
        name: 'SlaverTrend',
        component: () => import('@/renderer/views/SlaverTrend.vue')
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router
