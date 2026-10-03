import { supabase } from './supabase';
import type { Tema, TemaInput, TemaUpdate } from '@/types/database';

const CAMPOS =
  'id, titulo, descripcion, contenido, estado, orden, fecha, creado_por, creado_at, actualizado_at';

/** Lista los temas visibles para el usuario actual (la RLS ya filtra borradores). */
export async function listarTemas(): Promise<Tema[]> {
  const { data, error } = await supabase
    .from('temas')
    .select(`${CAMPOS}, archivos(count)`)
    .order('orden', { ascending: true })
    .order('titulo', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(({ archivos, ...fila }) => ({
    ...fila,
    total_archivos: archivos?.[0]?.count ?? 0,
  }));
}

/** Obtiene un tema por id, o `null` si no existe o no es visible. */
export async function obtenerTema(id: string): Promise<Tema | null> {
  const { data, error } = await supabase.from('temas').select(CAMPOS).eq('id', id).maybeSingle();

  if (error) throw error;
  return data;
}

export async function crearTema(input: TemaInput, creadoPor: string | null): Promise<Tema> {
  const { data, error } = await supabase
    .from('temas')
    .insert({ ...input, creado_por: creadoPor })
    .select(CAMPOS)
    .single();

  if (error) throw error;
  return data;
}

export async function actualizarTema(id: string, cambios: TemaUpdate): Promise<Tema> {
  const { data, error } = await supabase
    .from('temas')
    .update(cambios)
    .eq('id', id)
    .select(CAMPOS)
    .single();

  if (error) throw error;
  return data;
}

export async function eliminarTema(id: string): Promise<void> {
  const { error } = await supabase.from('temas').delete().eq('id', id);
  if (error) throw error;
}

export async function cambiarEstado(id: string, estado: Tema['estado']): Promise<Tema> {
  return actualizarTema(id, { estado });
}
