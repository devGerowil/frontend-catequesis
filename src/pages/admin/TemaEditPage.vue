<template>
  <q-page>
    <main class="app-container editor">
      <q-btn
        flat
        dense
        no-caps
        color="grey-8"
        icon="arrow_back"
        label="Volver al panel"
        class="editor__volver"
        to="/admin"
      />

      <header class="editor__cabecera">
        <h1 class="text-display editor__titulo">
          {{ esNuevo ? 'Nuevo tema' : 'Editar tema' }}
        </h1>
        <p class="editor__intro">
          Escribe el material del tema y adjunta los archivos. Mientras esté en borrador solo
          ustedes lo verán.
        </p>
      </header>

      <q-banner v-if="!supabaseConfigurado" rounded class="bg-red-1 text-negative editor__aviso">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        <strong>Falta configurar Supabase.</strong> Copia <code>.env.example</code> a
        <code>.env</code> con tu URL y tu <code>anon key</code>.
      </q-banner>

      <div class="editor__grid">
        <div class="editor__principal">
          <section class="app-card editor__bloque">
            <q-input
              v-model="form.titulo"
              outlined
              label="Título del tema"
              counter
              maxlength="140"
              :rules="[reglaTitulo]"
              lazy-rules
            />

            <q-input
              v-model="form.descripcion"
              outlined
              type="textarea"
              autogrow
              label="Descripción corta"
              hint="Se muestra en la lista de temas."
              maxlength="280"
              class="q-mt-md"
            />

            <q-input
              v-model="form.contenido"
              outlined
              type="textarea"
              autogrow
              input-style="min-height: 260px"
              label="Contenido del tema"
              hint="Pega aquí el material. Puedes copiarlo desde Word o Google Docs."
              class="q-mt-md"
            />
          </section>

          <section class="app-card editor__bloque">
            <div class="editor__bloque-cabecera">
              <div>
                <h2 class="editor__bloque-titulo">Archivos</h2>
                <p class="editor__bloque-ayuda">
                  PDF, imágenes y documentos. Los estudiantes podrán verlos y descargarlos.
                </p>
              </div>
              <q-btn
                color="primary"
                unelevated
                no-caps
                icon="upload"
                label="Subir"
                :disable="temaId === null"
                @click="dialogoSubida = true"
              />
            </div>

            <div v-if="subiendo" class="editor__subiendo">
              <q-linear-progress
                :value="progresoSubida / 100"
                color="primary"
                track-color="grey-3"
                rounded
                size="5px"
              />
              <span>Subiendo {{ subidos + 1 }} de {{ totalPendientes }}…</span>
            </div>

            <div v-if="cargandoArchivos" class="editor__cargando">
              <q-spinner-dots size="28px" color="primary" />
            </div>

            <template v-else-if="archivos.length > 0">
              <ul class="editor__archivos">
                <li v-for="(archivo, indice) in archivos" :key="archivo.id" class="editor__archivo">
                  <q-icon name="drag_indicator" size="18px" color="grey-5" />

                  <div class="editor__archivo-datos">
                    <span class="editor__archivo-nombre">{{ archivo.nombre }}</span>
                    <span class="editor__archivo-meta">{{ formatTamano(archivo.tamano) }}</span>
                  </div>

                  <div class="editor__archivo-acciones">
                    <q-btn
                      flat
                      round
                      dense
                      icon="arrow_upward"
                      size="sm"
                      color="grey-7"
                      aria-label="Subir en la lista"
                      :disable="indice === 0 || subiendo"
                      @click="mover(indice, -1)"
                    >
                      <q-tooltip>Subir en la lista</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      icon="arrow_downward"
                      size="sm"
                      color="grey-7"
                      aria-label="Bajar en la lista"
                      :disable="indice === archivos.length - 1 || subiendo"
                      @click="mover(indice, 1)"
                    >
                      <q-tooltip>Bajar en la lista</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete_outline"
                      size="sm"
                      color="negative"
                      aria-label="Eliminar archivo"
                      @click="pedirBorradoArchivo(archivo)"
                    >
                      <q-tooltip>Eliminar</q-tooltip>
                    </q-btn>
                  </div>
                </li>
              </ul>
            </template>

            <VacioEstado
              v-else
              icono="attach_file"
              titulo="Sin archivos todavía"
              descripcion="Sube los PDFs, imágenes o documentos de este tema."
            >
              <q-btn
                flat
                color="primary"
                no-caps
                icon="upload"
                label="Subir archivos"
                :disable="temaId === null"
                @click="dialogoSubida = true"
              />
            </VacioEstado>
          </section>
        </div>

        <aside class="editor__lateral">
          <section class="app-card editor__bloque editor__bloque--pegado">
            <h2 class="editor__bloque-titulo">Publicación</h2>

            <div class="editor__estado">
              <q-toggle
                v-model="publicado"
                color="positive"
                label="Publicado para los estudiantes"
                size="lg"
              />
              <p class="editor__estado-ayuda">
                {{
                  publicado
                    ? 'Visible para cualquiera que tenga el enlace.'
                    : 'Solo visible para los catequistas.'
                }}
              </p>
            </div>

            <q-input
              v-model="form.fecha"
              outlined
              dense
              type="date"
              label="Fecha"
              stack-label
              class="q-mt-md"
            >
              <template #prepend>
                <q-icon name="calendar_today" size="18px" />
              </template>
            </q-input>

            <q-input
              v-model.number="form.orden"
              outlined
              dense
              type="number"
              label="Orden"
              hint="Menor número aparece primero."
              class="q-mt-md"
            >
              <template #prepend>
                <q-icon name="low_priority" size="18px" />
              </template>
            </q-input>

            <q-btn
              class="full-width q-mt-lg"
              color="primary"
              unelevated
              no-caps
              size="lg"
              :icon="esNuevo ? 'add' : 'save'"
              :label="esNuevo ? 'Crear tema' : 'Guardar cambios'"
              :loading="guardando"
              @click="guardar"
            />

            <q-btn
              v-if="!esNuevo"
              class="full-width q-mt-sm"
              flat
              no-caps
              color="grey-8"
              icon="visibility"
              label="Ver como estudiante"
              :to="{ name: 'tema', params: { id: form.id } }"
            />

            <q-btn
              v-if="!esNuevo"
              class="full-width q-mt-md"
              flat
              no-caps
              color="negative"
              icon="delete_outline"
              label="Eliminar tema"
              @click="pedirBorradoTema"
            />
          </section>
        </aside>
      </div>

      <q-dialog v-model="dialogoSubida">
        <q-card class="subida-dialog">
          <q-card-section>
            <h3 class="subida-dialog__titulo">Subir archivos</h3>
            <p class="subida-dialog__ayuda">
              Se añadirán al final de la lista de «{{ form.titulo || 'este tema' }}».
            </p>
          </q-card-section>

          <q-card-section>
            <SubirArchivos @seleccionar="subir" />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn
              v-if="subiendo"
              flat
              dense
              no-caps
              color="grey-8"
              label="Cancelar"
              @click="cancelarSubida"
            />
            <q-btn flat no-caps label="Cerrar" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="confirmarArchivo">
        <q-card class="confirmar">
          <q-card-section class="confirmar__cuerpo">
            <div class="confirmar__icono">
              <q-icon name="delete_outline" size="24px" />
            </div>
            <div>
              <h3 class="confirmar__titulo">¿Eliminar este archivo?</h3>
              <p class="confirmar__texto">
                «{{ archivoABorrar?.nombre }}» se borrará del tema y del servidor. No se puede
                deshacer.
              </p>
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn
              color="negative"
              unelevated
              no-caps
              label="Sí, eliminar"
              :loading="borrandoArchivo"
              @click="borrarArchivo"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="confirmarTema">
        <q-card class="confirmar">
          <q-card-section class="confirmar__cuerpo">
            <div class="confirmar__icono">
              <q-icon name="delete_outline" size="24px" />
            </div>
            <div>
              <h3 class="confirmar__titulo">¿Eliminar el tema completo?</h3>
              <p class="confirmar__texto">
                Se borrarán «{{ form.titulo }}» y sus {{ archivos.length }} archivos. Esta acción no
                se puede deshacer.
              </p>
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn
              color="negative"
              unelevated
              no-caps
              label="Sí, eliminar"
              :loading="borrandoTema"
              @click="borrarTema"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import SubirArchivos from '@/components/admin/SubirArchivos.vue';
