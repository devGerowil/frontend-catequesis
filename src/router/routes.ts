import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'inicio',
        component: () => import('@/pages/IndexPage.vue'),
        meta: { titulo: 'Temas' },
      },
      {
        path: 'tema/:id',
        name: 'tema',
        component: () => import('@/pages/TemaPage.vue'),
        meta: { titulo: 'Tema' },
      },
      {
        path: 'entrar',
        name: 'entrar',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { titulo: 'Entrar', layoutDesnudo: true },
      },
      {
        path: 'sin-acceso',
        name: 'sin-acceso',
        component: () => import('@/pages/SinAccesoPage.vue'),
        meta: { titulo: 'Acceso restringido' },
      },
    ],
  },

  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiereCatequista: true },
    children: [
      {
        path: '',
        name: 'admin',
        component: () => import('@/pages/admin/AdminHomePage.vue'),
        meta: { requiereCatequista: true, titulo: 'Panel' },
      },
      {
        path: 'temas/nuevo',
        name: 'tema-nuevo',
        component: () => import('@/pages/admin/TemaEditPage.vue'),
        meta: { requiereCatequista: true, titulo: 'Nuevo tema' },
      },
      {
        path: 'temas/:id',
        name: 'tema-editar',
        component: () => import('@/pages/admin/TemaEditPage.vue'),
        meta: { requiereCatequista: true, titulo: 'Editar tema' },
      },
      {
        path: 'catequistas',
        name: 'catequistas',
        component: () => import('@/pages/admin/CatequistasPage.vue'),
        meta: { requiereCatequista: true, requierePrincipal: true, titulo: 'Catequistas' },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];
