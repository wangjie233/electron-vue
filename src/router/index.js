import { createRouter, createWebHistory ,createWebHashHistory } from "vue-router";
const routes = [
  {
    path: "/",
    name: "index",
    component: () => import("@/pages/index.vue"),
    redirect:"home",
    children:[
      {
        path:'/home',
        name: "home",
        component: () => import("@/pages/home/index.vue"),
      },
      {
        path:'/audioContext',
        name: "audioContext",
        component: () => import("@/pages/audioContext/index.vue"),
      }
    ]
  },
  {
    path: '/:catchAll(.*)',
    name: "404",
    component: () => import("@/pages/404.vue"),
  }
];
export default createRouter({
  // history: createWebHistory('/dist/'),
  history: createWebHashHistory(),
  routes,
});