import VacioEstado from '@/components/VacioEstado.vue';
import {
  eliminarArchivo as borrarArchivoRemoto,
  listarArchivos,
  reordenarArchivos,
  subirArchivo,
} from '@/services/archivos';
import { mensajeDeError, supabaseConfigurado } from '@/services/supabase';
import { useAuthStore } from '@/stores/auth';
import { useTemasStore } from '@/stores/temas';
import { formatTamano, paraInputFecha } from '@/utils/formato';
import type { Archivo, EstadoTema } from '@/types/database';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const store = useTemasStore();
const auth = useAuthStore();

const esNuevo = computed(() => !route.params.id);

const form = ref<{
  id: string;
  titulo: string;
  descripcion: string;
  contenido: string;
  fecha: string;
  orden: number;
  estado: EstadoTema;
}>({
  id: '',
  titulo: '',
  descripcion: '',
  contenido: '',
  fecha: '',
  orden: 0,
  estado: 'borrador',
});

const publicado = ref(false);
const archivos = ref<Archivo[]>([]);
const progresoSubida = ref(0);
const totalPendientes = ref(0);
const subidos = ref(0);

const guardando = ref(false);
const subiendo = ref(false);
const cancelando = ref(false);
const cargandoArchivos = ref(false);
const dialogoSubida = ref(false);
const confirmarArchivo = ref(false);
const confirmarTema = ref(false);
const borrandoArchivo = ref(false);
const borrandoTema = ref(false);
const archivoABorrar = ref<Archivo | null>(null);

