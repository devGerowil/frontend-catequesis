<template>
  <q-layout view="hHh lpR fFf" class="app-bg">
    <q-header class="app-header">
      <q-toolbar class="app-container">
        <q-btn flat round dense icon="arrow_back" aria-label="Volver a los temas" to="/">
          <q-tooltip>Volver a los temas</q-tooltip>
        </q-btn>

        <span class="app-header__title">Panel del catequista</span>

        <q-space />

        <q-tabs
          v-model="pestana"
          dense
          no-caps
          narrow-indicator
          active-color="primary"
          indicator-color="primary"
          align="left"
          class="app-tabs"
        >
          <q-tab name="temas" icon="folder_open" label="Temas" to="/admin" />
          <q-tab
            v-if="auth.esPrincipal"
            name="catequistas"
            icon="group"
            label="Catequistas"
            to="/admin/catequistas"
          />
        </q-tabs>

        <q-btn flat round dense icon="logout" aria-label="Salir" @click="salir">
          <q-tooltip>Cerrar sesión</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const pestana = ref(route.path.startsWith('/admin/catequistas') ? 'catequistas' : 'temas');

async function salir() {
  await auth.salir();
  await router.push({ name: 'inicio' });
}
</script>

<style scoped lang="scss">
.app-header {
  background: rgba(251, 249, 247, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid $app-border;
}

.app-header__title {
  font-family: var(--app-font-display);
  font-weight: 600;
  font-size: 1rem;
  margin-left: 6px;
}

.app-tabs {
  margin-right: 8px;
}

@media (max-width: 599px) {
  .app-header__title,
  .app-tabs :deep(.q-tab__label) {
    display: none;
  }
}
</style>
