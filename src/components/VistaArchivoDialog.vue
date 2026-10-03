<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="visor">
      <q-bar class="visor__barra">
        <q-icon :name="tipo === 'pdf' ? 'picture_as_pdf' : 'image'" size="19px" />
        <div class="visor__nombre" :title="archivo?.nombre">{{ archivo?.nombre }}</div>

        <q-space />

        <q-btn flat dense round icon="zoom_out_map" aria-label="Ajustar" @click="ajustar">
          <q-tooltip>Ajustar a la pantalla</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          icon="download"
          aria-label="Descargar"
          :href="url"
          download
          target="_blank"
          rel="noopener"
        >
          <q-tooltip>Descargar</q-tooltip>
        </q-btn>
        <q-btn flat dense round icon="close" aria-label="Cerrar" v-close-popup>
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </q-bar>

      <div v-if="tipo === 'pdf'" class="visor__cuerpo">
        <iframe :key="clave" :src="url" :title="archivo?.nombre" class="visor__embed" />
      </div>

      <div v-else class="visor__cuerpo visor__cuerpo--imagen">
        <img :src="url" :alt="archivo?.nombre" class="visor__imagen" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { urlPublica } from '@/services/archivos';
import { tipoDeArchivo } from '@/utils/formato';
import type { Archivo } from '@/types/database';

const props = defineProps<{
  modelValue: boolean;
  archivo: Archivo | null;
}>();

defineEmits<{ 'update:modelValue': [valor: boolean] }>();

const clave = ref(0);

const tipo = computed(() => (props.archivo ? tipoDeArchivo(props.archivo) : 'otro'));
const url = computed(() => (props.archivo ? urlPublica(props.archivo.ruta) : ''));

// Cambiar de archivo con el visor abierto a veces no recarga el iframe:
// forzamos el remonte con una clave nueva.
watch(
  () => props.archivo?.id,
  () => {
    clave.value += 1;
  },
);

function ajustar() {
  clave.value += 1;
}
</script>

<style scoped lang="scss">
.visor {
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.visor__barra {
  background: rgba(36, 31, 53, 0.96);
  color: #fff;
  padding-top: env(safe-area-inset-top, 0px);
}

.visor__nombre {
  font-size: 0.92rem;
  font-weight: 500;
  margin-left: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 55vw;
}

.visor__cuerpo {
  flex: 1;
  min-height: 0;
  background: #f2f0ee;
}

.visor__cuerpo--imagen {
  display: grid;
  place-items: center;
  overflow: auto;
  padding: 20px;
}

.visor__embed {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.visor__imagen {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: $elevation-2;
}
</style>
