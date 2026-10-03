/**
 * Variables propias de la app. Quasar expone al navegador las variables del
 * archivo `.env` que empiezan por `VITE_`.
 *
 * @see https://quasar.dev/quasar-cli-vite/handling-import-meta-env
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
