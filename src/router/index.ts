import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import { routes } from './routes';
import { useAuthStore } from '@/stores/auth';

declare module 'vue-router' {
  interface RouteMeta {
    titulo?: string;
    requiereCatequista?: boolean;
    requierePrincipal?: boolean;
    layoutDesnudo?: boolean;
  }
}

export default defineRouter(({ store }) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: (to, from, posicionGuardada) => posicionGuardada ?? { left: 0, top: 0 },
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    const auth = useAuthStore(store);

    // La sesión se lee de localStorage: hay que tenerla resuelta antes de
    // decidir si la ruta es accesible.
    if (auth.cargando) await auth.iniciar();

    if (to.meta.requiereCatequista && !auth.esCatequista) {
      if (!auth.autenticado) {
        return { name: 'entrar', query: { destino: to.fullPath } };
      }
      return { name: 'sin-acceso' };
    }

    if (to.meta.requierePrincipal && !auth.esPrincipal) {
      return { name: 'sin-acceso' };
    }

    return true;
  });

  Router.afterEach((to) => {
    const titulo = to.meta.titulo;
    if (typeof document !== 'undefined') {
      document.title = titulo ? `${titulo} · Confirmación 2026` : 'Confirmación 2026';
    }
  });

  return Router;
});
