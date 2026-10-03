import { supabase } from './supabase';
import type { Catecquista, RolCatequista } from '@/types/database';

const CAMPOS = 'id, email, nombre, rol, user_id, invitado_por, invitado_at, aceptado_at';

/** ¿El usuario actual es catequista? (lectura permitida por la RLS propia). */
export async function soyCatequista(): Promise<boolean> {
  const { data, error } = await supabase.rpc('es_catequista');
  if (error) throw error;
  return Boolean(data);
}

/** ¿El usuario actual es el catequista principal? */
export async function soyPrincipal(): Promise<boolean> {
  const { data, error } = await supabase.rpc('es_principal');
  if (error) throw error;
  return Boolean(data);
}

/** Devuelve la fila de `catequistas` del usuario con sesión activa. */
export async function miCatecquista(): Promise<Catecquista | null> {
  const { data: sesion } = await supabase.auth.getSession();
  const userId = sesion?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('catequistas')
    .select(CAMPOS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Lista el equipo de catequistas. Solo el principal tiene permiso de lectura. */
export async function listarCatequistas(): Promise<Catecquista[]> {
  const { data, error } = await supabase
    .from('catequistas')
    .select(CAMPOS)
    .order('rol', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Invita a un catequista: crea la fila; él se enlaza al registrarse. */
export async function invitarCatequista(
  email: string,
  nombre: string,
  rol: RolCatequista,
  invitadoPor: string,
): Promise<Catecquista> {
  const { data, error } = await supabase
    .from('catequistas')
    .insert({ email, nombre, rol, invitado_por: invitadoPor })
    .select(CAMPOS)
    .single();

  if (error) throw error;
  return data;
}

export async function actualizarCatequista(
  id: string,
  cambios: Partial<Pick<Catecquista, 'nombre' | 'rol'>>,
): Promise<Catecquista> {
  const { data, error } = await supabase
    .from('catequistas')
    .update(cambios)
    .eq('id', id)
    .select(CAMPOS)
    .single();

  if (error) throw error;
  return data;
}

/** Elimina la invitación. Si la persona ya se había registrado, pierde el acceso. */
export async function eliminarInvitacion(id: string): Promise<void> {
  const { error } = await supabase.from('catequistas').delete().eq('id', id);
  if (error) throw error;
}
