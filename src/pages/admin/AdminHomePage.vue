<template>
  <q-page>
    <main class="app-container panel">
      <header class="panel__cabecera">
        <div>
          <h1 class="text-display panel__titulo">Temas</h1>
          <p class="panel__intro">
            Gestiona el material de la catequesis. Los borradores solo los ven ustedes.
          </p>
        </div>

        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          label="Nuevo tema"
          :to="{ name: 'tema-nuevo' }"
        />
      </header>

      <div class="panel__filtros">
        <q-input
          v-model="busqueda"
          outlined
          dense
          clearable
          debounce="150"
          placeholder="Buscar por título…"
          aria-label="Buscar tema"
          class="panel__buscador"
        >
          <template #prepend>
            <q-icon name="search" size="19px" color="grey-6" />
          </template>
        </q-input>

        <q-btn-toggle
          v-model="filtro"
          no-caps
          unelevated
          toggle-color="primary"
          color="white"
          text-color="grey-8"
          :options="opcionesFiltro"
        />
      </div>

      <q-banner v-if="store.error" rounded class="bg-red-1 text-negative panel__aviso">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ store.error }}
        <template #action>
          <q-btn flat dense label="Reintentar" @click="store.cargar" />
        </template>
      </q-banner>

      <div v-if="store.cargando" class="panel__cargando">
        <q-spinner-dots size="32px" color="primary" />
      </div>

      <template v-else-if="visibles.length > 0">
        <ul class="panel__lista">
          <li v-for="tema in visibles" :key="tema.id" class="panel__fila">
            <div class="panel__fila-principal">
              <div class="panel__fila-textos">
                <div class="panel__fila-cabecera">
                  <router-link
                    class="panel__fila-titulo"
                    :to="{ name: 'tema', params: { id: tema.id } }"
                  >
                    {{ tema.titulo }}
                  </router-link>
                  <EstadoChip :estado="tema.estado" />
                </div>

                <p class="panel__fila-meta">
                  <span v-if="tema.fecha">{{ formatFecha(tema.fecha) }}</span>
                  <span>
                    {{ tema.total_archivos ?? 0 }}
                    {{ (tema.total_archivos ?? 0) === 1 ? 'archivo' : 'archivos' }}
                  </span>
                  <span>Actualizado {{ formatFecha(tema.actualizado_at) }}</span>
                </p>
              </div>

              <div class="panel__acciones">
                <q-btn
                  flat
                  round
                  dense
                  :icon="tema.estado === 'publicado' ? 'visibility_off' : 'publish'"
                  :color="tema.estado === 'publicado' ? 'grey-7' : 'positive'"
                  :aria-label="tema.estado === 'publicado' ? 'Pasar a borrador' : 'Publicar'"
                  :loading="ocupado === tema.id"
                  @click="alternar(tema)"
                >
                  <q-tooltip>
                    {{ tema.estado === 'publicado' ? 'Pasar a borrador' : 'Publicar' }}
                  </q-tooltip>
                </q-btn>

                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="grey-8"
                  aria-label="Editar tema"
                  :to="{ name: 'tema-editar', params: { id: tema.id } }"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>

                <q-btn
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="negative"
                  aria-label="Eliminar tema"
                  @click="pedirBorrado(tema)"
                >
                  <q-tooltip>Eliminar</q-tooltip>
                </q-btn>
              </div>
            </div>
          </li>
        </ul>
      </template>

      <VacioEstado
        v-else-if="busqueda || filtro !== 'todos'"
        icono="search_off"
        titulo="Ningún tema coincide"
        descripcion="Prueba con otro filtro o cambia la búsqueda."
      >
        <q-btn flat color="primary" label="Quitar filtros" @click="limpiar" />
      </VacioEstado>

      <VacioEstado
        v-else
        icono="note_add"
        titulo="Todavía no hay temas"
        descripcion="Crea el primer tema de la catequesis y súbele sus materiales."
      >
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          label="Crear el primer tema"
          :to="{ name: 'tema-nuevo' }"
        />
      </VacioEstado>

      <q-dialog v-model="confirmarBorrado">
        <q-card class="confirmar">
          <q-card-section class="confirmar__cuerpo">
            <div class="confirmar__icono">
              <q-icon name="delete_outline" size="24px" />
            </div>
            <div>
              <h3 class="confirmar__titulo">¿Eliminar «{{ temaABorrar?.titulo }}»?</h3>
              <p class="confirmar__texto">
                Se borrará el tema junto con todos sus archivos. Esta acción no se puede deshacer.
              </p>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn
              color="negative"
              unelevated
              no-caps
              label="Sí, eliminar"
              :loading="borrando"
              @click="borrar"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import EstadoChip from '@/components/EstadoChip.vue';