const temaId = computed(() => (esNuevo.value ? null : form.value.id || null));

const reglaTitulo = (valor: string) => Boolean(valor?.trim()) || 'El título es obligatorio';

watch(publicado, (valor) => {
  form.value.estado = valor ? 'publicado' : 'borrador';
});

watch(
  () => form.value.estado,
  (estado) => {
    publicado.value = estado === 'publicado';
  },
);

function avisar(mensaje: string, tipo: 'positive' | 'negative' | 'info' = 'positive') {
  $q.notify({ message: mensaje, type: tipo, position: 'top', timeout: 3500 });
}

async function recargarArchivos() {
  if (!form.value.id) return;
  archivos.value = await listarArchivos(form.value.id);
}

async function cargar() {
  if (esNuevo.value) {
    archivos.value = [];
    return;
  }

  cargandoArchivos.value = true;
  try {
    const id = String(route.params.id);
    const { tema } = await store.cargarUno(id);

    if (!tema) {
      avisar('Ese tema ya no existe.', 'negative');
      await router.push('/admin');
      return;
    }

    form.value = {
      id: tema.id,
      titulo: tema.titulo,
      descripcion: tema.descripcion ?? '',
      contenido: tema.contenido ?? '',
      fecha: paraInputFecha(tema.fecha),
      orden: tema.orden,
      estado: tema.estado,
    };
    publicado.value = tema.estado === 'publicado';
    archivos.value = await listarArchivos(id);
  } catch (error) {
    avisar(mensajeDeError(error), 'negative');
  } finally {
    cargandoArchivos.value = false;
  }
}

async function guardar() {
  if (!form.value.titulo.trim()) {
    avisar('Ponle un título al tema.', 'negative');
    return;
  }

  guardando.value = true;
  try {
    const datos = {
      titulo: form.value.titulo.trim(),
      descripcion: form.value.descripcion.trim() || null,
      contenido: form.value.contenido.trim() || null,
      estado: form.value.estado,
      fecha: form.value.fecha || null,
      orden: Number.isFinite(form.value.orden) ? form.value.orden : 0,
    };

    if (esNuevo.value) {
      const tema = await store.crear(datos, auth.perfil?.id ?? null);
      form.value.id = tema.id;
      avisar('Tema creado. Ya puedes subirle los archivos.');
      await router.replace({
        name: 'tema-editar',
        params: { id: tema.id },
      });
    } else {
      await store.guardar(form.value.id, datos);
      avisar('Cambios guardados.');
      await recargarArchivos();
    }
  } catch (error) {
    avisar(mensajeDeError(error), 'negative');
  } finally {
    guardando.value = false;
  }
}

async function subir(pendientes: File[]) {
  if (!form.value.id) {
    avisar('Guarda el tema antes de subir archivos.', 'negative');
    return;
  }

  subiendo.value = true;
  dialogoSubida.value = false;
  totalPendientes.value = pendientes.length;
  subidos.value = 0;
  progresoSubida.value = 0;

  for (const [indice, archivo] of pendientes.entries()) {
    if (cancelando.value) break;

    const orden = archivos.value.length + indice;

    try {
      const registro = await subirArchivo(form.value.id, archivo, orden, auth.perfil?.id ?? null);
      archivos.value = [...archivos.value, registro];
      subidos.value += 1;
    } catch (error) {
      avisar(`No se pudo subir «${archivo.name}». ${mensajeDeError(error)}`, 'negative');
    } finally {
      progresoSubida.value = ((indice + 1) / pendientes.length) * 100;
    }
  }

  cancelando.value = false;
  subiendo.value = false;
  totalPendientes.value = 0;

  if (subidos.value > 0) {
    const n = subidos.value;
    avisar(`${n} archivo${n === 1 ? '' : 's'} subido${n === 1 ? '' : 's'}.`);
  }
}

