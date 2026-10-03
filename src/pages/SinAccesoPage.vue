<template>
  <q-page>
    <main class="app-container sin-acceso">
      <VacioEstado
        icono="lock"
        titulo="Acceso restringido"
        descripcion="Esta sección es solo para catequistas. Los temas publicados son de libre acceso para los estudiantes."
      >
        <div class="sin-acceso__acciones">
          <q-btn
            v-if="!auth.autenticado"
            color="primary"
            unelevated
            no-caps
            label="Entrar como catequista"
            :to="{ name: 'entrar' }"
          />
          <q-btn v-else flat no-caps color="primary" label="Cambiar de cuenta" @click="salir" />

          <q-btn flat no-caps label="Ver los temas" :to="{ name: 'inicio' }" />
        </div>
      </VacioEstado>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import VacioEstado from '@/components/VacioEstado.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function salir() {
  await auth.salir();
  await router.push({ name: 'inicio' });
}
</script>

<style scoped lang="scss">
.sin-acceso {
  padding-top: 32px;
  padding-bottom: 64px;
}

.sin-acceso__acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
</style>
