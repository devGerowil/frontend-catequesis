<template>
  <q-page>
    <main class="app-container inicio">
      <header class="inicio__cabecera">
        <span class="text-eyebrow">{{ APP_PARROQUIA }}</span>
        <h1 class="text-display inicio__titulo">Temas de catequesis</h1>
        <p class="inicio__intro">
          Todo el material de la Confirmación 2026 en un solo lugar. Entra a cada tema para ver su
          contenido y descargar los archivos.
        </p>
      </header>

      <q-input
        v-if="visible.length > 0"
        v-model="busqueda"
        outlined
        dense
        clearable
        debounce="150"
        placeholder="Buscar un tema…"
        aria-label="Buscar un tema"
        class="inicio__buscador"
      >
        <template #prepend>
          <q-icon name="search" size="20px" color="grey-6" />
        </template>
      </q-input>

      <q-banner v-if="store.error" rounded class="bg-red-1 text-negative app-banner">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ store.error }}
        <template #action>
          <q-btn flat dense label="Reintentar" @click="store.cargar" />
        </template>
      </q-banner>

      <div v-if="store.cargando" class="inicio__cargando">
        <q-spinner-dots size="34px" color="primary" />
        <span>Cargando temas…</span>
      </div>

      <template v-else-if="visible.length > 0">
        <p class="inicio__conteo">
          {{ visible.length }}
          {{ visible.length === 1 ? 'tema disponible' : 'temas disponibles' }}
        </p>

        <transition-group name="app-fade" tag="div" class="inicio__grid">
          <TemaCard
            v-for="(tema, indice) in visible"
            :key="tema.id"
            :tema="tema"
            :numero="indice + 1"
            :total-archivos="tema.total_archivos ?? 0"
            :mostrar-estado="false"
            :destino="{ name: 'tema', params: { id: tema.id } }"
          />
        </transition-group>
      </template>

      <VacioEstado
        v-else-if="busqueda"
        icono="search_off"
        titulo="Ningún tema coincide"
        descripcion="Prueba con otra palabra o revisa la ortografía."
      >
        <q-btn flat color="primary" label="Limpiar búsqueda" @click="busqueda = ''" />
      </VacioEstado>

      <VacioEstado
        v-else
        icono="hourglass_empty"
        titulo="Todavía no hay temas publicados"
        descripcion="En cuanto el catequista publique el primer tema, aparecerá aquí."
      />
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TemaCard from '@/components/TemaCard.vue';
import VacioEstado from '@/components/VacioEstado.vue';
import { APP_PARROQUIA } from '@/config/app';
import { useTemasStore } from '@/stores/temas';
import { normalizar } from '@/utils/formato';

const store = useTemasStore();
const busqueda = ref('');

const visible = computed(() => {
  const texto = normalizar(busqueda.value.trim());
  const publicados = store.cargando ? [] : store.publicados;
  if (!texto) return publicados;

  return publicados.filter((tema) =>
    normalizar(`${tema.titulo} ${tema.descripcion ?? ''}`).includes(texto)
  );
});

onMounted(() => {
  void store.cargar();
});
</script>

<style scoped lang="scss">
.inicio {
  padding-top: 48px;
  padding-bottom: 64px;
}

.inicio__cabecera {
  max-width: 46ch;
  margin-bottom: 28px;
}

.inicio__titulo {
  font-size: clamp(1.9rem, 5vw, 2.6rem);
  margin: 8px 0 10px;
}

.inicio__intro {
  margin: 0;
  color: $app-text-muted;
  font-size: 1rem;
  line-height: 1.65;
}

.inicio__buscador {
  max-width: 420px;
  margin-bottom: 26px;
}

.inicio__conteo {
  margin: 0 0 14px;
  font-size: 0.84rem;
  color: $app-text-muted;
}

.inicio__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
  gap: 18px;
}

.inicio__cargando {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  color: $app-text-muted;
  padding: 64px 0;
}

.app-banner {
  margin-bottom: 20px;
}
</style>
