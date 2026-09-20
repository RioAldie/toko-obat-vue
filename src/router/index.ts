import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/index.vue')
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/pages/dashboard/index.vue')
        },
        {
          path: 'brands',
          name: 'brands',
          component: () => import('@/pages/brands/index.vue')
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/pages/categories/index.vue')
        },
        {
          path: 'units',
          name: 'units',
          component: () => import('@/pages/units/index.vue')
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/pages/products/index.vue')
        },
        {
          path: 'sales',
          name: 'sales',
          component: () => import('@/pages/sales/index.vue')
        },
        {
          path: 'stock-movements',
          name: 'stock-movements',
          component: () => import('@/pages/stock-movements/index.vue')
        },
        {
          path: 'reports/sales',
          name: 'reports-sales',
          component: () => import('@/pages/reports/sales/index.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/pages/users/index.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/settings/index.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' });
  } else if (to.name === 'login' && token) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router
