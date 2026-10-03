<template>
  <q-chip
    dense
    square
    :icon="publicado ? 'visibility' : 'edit_note'"
    :color="publicado ? 'positive' : 'grey-6'"
    text-color="white"
    size="sm"
    class="estado-chip"
  >
    {{ publicado ? 'Publicado' : 'Borrador' }}
  </q-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EstadoTema } from '@/types/database';

const props = defineProps<{ estado: EstadoTema }>();

const publicado = computed(() => props.estado === 'publicado');
</script>

<style scoped lang="scss">
.estado-chip {
  border-radius: 999px;
  font-size: 0.74rem;
  letter-spacing: 0.01em;
}
</style>
