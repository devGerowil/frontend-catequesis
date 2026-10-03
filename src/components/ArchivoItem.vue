<template>
  <div class="archivo">
    <div class="archivo__icono" :class="`archivo__icono--${tipo}`">
      <q-icon :name="info.icono" size="21px" />
    </div>

    <div class="archivo__datos">
      <span class="archivo__nombre" :title="archivo.nombre">{{ archivo.nombre }}</span>
      <span class="archivo__meta">
        <span v-if="archivo.tamano">{{ formatTamano(archivo.tamano) }}</span>
        <template v-if="archivo.tamano && fecha">·</template>
        <span v-if="fecha">{{ fecha }}</span>
      </span>
    </div>

    <div class="archivo__acciones">
      <q-btn
        v-if="esVisualizable(tipo)"
        flat
        round
        dense
        icon="open_in_new"
        aria-label="Ver archivo"
        @click="$emit('ver', archivo)"
      >
        <q-tooltip>Ver</q-tooltip>
      </q-btn>

      <q-btn
        flat
        round
        dense
        icon="download"
        aria-label="Descargar archivo"
        :href="url"
        target="_blank"
        rel="noopener"
        download
      >
        <q-tooltip>Descargar</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { urlPublica } from '@/services/archivos';
import {
  esVisualizable,
  formatFecha,
  formatTamano,
  INFO_TIPOS,
  tipoDeArchivo,
} from '@/utils/formato';
import type { Archivo } from '@/types/database';

const props = defineProps<{
  archivo: Archivo;
  mostrarFecha?: boolean;
}>();

defineEmits<{ ver: [archivo: Archivo] }>();

const tipo = computed(() => tipoDeArchivo(props.archivo));
const info = computed(() => INFO_TIPOS[tipo.value]);
const url = computed(() => urlPublica(props.archivo.ruta));
const fecha = computed(() => (props.mostrarFecha ? formatFecha(props.archivo.creado_at) : ''));
</script>

<style scoped lang="scss">
.archivo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 16px;
  border: 1px solid $app-border;
  border-radius: 14px;
  background: $app-surface;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: rgba(91, 75, 196, 0.28);
    background: rgba(91, 75, 196, 0.025);
  }
}

.archivo__icono {
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 11px;
  display: grid;
  place-items: center;

  &--pdf {
    background: rgba(220, 90, 82, 0.1);
    color: $negative;
  }

  &--imagen {
    background: rgba(78, 143, 213, 0.12);
    color: $info;
  }

  &--documento {
    background: rgba(91, 75, 196, 0.1);
    color: $primary;
  }

  &--otro {
    background: rgba(122, 115, 137, 0.12);
    color: $app-text-muted;
  }
}

.archivo__datos {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.archivo__nombre {
  font-size: 0.93rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archivo__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.79rem;
  color: $app-text-muted;
}

.archivo__acciones {
  display: flex;
  flex: none;
  gap: 2px;
}
</style>
