# Confirmación 2026 — Materiales de la catequesis

Aplicación web (SPA) para publicar los temas y materiales de la catequesis de
Confirmación de la Parroquia Inmaculada Concepción Vinto.

- **Vue 3 + TypeScript + Quasar** en el frontend.
- **Supabase** (Postgres + Auth + Storage) como backend, con Row Level Security.
- Los temas publicados se leen **públicamente, sin cuenta**.
- Solo el catequista **principal** y los **editores invitados** pueden escribir.

## Requisitos

- Node.js **24 LTS** o **22.22+** (lo exige `@quasar/app-vite` 3).
- **pnpm** (`corepack enable` o `npm i -g pnpm`).

## Puesta en marcha

```bash
pnpm install
```

Copia `.env.example` a `.env` y rellena tus credenciales de Supabase:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://tu-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-public
```

> Solo va la clave **anon / public**. Nunca la `service_role`.

## Configurar Supabase (una sola vez)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y ejecuta, en este orden, los dos archivos de
   [`supabase/migrations/`](supabase/migrations):
   1. `0001_inicial.sql`: crea las tablas, las políticas RLS y el bucket
      `materiales`.
   2. `0002_vincular_ambos_sentidos.sql`: hace que el enlace catequista ↔
      cuenta funcione sin importar el orden en que se creen.
3. Ve a **Authentication → Sign In / Providers → Email** y **desactiva
   `Confirm email`**. El plan gratuito solo permite ~2 correos por hora, por eso
   las cuentas se activan directamente con email + contraseña.
4. En **Project Settings → API**, copia `Project URL` y la clave `anon public`
   a tu archivo `.env`.
5. Crea al catequista **principal**: al final del archivo SQL hay un `insert`
   comentado. Reemplaza el correo y el nombre, descoméntalo y ejecútalo.

A partir de ahí, ese usuario puede entrar en `/entrar`, crear su cuenta
(quedará vinculado automáticamente por su email) y empezar a gestionar temas y
archivos.

### Principal, editores y `/admin/catequistas`

Hay que separar dos cosas que se confunden fácil:

- **El catequista principal se crea a mano en SQL**, con el `insert` del final
  de `0001_inicial.sql`. No se puede crear desde la interfaz: para entrar a
  `/admin` la app exige que ya seas principal (huevo y gallina).
- **`/admin/catequistas` es solo para editores.** Ahí el principal, ya con
  acceso, agrega a los demás por email y nombre. Invitar **no envía ningún
  correo**; el editor debe registrarse en `/entrar` con ese mismo email.
- La **contraseña no está en la base de datos**: la elige cada persona al
  registrarse (mínimo 6 caracteres). Si se olvida, se restablece con «Olvidé mi
  contraseña» o desde **Authentication → Users** en Supabase.

### Cómo funciona el enlace de cuentas

- Si la fila `catequistas` se crea **antes** de que la persona se registre, el
  trigger `vincular_catequista()` la enlaza al crear la cuenta en `auth.users`.
- Si la cuenta **ya existía** y la fila se crea después (o quedó en
  `user_id = null`), la migración `0002` la enlaza al insertar la fila.
- Si el login funciona pero la app dice "no tiene permiso de catequista", revisa
  en **Table Editor → `catequistas`** que tu fila tenga `user_id` lleno.

### Problemas comunes

- **"Esta cuenta ya existe. Usa la pestaña «Entrar»."** La app ahora cambia sola
  a la pestaña «Entrar» y prellena el correo. Solo ingresa tu contraseña.
- **"Tu correo aún no está confirmado."** El registro ocurrió con `Confirm
email` activado. Confirma al usuario en **Authentication → Users** (o bórralo
  y regístrate de nuevo con `Confirm email` ya desactivado).
- **Entras, pero `/admin` te manda a "sin acceso".** La fila `catequistas`
  existe pero `user_id` está en `null`. Ejecuta la reparación de la migración
  `0002` o enlaza a mano:
  ```sql
  update public.catequistas c
     set user_id = u.id,
         aceptado_at = coalesce(c.aceptado_at, now())
    from auth.users u
   where lower(c.email) = lower(u.email)
     and lower(c.email) = lower('tu-correo@ejemplo.com')
     and c.user_id is null;
  ```

## Comandos

```bash
pnpm run dev        # desarrollo con recarga en caliente (puerto 9000)
pnpm run build      # build de producción -> dist/spa
pnpm run lint       # formatea (Prettier) y corrige (ESLint)
pnpm run lint:check # solo verifica
pnpm run typecheck  # vue-tsc --noEmit
```

## Estructura

```text
src/
  boot/         # restauración de la sesión de Supabase
  components/   # tarjetas, chips y visores reutilizables
  config/       # marca y límites de la app
  css/          # tema visual (paleta, tipografías)
  layouts/      # layout público y layout de administración
  pages/        # páginas públicas y /admin
  router/       # rutas y guardas de autenticación
  services/     # acceso a Supabase (temas, archivos, catequistas)
  stores/       # estado con Pinia
  types/        # tipos de dominio y de la base de datos
supabase/
  migrations/   # esquema SQL de la base de datos
```

## Aplicar cambios al esquema

Edita el SQL en `supabase/migrations/` y vuelve a ejecutarlo en el SQL Editor.
Los `insert`/`create policy` usan `if not exists` / `drop ... if exists` para
poder reaplicarse sin errores.
