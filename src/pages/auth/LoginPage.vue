<template>
  <q-page class="entrar">
    <main class="entrar__contenedor">
      <router-link :to="{ name: 'inicio' }" class="entrar__marca">
        <q-avatar size="40px" color="primary" text-color="white">
          <q-icon name="auto_stories" size="22px" />
        </q-avatar>
        <span class="text-display entrar__marca-texto">
          <span>Confirmación 2026</span>
          <small>{{ APP_PARROQUIA }}</small>
        </span>
      </router-link>

      <q-banner v-if="!supabaseConfigurado" rounded class="entrar__aviso">
        <template #avatar>
          <q-icon name="warning_amber" />
        </template>
        <strong>Falta configurar Supabase.</strong>
        <br />
        Copia <code>.env.example</code> a <code>.env</code> y rellena tu URL y tu
        <code>anon key</code>.
      </q-banner>

      <div class="app-card entrar__tarjeta">
        <q-tabs
          v-model="pestana"
          dense
          no-caps
          narrow-indicator
          active-color="primary"
          indicator-color="primary"
          class="entrar__tabs"
        >
          <q-tab name="login" label="Entrar" no-caps />
          <q-tab name="registro" label="Primera vez" no-caps />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="pestana" animated class="entrar__paneles">
          <q-tab-panel name="login" class="entrar__panel">
            <h1 class="entrar__titulo">Acceso de catequistas</h1>
            <p class="entrar__ayuda">
              Los estudiantes no necesitan entrar: todos los temas publicados son públicos.
            </p>

            <q-form class="q-gutter-y-md" @submit.prevent="entrar">
              <q-input
                v-model="email"
                outlined
                label="Correo electrónico"
                type="email"
                autocomplete="email"
                inputmode="email"
                :rules="[reglaObligatorio, reglaEmail]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="mail_outline" size="19px" />
                </template>
              </q-input>

              <q-input
                v-model="password"
                outlined
                label="Contraseña"
                :type="verPassword ? 'text' : 'password'"
                autocomplete="current-password"
                :rules="[reglaObligatorio]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="lock_outline" size="19px" />
                </template>
                <template #append>
                  <q-btn
                    flat
                    dense
                    round
                    :icon="verPassword ? 'visibility_off' : 'visibility'"
                    :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click="verPassword = !verPassword"
                  />
                </template>
              </q-input>

              <div class="entrar__fila">
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Olvidé mi contraseña"
                  @click="recuperar"
                />
              </div>

              <q-btn
                type="submit"
                color="primary"
                label="Entrar"
                class="full-width"
                size="lg"
                unelevated
                no-caps
                :loading="enviando"
              />
            </q-form>
          </q-tab-panel>

          <q-tab-panel name="registro" class="entrar__panel">
            <h1 class="entrar__titulo">Crear mi acceso</h1>
            <p class="entrar__ayuda">
              Solo si ya recibiste una invitación del catequista principal. Usa el mismo correo con
              el que te invitaron.
            </p>

            <q-form class="q-gutter-y-md" @submit.prevent="registrar">
              <q-input
                v-model="emailRegistro"
                outlined
                label="Correo electrónico"
                type="email"
                autocomplete="email"
                inputmode="email"
                :rules="[reglaObligatorio, reglaEmail]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="mail_outline" size="19px" />
                </template>
              </q-input>

              <q-input
                v-model="passwordRegistro"
                outlined
                label="Elige una contraseña"
                :type="verPasswordRegistro ? 'text' : 'password'"
                autocomplete="new-password"
                :rules="[reglaObligatorio, reglaPassword]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="lock_outline" size="19px" />
                </template>
                <template #append>
                  <q-btn
                    flat
                    dense
                    round
                    :icon="verPasswordRegistro ? 'visibility_off' : 'visibility'"
                    @click="verPasswordRegistro = !verPasswordRegistro"
                  />
                </template>
              </q-input>

              <q-input
                v-model="passwordRepeticion"
                outlined
                label="Repite la contraseña"
                :type="verPasswordRegistro ? 'text' : 'password'"
                autocomplete="new-password"
                :rules="[reglaObligatorio, reglaCoincide]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="lock_reset" size="19px" />
                </template>
              </q-input>

              <q-btn
                type="submit"
                color="primary"
                label="Crear acceso"
                class="full-width"
                size="lg"
                unelevated
                no-caps
                :loading="enviando"
              />
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </div>

      <router-link :to="{ name: 'inicio' }" class="entrar__volver">
        <q-icon name="arrow_back" size="16px" />
        Volver a los temas
      </router-link>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { APP_PARROQUIA } from '@/config/app';
