<template>
  <div class="vacio">
    <div class="vacio__icono">
      <q-icon :name="icono" size="30px" />
    </div>
    <h3 class="vacio__titulo">{{ titulo }}</h3>
    <p v-if="descripcion" class="vacio__descripcion">{{ descripcion }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    titulo: string;
    descripcion?: string;
    icono?: string;
  }>(),
  { descripcion: '', icono: 'auto_stories' },
);
</script>

<style scoped lang="scss">
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 56px 24px;
}

.vacio__icono {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: $primary;
  background: rgba(91, 75, 196, 0.08);
  margin-bottom: 4px;
}

.vacio__titulo {
  font-family: var(--app-font-display);
  font-size: 1.12rem;
  font-weight: 600;
  margin: 0;
}

.vacio__descripcion {
  margin: 0;
  max-width: 42ch;
  color: $app-text-muted;
  font-size: 0.93rem;
  line-height: 1.6;
}
</style>
