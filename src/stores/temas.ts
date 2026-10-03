import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  cambiarEstado,
  crearTema,
  eliminarTema,
  listarTemas,
  obtenerTema,
  actualizarTema,
} from '@/services/temas';
import { listarArchivos } from '@/services/archivos';
import type { Archivo, EstadoTema, Tema, TemaInput, TemaUpdate } from '@/types/database';

export const useTemasStore = defineStore('temas', () => {
  const temas = ref<Tema[]>([]);
  const cargando = ref(false);
  const error = ref<string | null>(null);

  const publicados = computed(() => temas.value.filter((t) => t.estado === 'publicado'));
  const borradores = computed(() => temas.value.filter((t) => t.estado === 'borrador'));

  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      temas.value = await listarTemas();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'No se pudieron cargar los temas.';
    } finally {
      cargando.value = false;
    }
  }

  async function cargarUno(id: string): Promise<{ tema: Tema | null; archivos: Archivo[] }> {
    cargando.value = true;
    error.value = null;
    try {
      const tema = await obtenerTema(id);
      const archivos = tema ? await listarArchivos(id) : [];
      return { tema, archivos };
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'No se pudo cargar el tema.';
      throw e;
    } finally {
      cargando.value = false;
    }
  }

  async function crear(input: TemaInput, creadoPor: string | null): Promise<Tema> {
    const tema = await crearTema(input, creadoPor);
    temas.value = [...temas.value, tema].sort(porOrden);
    return tema;
  }

  async function guardar(id: string, cambios: TemaUpdate): Promise<Tema> {
    const tema = await actualizarTema(id, cambios);
    temas.value = temas.value.map((t) => (t.id === id ? { ...t, ...tema } : t)).sort(porOrden);
    return tema;
  }

  async function alternarEstado(tema: Tema): Promise<void> {
    const nuevo: EstadoTema = tema.estado === 'publicado' ? 'borrador' : 'publicado';
    const actualizado = await cambiarEstado(tema.id, nuevo);
    temas.value = temas.value
      .map((t) => (t.id === tema.id ? { ...t, ...actualizado } : t))
      .sort(porOrden);
  }

  async function borrar(id: string): Promise<void> {
    await eliminarTema(id);
    temas.value = temas.value.filter((t) => t.id !== id);
  }

  function porOrden(a: Tema, b: Tema): number {
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.titulo.localeCompare(b.titulo, 'es');
  }

  return {
    temas,
    cargando,
    error,
    publicados,
    borradores,
    cargar,
    cargarUno,
    crear,
    guardar,
    alternarEstado,
    borrar,
  };
});
