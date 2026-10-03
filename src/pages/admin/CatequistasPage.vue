<template>
  <q-page>
    <main class="app-container equipo">
      <header class="equipo__cabecera">
        <div>
          <h1 class="text-display equipo__titulo">Catequistas</h1>
          <p class="equipo__intro">
            Invita a otros catequistas para que puedan crear temas y subir archivos.
          </p>
        </div>

        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="person_add"
          label="Invitar"
          @click="abrirInvitacion"
        />
      </header>

      <q-banner v-if="!supabaseConfigurado" rounded class="bg-red-1 text-negative equipo__aviso">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        <strong>Falta configurar Supabase.</strong> Copia <code>.env.example</code> a
        <code>.env</code> con tu URL y tu <code>anon key</code>.
      </q-banner>

      <q-banner v-if="error" rounded class="bg-red-1 text-negative equipo__aviso">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <div class="app-card equipo__tarjeta">
        <div v-if="cargando" class="equipo__cargando">
          <q-spinner-dots size="30px" color="primary" />
        </div>

        <template v-else-if="catequistas.length > 0">
          <q-list separator>
            <q-item v-for="persona in catequistas" :key="persona.id" class="equipo__fila">
              <q-item-section avatar>
                <q-avatar size="42px" :color="inicial(persona)" text-color="white">
                  {{ persona.nombre?.trim().charAt(0).toUpperCase() || 'C' }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="equipo__nombre">
                  {{ persona.nombre || 'Sin nombre' }}
                  <q-chip
                    v-if="persona.rol === 'principal'"
                    dense
                    square
                    color="primary"
                    text-color="white"
                    size="sm"
                    class="equipo__chip"
                  >
                    Principal
                  </q-chip>
                </q-item-label>

                <q-item-label caption>
                  {{ persona.email }} ·
                  {{ persona.aceptado_at ? 'acceso creado' : 'invitación pendiente' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="equipo__acciones">
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete_outline"
                    color="negative"
                    aria-label="Quitar invitación"
                    @click="pedirBorrado(persona)"
                  >
                    <q-tooltip>
                      {{ persona.aceptado_at ? 'Quitar acceso' : 'Cancelar invitación' }}
                    </q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </template>

        <VacioEstado
          v-else
          icono="group"
          titulo="No hay nadie en el equipo"
          descripcion="Invita a otro catequista para que pueda ayudarte a gérer los temas."
        />
      </div>

      <p class="equipo__nota">
        Para que alguien pueda entrar debe crear su acceso desde
        <router-link :to="{ name: 'entrar', query: { modo: 'registro' } }">
          la pestaña «Primera vez»
        </router-link>
        usando exactamente el correo con el que lo invitaste.
      </p>

      <q-dialog v-model="dialogoInvitar">
        <q-card class="invitar">
          <q-card-section class="invitar__cuerpo">
            <h3 class="invitar__titulo">Invitar a un catequista</h3>
            <p class="invitar__ayuda">
              Se le体贴a el acceso a este equipo con el correo que indiques.
            </p>

            <q-form class="q-gutter-y-md q-mt-sm" @submit.prevent="invitar">
              <q-input
                v-model="invitado.nombre"
                outlined
                label="Nombre"
                autocomplete="name"
                :rules="[reglaObligatorio]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="person_outline" size="19px" />
                </template>
              </q-input>

              <q-input
                v-model="invitado.email"
                outlined
                label="Correo electrónico"
                type="email"
                autocomplete="off"
                inputmode="email"
                :rules="[reglaObligatorio, reglaEmail]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="mail_outline" size="19px" />
                </template>
              </q-input>

              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                label="Enviar invitación"
                class="full-width"
                :loading="invitando"
              />
            </q-form>
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="confirmarBorrado">
        <q-card class="confirmar">
          <q-card-section class="confirmar__cuerpo">
            <div class="confirmar__icono">
              <q-icon name="person_remove" size="22px" />
            </div>
            <div>
              <h3 class="confirmar__titulo">
                {{
                  personaABorrar?.aceptado_at ? '¿Quitar su acceso?' : '¿Cancelar la invitación?'
                }}
              </h3>
              <p class="confirmar__texto">
                {{ personaABorrar?.nombre || personaABorrar?.email }}
                {{
                  personaABorrar?.aceptado_at
                    ? 'dejará de poder crear temas y subir archivos.'
                    : 'ya no podrá registrarse con este correo.'
                }}
              </p>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn
              color="negative"
              unelevated
              no-caps
              label="Sí, quitar"
              :loading="borrando"
              @click="quitar"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import VacioEstado from '@/components/VacioEstado.vue';
import { eliminarInvitacion, invitarCatequista, listarCatequistas } from '@/services/catequistas';
import { mensajeDeError, supabaseConfigurado } from '@/services/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Catecquista } from '@/types/database';

const $q = useQuasar();
const auth = useAuthStore();

const catequistas = ref<Catecquista[]>([]);
const cargando = ref(false);
const invitando = ref(false);
const borrando = ref(false);
const error = ref<string | null>(null);

const dialogoInvitar = ref(false);
const confirmarBorrado = ref(false);
const personaABorrar = ref<Catecquista | null>(null);

const invitado = ref({ nombre: '', email: '' });

const reglaObligatorio = (valor: string) => Boolean(valor?.trim()) || 'Este campo es obligatorio';
const reglaEmail = (valor: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor?.trim() ?? '') || 'Escribe un correo válido';

/** Color estable derivado del email, para distinguir a cada persona. */
function inicial(persona: Catecquista): string {
  if (persona.rol === 'principal') return 'primary';

  const paleta = ['positive', 'warning', 'info', 'accent'];
  let suma = 0;
  for (const caracter of persona.email) suma += caracter.charCodeAt(0);
  return paleta[suma % paleta.length] ?? 'accent';
}

async function cargar() {
  cargando.value = true;
  error.value = null;
  try {
    catequistas.value = await listarCatequistas();
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo cargar el equipo.');
  } finally {
    cargando.value = false;
  }
}

function abrirInvitacion() {
  invitado.value = { nombre: '', email: '' };
  dialogoInvitar.value = true;
}

async function invitar() {
  if (!auth.perfil) {
    error.value = 'No se pudo identificar tu perfil de catequista principal.';
    return;
  }

  invitando.value = true;
  try {
    await invitarCatequista(
      invitado.value.email.trim(),
      invitado.value.nombre.trim(),
      'editor',
      auth.perfil.id,
    );
    dialogoInvitar.value = false;
    await cargar();
    $q.notify({ message: 'Invitación creada.', type: 'positive', position: 'top' });
  } catch (e) {
    $q.notify({ message: mensajeDeError(e), type: 'negative', position: 'top' });
  } finally {
    invitando.value = false;
  }
}

function pedirBorrado(persona: Catecquista) {
  personaABorrar.value = persona;
  confirmarBorrado.value = true;
}

async function quitar() {
  if (!personaABorrar.value) return;

  borrando.value = true;
  try {
    await eliminarInvitacion(personaABorrar.value.id);
    catequistas.value = catequistas.value.filter((p) => p.id !== personaABorrar.value?.id);
    confirmarBorrado.value = false;
    $q.notify({ message: 'Invitación retirada.', type: 'info', position: 'top' });
  } catch (e) {
    $q.notify({ message: mensajeDeError(e), type: 'negative', position: 'top' });
  } finally {
    borrando.value = false;
    personaABorrar.value = null;
  }
}

onMounted(cargar);
</script>

<style scoped lang="scss">
.equipo {
  padding-top: 34px;
  padding-bottom: 72px;
}

.equipo__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.equipo__titulo {
  font-size: 1.9rem;
  margin: 0 0 6px;
}

.equipo__intro {
  margin: 0;
  color: $app-text-muted;
  font-size: 0.93rem;
  max-width: 52ch;
  line-height: 1.55;
}

.equipo__aviso {
  margin-bottom: 18px;
}

.equipo__tarjeta {
  overflow: hidden;
}

.equipo__fila {
  padding: 14px 16px;
}

.equipo__nombre {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 500;
}

.equipo__chip {
  border-radius: 999px;
  font-size: 0.72rem;
}

.equipo__cargando {
  display: grid;
  place-items: center;
  padding: 50px 0;
}

.equipo__nota {
  margin-top: 18px;
  font-size: 0.87rem;
  color: $app-text-muted;
  line-height: 1.6;

  a {
    color: $primary;
  }
}

.invitar {
  width: 100%;
  max-width: 420px;
}

.invitar__cuerpo {
  padding-bottom: 8px;
}

.invitar__titulo {
  font-family: var(--app-font-display);
  font-size: 1.16rem;
  font-weight: 600;
  margin: 4px 0 4px;
}

.invitar__ayuda {
  margin: 0;
  font-size: 0.88rem;
  color: $app-text-muted;
  line-height: 1.5;
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
</style>
