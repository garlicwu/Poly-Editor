import {createRouter, createWebHistory} from 'vue-router'

const routes: Readonly<any[]> = [
  {
    path: '/',
    name: 'editor',
    meta: {
      title: '编辑器',
    },
    component: () => import('../view/editor/editor-main-page.vue'),
  },
  {
    path: '/svgEditor',
    name: 'svgEditor',
    meta: {
      title: 'SVG编辑器',
    },
    component: () => import('../view/editor/component/svg/svg-editor.vue'),
  },
]

const routerIndex = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default routerIndex
