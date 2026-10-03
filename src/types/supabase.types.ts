/**
 * Tipos de la base de datos para el cliente de Supabase.
 * Espejo manual de `supabase/migrations/0001_inicial.sql`.
 *
 * Cuando conectes tu proyecto real puedes regenerar esto con:
 *   npx supabase gen types typescript --project-id <tu-project-ref> > src/types/supabase.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      catequistas: {
        Row: {
          aceptado_at: string | null;
          email: string;
          id: string;
          invitado_at: string;
          invitado_por: string | null;
          nombre: string | null;
          rol: 'editor' | 'principal';
          user_id: string | null;
        };
        Insert: {
          aceptado_at?: string | null;
          email: string;
          id?: string;
          invitado_at?: string;
          invitado_por?: string | null;
          nombre?: string | null;
          rol?: 'editor' | 'principal';
          user_id?: string | null;
        };
        Update: {
          aceptado_at?: string | null;
          email?: string;
          id?: string;
          invitado_at?: string;
          invitado_por?: string | null;
          nombre?: string | null;
          rol?: 'editor' | 'principal';
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'catequistas_invitado_por_fkey';
            columns: ['invitado_por'];
            isOneToOne: false;
            referencedRelation: 'catequistas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'catequistas_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      temas: {
        Row: {
          actualizado_at: string;
          contenido: string | null;
          creado_at: string;
          creado_por: string | null;
          descripcion: string | null;
          estado: 'borrador' | 'publicado';
          fecha: string | null;
          id: string;
          orden: number;
          titulo: string;
        };
        Insert: {
          actualizado_at?: string;
          contenido?: string | null;
          creado_at?: string;
          creado_por?: string | null;
          descripcion?: string | null;
          estado?: 'borrador' | 'publicado';
          fecha?: string | null;
          id?: string;
          orden?: number;
          titulo: string;
        };
        Update: {
          actualizado_at?: string;
          contenido?: string | null;
          creado_at?: string;
          creado_por?: string | null;
          descripcion?: string | null;
          estado?: 'borrador' | 'publicado';
          fecha?: string | null;
          id?: string;
          orden?: number;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'temas_creado_por_fkey';
            columns: ['creado_por'];
            isOneToOne: false;
            referencedRelation: 'catequistas';
            referencedColumns: ['id'];
          },
        ];
      };
      archivos: {
        Row: {
          creado_at: string;
          id: string;
          mime: string | null;
          nombre: string;
          orden: number;
          ruta: string;
          subido_por: string | null;
          tamano: number | null;
          tema_id: string;
        };
        Insert: {
          creado_at?: string;
          id?: string;
          mime?: string | null;
          nombre: string;
          orden?: number;
          ruta: string;
          subido_por?: string | null;
          tamano?: number | null;
          tema_id: string;
        };
        Update: {
          creado_at?: string;
          id?: string;
          mime?: string | null;
          nombre?: string;
          orden?: number;
          ruta?: string;
          subido_por?: string | null;
          tamano?: number | null;
          tema_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'archivos_subido_por_fkey';
            columns: ['subido_por'];
            isOneToOne: false;
            referencedRelation: 'catequistas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'archivos_tema_id_fkey';
            columns: ['tema_id'];
            isOneToOne: false;
            referencedRelation: 'temas';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      es_catequista: { Args: Record<never, never>; Returns: boolean };
      es_principal: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

export type Tablas = Database['public']['Tables'];