import VacioEstado from '@/components/VacioEstado.vue';
import { mensajeDeError } from '@/services/supabase';
import { useTemasStore } from '@/stores/temas';
import { formatFecha, normalizar } from '@/utils/formato';
import type { Tema } from '@/types/database';

type Filtro = 'todos' | 'publicado' | 'borrador';

const store = useTemasStore();
const $q = useQuasar();

const busqueda = ref('');
const filtro = ref<Filtro>('todos');
const ocupado = ref<string | null>(null);

const confirmarBorrado = ref(false);
const temaABorrar = ref<Tema | null>(null);
const borrando = ref(false);

const opcionesFiltro = [
  { label: 'Todos', value: 'todos' },
  { label: 'Publicados', value: 'publicado' },
  { label: 'Borradores', value: 'borrador' },
];

const visibles = computed(() => {
  const texto = normalizar(busqueda.value.trim());

  return store.temas.filter((tema) => {
    if (filtro.value !== 'todos' && tema.estado !== filtro.value) return false;
    if (!texto) return true;
    return normalizar(`${tema.titulo} ${tema.descripcion ?? ''}`).includes(texto);
  });
});

function limpiar() {
  busqueda.value = '';
  filtro.value = 'todos';
}

async function alternar(tema: Tema) {
  ocupado.value = tema.id;
  try {
    await store.alternarEstado(tema);
  } catch (error) {
    $q.notify({ message: mensajeDeError(error), type: 'negative', position: 'top' });
  } finally {
    ocupado.value = null;
  }
}

function pedirBorrado(tema: Tema) {
  temaABorrar.value = tema;
  confirmarBorrado.value = true;
}

async function borrar() {
  if (!temaABorrar.value) return;

  borrando.value = true;
  try {
    await store.borrar(temaABorrar.value.id);
    confirmarBorrado.value = false;
    $q.notify({ message: 'Tema eliminado.', type: 'positive', position: 'top' });
  } catch (error) {
    $q.notify({ message: mensajeDeError(error), type: 'negative', position: 'top' });
  } finally {
    borrando.value = false;
    temaABorrar.value = null;
  }
}

onMounted(() => {
  void store.cargar();
});
</script>

<style scoped lang="scss">
.panel {
  padding-top: 34px;
  padding-bottom: 72px;
}

.panel__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.panel__titulo {
  font-size: 1.9rem;
  margin: 0 0 6px;
}

.panel__intro {
  margin: 0;
  color: $app-text-muted;
  font-size: 0.93rem;
  max-width: 52ch;
  line-height: 1.55;
}

.panel__filtros {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.panel__buscador {
  flex: 1;
  min-width: 220px;
  max-width: 360px;
}

.panel__aviso {
  margin-bottom: 18px;
}

.panel__cargando {
  display: grid;
  place-items: center;
  padding: 60px 0;
}

.panel__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel__fila {
  background: $app-surface;
  border: 1px solid $app-border;
  border-radius: 16px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.panel__fila:hover {
  border-color: rgba(91, 75, 196, 0.26);
  box-shadow: $elevation-1;
}

.panel__fila-principal {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 12px 14px 18px;
}

.panel__fila-textos {
  min-width: 0;
  flex: 1;
}

.panel__fila-cabecera {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.panel__fila-titulo {
  font-family: var(--app-font-display);
  font-size: 1.02rem;
  font-weight: 600;
  color: $app-text;
  text-decoration: none;
  letter-spacing: -0.01em;

  &:hover {
    color: $primary;
  }
}

.panel__fila-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: $app-text-muted;
}

.panel__acciones {
  display: flex;
  flex: none;
  gap: 2px;
}

.confirmar {
  width: 100%;
  max-width: 420px;
}

.confirmar__cuerpo {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-top: 26px;
}

.confirmar__icono {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(220, 90, 82, 0.1);
  color: $negative;
}

.confirmar__titulo {
  font-family: var(--app-font-display);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 2px 0 6px;
}

.confirmar__texto {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: $app-text-muted;
}

@media (max-width: 599px) {
  .panel__fila-principal {
    padding: 14px;
  }

  .panel__acciones {
    flex-direction: column;
  }
}
</style>
