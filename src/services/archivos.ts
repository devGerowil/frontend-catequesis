import { STORAGE_BUCKET } from '@/config/app';
import { supabase } from './supabase';
import type { Archivo, ArchivoInput } from '@/types/database';

const CAMPOS = 'id, tema_id, nombre, ruta, mime, tamano, orden, subido_por, creado_at';

/** URL pública de un archivo (el bucket `materiales` es público para lectura). */
export function urlPublica(ruta: string): string {
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(ruta).data.publicUrl;
}

export async function listarArchivos(temaId: string): Promise<Archivo[]> {
  const { data, error } = await supabase
    .from('archivos')
    .select(CAMPOS)
    .eq('tema_id', temaId)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Sube el archivo a Storage y registra la fila en `archivos`.
 * Sube primero el binario y, si el registro falla, elimina el archivo huérfano.
 */
export async function subirArchivo(
  temaId: string,
  archivo: File,
  orden: number,
  subidoPor: string | null,
): Promise<Archivo> {
  const nombreLimpio = archivo.name.replace(/[^\w.-]+/g, '_');
  const ruta = `${temaId}/${Date.now()}-${nombreLimpio}`;

  const { error: errorSubida } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(ruta, archivo, { cacheControl: '3600', upsert: false });

  if (errorSubida) throw errorSubida;

  const registro: ArchivoInput = {
    tema_id: temaId,
    nombre: archivo.name,
    ruta,
    mime: archivo.type || null,
    tamano: archivo.size,
    orden,
  };

  const { data, error } = await supabase
    .from('archivos')
    .insert({ ...registro, subido_por: subidoPor })
    .select(CAMPOS)
    .single();

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([ruta]);
    throw error;
  }

  return data;
}

/** Elimina la fila y también el binario en Storage. */
export async function eliminarArchivo(archivo: Archivo): Promise<void> {
  const { error } = await supabase.from('archivos').delete().eq('id', archivo.id);
  if (error) throw error;

  const { error: errorStorage } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([archivo.ruta]);

  if (errorStorage) throw errorStorage;
}

/** Guarda un nuevo orden para los archivos indicados. */
export async function reordenarArchivos(archivos: Pick<Archivo, 'id' | 'orden'>[]): Promise<void> {
  const resultados = await Promise.all(
    archivos.map(({ id, orden }) => supabase.from('archivos').update({ orden }).eq('id', id)),
  );

  const fallo = resultados.find((resultado) => resultado.error);
  if (fallo?.error) throw fallo.error;
}