import { mensajeDeError, supabaseConfigurado } from '@/services/supabase';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const pestana = ref<'login' | 'registro'>(route.query.modo === 'registro' ? 'registro' : 'login');

const email = ref('');
const password = ref('');
const verPassword = ref(false);

const emailRegistro = ref('');
const passwordRegistro = ref('');
const passwordRepeticion = ref('');
const verPasswordRegistro = ref(false);

const enviando = ref(false);

function avisar(mensaje: string, tipo: 'positive' | 'negative' | 'info' = 'negative') {
  $q.notify({ message: mensaje, type: tipo, position: 'top', timeout: 4000 });
}

const reglaObligatorio = (valor: string) => Boolean(valor?.trim()) || 'Este campo es obligatorio';

const reglaEmail = (valor: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor?.trim() ?? '') || 'Escribe un correo válido';

const reglaPassword = (valor: string) => (valor?.length ?? 0) >= 6 || 'Mínimo 6 caracteres';

const reglaCoincide = (valor: string) =>
  valor === passwordRegistro.value || 'Las contraseñas no coinciden';

async function entrar() {
  if (!supabaseConfigurado) return avisar('Configura Supabase antes de entrar.');

  enviando.value = true;
  try {
    await auth.entrar(email.value, password.value);

    if (!auth.esCatequista) {
      await auth.salir();
      avisar('Tu cuenta no tiene permiso de catequista. Pide al principal que te invite.');
      return;
    }

    avisar('Sesión iniciada.', 'positive');
    await router.push(String(route.query.destino ?? '/admin'));
  } catch (error) {
    avisar(mensajeDeError(error, 'No se pudo iniciar sesión.'));
  } finally {
    enviando.value = false;
  }
}

async function registrar() {
  if (!supabaseConfigurado) return avisar('Configura Supabase antes de continuar.');

  enviando.value = true;
  try {
    await auth.registrarse(emailRegistro.value, passwordRegistro.value);

    if (!auth.esCatequista) {
      await auth.salir();
      avisar(
        'Tu cuenta se creó, pero ese correo no estaba invitado. Pide al catequista principal que te agregue.',
        'info',
      );
      return;
    }

    avisar('¡Acceso creado! Bienvenido al equipo.', 'positive');
    await router.push('/admin');
  } catch (error) {
    const crudo = error instanceof Error ? error.message : '';

    if (/already registered/i.test(crudo)) {
      email.value = emailRegistro.value.trim();
      password.value = '';
      pestana.value = 'login';
      avisar('Esa cuenta ya existe. Escribimos tu correo: solo ingresa tu contraseña.', 'info');
      return;
    }

    avisar(mensajeDeError(error, 'No se pudo crear el acceso.'));
  } finally {
    enviando.value = false;
  }
}

async function recuperar() {
  if (!supabaseConfigurado) return avisar('Configura Supabase antes de continuar.');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    avisar('Escribe primero tu correo en el campo de arriba.');
    return;
  }

  try {
    await auth.recuperarPassword(email.value);
    avisar('Te enviamos un correo para recuperar tu contraseña.', 'info');
  } catch (error) {
    avisar(mensajeDeError(error));
  }
}
</script>

<style scoped lang="scss">
.entrar {
  display: flex;
  justify-content: center;
  padding: 44px 20px 64px;
}

.entrar__contenedor {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.entrar__marca {
  display: flex;
  align-items: center;
  gap: 13px;
  text-decoration: none;
  color: $app-text;
}

.entrar__marca-texto {
  display: flex;
  flex-direction: column;
  font-size: 1.06rem;
  line-height: 1.25;

  small {
    font-family: var(--app-font-body);
    font-size: 0.76rem;
    font-weight: 400;
    color: $app-text-muted;
  }
}

.entrar__aviso {
  text-align: left;
}

.entrar__tarjeta {
  width: 100%;
  overflow: hidden;
}

.entrar__tabs :deep(.q-tab) {
  min-height: 48px;
}

.entrar__panel {
  padding: 26px 26px 28px;
}

.entrar__titulo {
  font-family: var(--app-font-display);
  font-size: 1.32rem;
  font-weight: 600;
  margin: 0 0 6px;
}

.entrar__ayuda {
  margin: 0 0 20px;
  font-size: 0.88rem;
  line-height: 1.55;
  color: $app-text-muted;
}

.entrar__fila {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
}

.entrar__volver {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $app-text-muted;
  text-decoration: none;
  font-size: 0.88rem;

  &:hover {
    color: $primary;
  }
}
</style>
