import { defineBoot } from '#q-app';
import { useAuthStore } from '@/stores/auth';

/**
 * Restaura la sesión de Supabase antes de que el router resuelva la primera
 * ruta, para que las guardas de `/admin` tengan una respuesta fiable.
 */
export default defineBoot(async ({ store }) => {
  const auth = useAuthStore(store);
  await auth.iniciar();
});