function cancelarSubida() {
  cancelando.value = true;
}

async function mover(indice: number, paso: number) {
  const destino = indice + paso;
  if (destino < 0 || destino >= archivos.value.length) return;

  const nuevaLista = [...archivos.value];
  const actual = nuevaLista[indice];
  const anterior = nuevaLista[destino];
  if (!actual || !anterior) return;
  nuevaLista[indice] = anterior;
  nuevaLista[destino] = actual;

  archivos.value = nuevaLista.map((archivo, posicion) => ({ ...archivo, orden: posicion }));

  try {
    await reordenarArchivos(archivos.value.map((a) => ({ id: a.id, orden: a.orden })));
  } catch (error) {
    avisar(mensajeDeError(error), 'negative');
    await recargarArchivos();
  }
}

function pedirBorradoArchivo(archivo: Archivo) {
  archivoABorrar.value = archivo;
  confirmarArchivo.value = true;
}

async function borrarArchivo() {
  if (!archivoABorrar.value) return;

  borrandoArchivo.value = true;
  try {
    await borrarArchivoRemoto(archivoABorrar.value);
    archivos.value = archivos.value.filter((a) => a.id !== archivoABorrar.value?.id);
    confirmarArchivo.value = false;
    avisar('Archivo eliminado.', 'info');
  } catch (error) {
    avisar(mensajeDeError(error), 'negative');
  } finally {
    borrandoArchivo.value = false;
    archivoABorrar.value = null;
  }
}

function pedirBorradoTema() {
  confirmarTema.value = true;
}

async function borrarTema() {
  borrandoTema.value = true;
  try {
    await store.borrar(form.value.id);
    avisar('Tema eliminado.', 'info');
    await router.push('/admin');
  } catch (error) {
    avisar(mensajeDeError(error), 'negative');
  } finally {
    borrandoTema.value = false;
  }
}

onMounted(cargar);
</script>

<style scoped lang="scss">
.editor {
  padding-top: 28px;
  padding-bottom: 72px;
}

.editor__volver {
  margin-left: -10px;
  margin-bottom: 14px;
}

.editor__cabecera {
  margin-bottom: 22px;
}

.editor__titulo {
  font-size: 1.9rem;
  margin: 0 0 6px;
}

.editor__intro {
  margin: 0;
  color: $app-text-muted;
  font-size: 0.93rem;
  max-width: 56ch;
  line-height: 1.55;
}

.editor__aviso {
  margin-bottom: 18px;
}

.editor__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: start;
}

.editor__principal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor__bloque {
  padding: 22px;
}

.editor__bloque--pegado {
  position: sticky;
  top: 88px;
}

.editor__bloque-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.editor__bloque-titulo {
  font-family: var(--app-font-display);
  font-size: 1.14rem;
  font-weight: 600;
  margin: 0 0 4px;
}

.editor__bloque-ayuda {
  margin: 0;
  font-size: 0.85rem;
  color: $app-text-muted;
  line-height: 1.5;
}

.editor__estado {
  margin-top: 14px;
}

.editor__estado-ayuda {
  margin: 4px 0 0;
  font-size: 0.83rem;
  color: $app-text-muted;
  line-height: 1.5;
}

.editor__cargando {
  display: grid;
  place-items: center;
  padding: 40px 0;
}

.editor__subiendo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: $app-text-muted;
}

.editor__archivos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.editor__archivo {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 8px 10px 12px;
  border: 1px solid $app-border;
  border-radius: 13px;
  background: rgba(251, 249, 247, 0.6);
}

.editor__archivo-datos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.editor__archivo-nombre {
  font-size: 0.9rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor__archivo-meta {
  font-size: 0.78rem;
  color: $app-text-muted;
}

.editor__archivo-acciones {
  display: flex;
  flex: none;
  gap: 0;
}

.subida-dialog {
  width: 100%;
  max-width: 480px;
}

.subida-dialog__titulo {
  font-family: var(--app-font-display);
  font-size: 1.16rem;
  font-weight: 600;
  margin: 0 0 4px;
}

.subida-dialog__ayuda {
  margin: 0;
  font-size: 0.87rem;
  color: $app-text-muted;
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

@media (max-width: 1023px) {
  .editor__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .editor__bloque--pegado {
    position: static;
  }
}
</style>
