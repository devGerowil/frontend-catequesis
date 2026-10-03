<template>
  <q-page>
    <main class="app-container tema">
      <div class="tema__barra">
        <q-btn
          flat
          dense
          no-caps
          color="grey-8"
          icon="arrow_back"
          label="Todos los temas"
          class="tema__volver"
          :to="{ name: 'inicio' }"
        />

        <q-btn
          v-if="tema && auth.esCatequista"
          color="primary"
          unelevated
          no-caps
          icon="edit"
          label="Editar tema"
          :to="{ name: 'tema-editar', params: { id: tema.id } }"
        />
      </div>

      <div v-if="store.cargando" class="tema__cargando">
        <q-spinner-dots size="34px" color="primary" />
      </div>

      <template v-else-if="tema">
        <header class="tema__cabecera">
          <div class="tema__chips">
            <span class="text-eyebrow">{{ APP_PARROQUIA }}</span>
            <EstadoChip v-if="auth.esCatequista" :estado="tema.estado" />
          </div>

          <h1 class="text-display tema__titulo">{{ tema.titulo }}</h1>

          <div class="tema__meta">
            <span v-if="tema.fecha">
              <q-icon name="calendar_today" size="15px" />
              {{ formatFecha(tema.fecha) }}
            </span>
            <span>
              <q-icon name="attach_file" size="15px" />
              {{ archivos.length }}
              {{ archivos.length === 1 ? 'archivo' : 'archivos' }}
            </span>
          </div>

          <p v-if="tema.descripcion" class="tema__descripcion">
            {{ tema.descripcion }}
          </p>
        </header>

        <section v-if="tema.contenido" class="app-card tema__contenido">
          <div class="app-prose">{{ tema.contenido }}</div>
        </section>

        <section class="tema__archivos">
          <h2 class="tema__seccion">Material del tema</h2>

          <template v-if="archivos.length > 0">
            <div v-for="grupo in grupos" :key="grupo.tipo" class="tema__grupo">
              <h3 class="tema__grupo-titulo">
                <q-icon :name="grupo.icono" size="17px" />
                {{ grupo.etiqueta }}
                <span class="tema__grupo-conteo">{{ grupo.archivos.length }}</span>
              </h3>

              <div class="tema__lista">
                <ArchivoItem
                  v-for="archivo in grupo.archivos"
                  :key="archivo.id"
                  :archivo="archivo"
                  @ver="abrirVisor"
                />
              </div>
            </div>
          </template>

          <VacioEstado
            v-else
            icono="folder_open"
            titulo="Todavía no hay archivos"
            descripcion="El catequista todavía no subió materiales a este tema."
          />
        </section>
      </template>

      <VacioEstado
        v-else
        icono="sentiment_dissatisfied"
        titulo="Tema no encontrado"
        descripcion="Puede que el enlace no sea correcto o que el tema ya no esté publicado."
      >
        <q-btn color="primary" label="Ver todos los temas" :to="{ name: 'inicio' }" />
      </VacioEstado>

      <VistaArchivoDialog v-model="visorAbierto" :archivo="archivoActivo" />
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import ArchivoItem from '@/components/ArchivoItem.vue';
import EstadoChip from '@/components/EstadoChip.vue';
import VacioEstado from '@/components/VacioEstado.vue';
import VistaArchivoDialog from '@/components/VistaArchivoDialog.vue';
import { APP_PARROQUIA } from '@/config/app';
import { useAuthStore } from '@/stores/auth';
import { useTemasStore } from '@/stores/temas';
import { formatFecha, INFO_TIPOS, tipoDeArchivo, type TipoArchivo } from '@/utils/formato';
import type { Archivo, Tema } from '@/types/database';

const route = useRoute();
const store = useTemasStore();
const auth = useAuthStore();

const tema = ref<Tema | null>(null);
const archivos = ref<Archivo[]>([]);
const visorAbierto = ref(false);
const archivoActivo = ref<Archivo | null>(null);

const grupos = computed(() => {
  const porTipo = new Map<TipoArchivo, Archivo[]>();

  for (const archivo of archivos.value) {
    const tipo = tipoDeArchivo(archivo);
    const lista = porTipo.get(tipo);
    if (lista) lista.push(archivo);
    else porTipo.set(tipo, [archivo]);
  }

  return (['pdf', 'imagen', 'documento', 'otro'] as TipoArchivo[])
    .filter((tipo) => porTipo.has(tipo))
    .map((tipo) => ({
      tipo,
      ...INFO_TIPOS[tipo],
      archivos: porTipo.get(tipo) ?? [],
    }));
});

function abrirVisor(archivo: Archivo) {
  archivoActivo.value = archivo;
  visorAbierto.value = true;
}

onMounted(async () => {
  const id = String(route.params.id ?? '');
  if (!id) return;

  try {
    const resultado = await store.cargarUno(id);
    tema.value = resultado.tema;
    archivos.value = resultado.archivos;
  } catch {
    tema.value = null;
  }
});
</script>

<style scoped lang="scss">
.tema {
  padding-top: 28px;
  padding-bottom: 64px;
}

.tema__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.tema__volver {
  margin-left: -10px;
}

.tema__cargando {
  display: grid;
  place-items: center;
  padding: 80px 0;
}

.tema__cabecera {
  max-width: 62ch;
  margin-bottom: 26px;
}

.tema__chips {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.tema__titulo {
  font-size: clamp(1.8rem, 4.6vw, 2.5rem);
  margin: 0 0 14px;
}

.tema__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  color: $app-text-muted;
  font-size: 0.87rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.tema__descripcion {
  margin: 16px 0 0;
  font-size: 1.06rem;
  line-height: 1.65;
  color: $app-text;
}

.tema__contenido {
  padding: 28px 30px;
  margin-bottom: 40px;
}

.tema__seccion {
  font-family: var(--app-font-display);
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 18px;
}

.tema__grupo + .tema__grupo {
  margin-top: 26px;
}

.tema__grupo-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: $app-text-muted;
  margin: 0 0 10px;
}

.tema__grupo-conteo {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(122, 115, 137, 0.12);
  font-size: 0.72rem;
  letter-spacing: 0;
}

.tema__lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
