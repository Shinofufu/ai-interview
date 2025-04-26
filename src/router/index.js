import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'resume',
    component: () => import('../views/ResumeView.vue')
  },
  {
    path: '/interview',
    name: 'interview',
    component: () => import('../views/InterviewView.vue')
  },
  {
    path: '/coding',
    name: 'coding',
    component: () => import('../views/CodingView.vue')
  },
  {
    path: '/summary',
    name: 'summary',
    component: () => import('../views/SummaryView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 