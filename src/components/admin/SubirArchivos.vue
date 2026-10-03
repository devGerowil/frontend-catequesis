<template>
  <div class="subida">
    <q-uploader
      :auto-upload="false"
      :max-files="1"
      :max-file-size="maxBytes"
      :accept="ACCEPTED_MIME"
      drag-drop
      flat
      bordered
      class="subida__zona"
      @add="recibir"
    >
      <q-icon name="cloud_upload" size="34px" color="primary" />
      <div class="subida__titulo">Arrastra los archivos aquí</div>
      <div class="subida__ayuda">
        o haz clic para elegirlos · PDF, imágenes y documentos · máx.
        {{ MAX_FILE_SIZE_MB }} MB por archivo
      </div>
    </q-uploader>

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

const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

type ArchivoQ = File & { size?: number; __size?: number };

function recibir(entrantes: unknown[]) {
  avisos.value = [];

  const validos: File[] = [];

  for (const entrante of entrantes) {
    const archivo = entrante as ArchivoQ;

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
  border-radius: 16px;
  padding: 22px 16px;
  background: rgba(91, 75, 196, 0.02);
  border-color: $app-border;

  :deep(.q-uploader__drag) {
    background: transparent;
  }
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
