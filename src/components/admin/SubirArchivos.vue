<template>
  <div class="subida">
    <div
      class="subida__zona"
      :class="{ 'subida__zona--activa': arrastrando }"
      role="button"
      tabindex="0"
      @click="abrirSelector"
      @keydown.enter.prevent="abrirSelector"
      @keydown.space.prevent="abrirSelector"
      @dragenter.prevent="arrastrando = true"
      @dragover.prevent="arrastrando = true"
      @dragleave.prevent="arrastrando = false"
      @drop.prevent="soltar"
    >
      <q-icon name="cloud_upload" size="34px" color="primary" />
      <div class="subida__titulo">Arrastra los archivos aquí</div>
      <div class="subida__ayuda">
        o haz clic para elegirlos · PDF, imágenes y documentos · máx.
        {{ MAX_FILE_SIZE_MB }} MB por archivo
      </div>

      <input
        ref="inputRef"
        class="subida__input"
        type="file"
        multiple
        :accept="ACCEPTED_MIME"
        @click.stop
        @change="cambiar"
      />
    </div>

    <q-banner
      v-if="avisos.length > 0"
      rounded
      dense
      class="bg-orange-1 text-orange-9 subida__aviso"
    >
      <template #avatar>
        <q-icon name="info_outline" />
      </template>
      <ul class="subida__avisos">
        <li v-for="(aviso, indice) in avisos" :key="indice">{{ aviso }}</li>
      </ul>
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ACCEPTED_MIME, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from '@/config/app';

const emit = defineEmits<{ seleccionar: [archivos: File[]] }>();

const avisos = ref<string[]>([]);
const arrastrando = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

function abrirSelector() {
  inputRef.value?.click();
}

function cambiar(evento: Event) {
  const input = evento.target as HTMLInputElement;
  procesar(Array.from(input.files ?? []));
  input.value = '';
}

function soltar(evento: DragEvent) {
  arrastrando.value = false;
  procesar(Array.from(evento.dataTransfer?.files ?? []));
}

function procesar(archivos: File[]) {
  avisos.value = [];

  const validos: File[] = [];

  for (const archivo of archivos) {
    if (!extensionValida(archivo.name)) {
      avisos.value.push(`«${archivo.name}» tiene un formato no permitido.`);
      continue;
    }

    if (archivo.size > maxBytes) {
      avisos.value.push(`«${archivo.name}» supera los ${MAX_FILE_SIZE_MB} MB.`);
      continue;
    }

    validos.push(archivo);
  }

  if (validos.length > 0) emit('seleccionar', validos);
}

function extensionValida(nombre: string): boolean {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXTENSIONS.includes(ext);
}
</script>

<style scoped lang="scss">
.subida__zona {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-radius: 16px;
  padding: 22px 16px;
  cursor: pointer;
  background: rgba(91, 75, 196, 0.02);
  border: 1px dashed $app-border;
  transition:
    border-color 0.2s,
    background 0.2s;

  > * {
    pointer-events: none;
  }

  &:hover,
  &:focus-visible {
    border-color: $primary;
    background: rgba(91, 75, 196, 0.06);
    outline: none;
  }
}

.subida__zona--activa {
  border-color: $primary;
  border-style: solid;
  background: rgba(91, 75, 196, 0.1);
}

.subida__input {
  display: none;
}

.subida__titulo {
  font-weight: 500;
  margin-top: 8px;
}

.subida__ayuda {
  font-size: 0.82rem;
  color: $app-text-muted;
  margin-top: 3px;
}

.subida__aviso {
  margin-top: 12px;
  font-size: 0.85rem;
}

.subida__avisos {
  margin: 4px 0 0;
  padding-left: 18px;
}
</style>
