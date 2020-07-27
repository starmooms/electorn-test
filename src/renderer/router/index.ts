import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/portItem/:path',
    name: 'About',
    component: About
  },
  {
    path: '*',
    name: '',
    component: About
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router
