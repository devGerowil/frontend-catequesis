import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.types';

/**
 * Solo se expone la `anon` key: los permisos reales los decide la RLS de
 * Postgres, nunca el frontend.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anonKey);

export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? 'http://localhost',
  anonKey ?? 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

/** Traduce los errores de Supabase a un mensaje legible en español. */
export function mensajeDeError(
  error: unknown,
  porDefecto = 'Ocurrió un error. Intenta de nuevo.',
): string {
  if (!error) return porDefecto;

  let mensaje = porDefecto;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    mensaje = String(error.message);
  } else if (typeof error === 'string') {
    mensaje = error;
  }

  if (/row-level security/i.test(mensaje)) {
    return 'No tienes permiso para realizar esta acción.';
  }
  if (/duplicate key/i.test(mensaje)) {
    return 'Ya existe un registro con esos datos.';
  }
  if (/Invalid login credentials/i.test(mensaje)) {
    return 'El correo o la contraseña son incorrectos.';
  }
  if (/User already registered/i.test(mensaje)) {
    return 'Esta cuenta ya existe. Usa la pestaña «Entrar».';
  }
  if (/Password should be at least/i.test(mensaje)) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (/Email not confirmed/i.test(mensaje)) {
    return 'Tu correo aún no está confirmado.';
  }
  if (/rate limit|too many/i.test(mensaje)) {
    return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
  }
  if (/Failed to fetch|NetworkError/i.test(mensaje)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
  }

  return mensaje || porDefecto;
}
