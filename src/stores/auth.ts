import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { User } from '@supabase/supabase-js';
import { miCatecquista, soyCatequista, soyPrincipal } from '@/services/catequistas';
import { mensajeDeError, supabase, supabaseConfigurado } from '@/services/supabase';
import type { Catecquista } from '@/types/database';

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<User | null>(null);
  const perfil = ref<Catecquista | null>(null);
  const cargando = ref(true);
  const esCatequista = ref(false);
  const esPrincipal = ref(false);
  const errorSesion = ref<string | null>(null);

  const autenticado = computed(() => usuario.value !== null);

  async function cargarPerfil(): Promise<void> {
    perfil.value = null;
    esCatequista.value = false;
    esPrincipal.value = false;

    if (!usuario.value) return;

    try {
      perfil.value = await miCatecquista();
      esCatequista.value = Boolean(perfil.value) || (await soyCatequista());
      esPrincipal.value = await soyPrincipal();
    } catch (error) {
      // Un error aquí solo afecta a la interfaz; la RLS sigue siendo la
      // autoridad y ya habrá bloqueado cualquier escritura.
      errorSesion.value = mensajeDeError(error);
    }
  }

  /** Restaura la sesión guardada. Se llama una vez al arrancar la app. */
  async function iniciar(): Promise<void> {
    if (!supabaseConfigurado) {
      cargando.value = false;
      return;
    }

    cargando.value = true;
    try {
      const { data } = await supabase.auth.getSession();
      usuario.value = data.session?.user ?? null;
      await cargarPerfil();
    } finally {
      cargando.value = false;
    }

    supabase.auth.onAuthStateChange((_evento, session) => {
      usuario.value = session?.user ?? null;
      void cargarPerfil();
    });
  }

  async function entrar(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    usuario.value = data.user;
    await cargarPerfil();
  }

  /**
   * Alta de cuenta para un catequista invitado. El trigger en `auth.users`
   * enlaza la cuenta con su fila en `catequistas`.
   */
  async function registrarse(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    usuario.value = data.user;
    await cargarPerfil();
  }

  async function salir(): Promise<void> {
    await supabase.auth.signOut();
    usuario.value = null;
    perfil.value = null;
    esCatequista.value = false;
    esPrincipal.value = false;
  }

  async function recuperarPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${window.location.pathname}#/entrar`,
    });
    if (error) throw error;
  }

  return {
    usuario,
    perfil,
    cargando,
    autenticado,
    esCatequista,
    esPrincipal,
    errorSesion,
    iniciar,
    entrar,
    registrarse,
    salir,
    recuperarPassword,
  };
});
