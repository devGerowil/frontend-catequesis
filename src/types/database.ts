/**
 * Tipos de las tablas de la aplicación.
 * Reflejan `supabase/migrations/0001_inicial.sql`.
 * Si generas tipos con la CLI de Supabase, reemplaza este archivo por el
 * resultado de `supabase gen types typescript --project-id <id>`.
 */

export type EstadoTema = 'borrador' | 'publicado';

export type RolCatequista = 'principal' | 'editor';

export interface Catecquista {
  id: string;
  email: string;
  nombre: string | null;
  rol: RolCatequista;
  user_id: string | null;
  invitado_por: string | null;
  invitado_at: string;
  aceptado_at: string | null;
}

export interface Tema {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido: string | null;
  estado: EstadoTema;
  orden: number;
  fecha: string | null;
  creado_por: string | null;
  creado_at: string;
  actualizado_at: string;
  archivos?: Archivo[] | null;
  total_archivos?: number | null;
}

export interface Archivo {
  id: string;
  tema_id: string;
  nombre: string;
  ruta: string;
  mime: string | null;
  tamano: number | null;
  orden: number;
  subido_por: string | null;
  creado_at: string;
}

/** Datos que acepta la creación/edición de un tema. */
export type TemaInput = Pick<
  Tema,
  'titulo' | 'descripcion' | 'contenido' | 'estado' | 'orden' | 'fecha'
>;

export type TemaUpdate = Partial<TemaInput>;

export type ArchivoInput = Pick<
  Archivo,
  'tema_id' | 'nombre' | 'ruta' | 'mime' | 'tamano' | 'orden'
>;
