-- =============================================================================
--  Enlace de catequistas en ambos sentidos
--
--  La migración 0001 enlaza `catequistas.user_id` solo cuando se crea un
--  usuario en `auth.users` (trigger `vincular_catequista`). Eso obliga a
--  invitar/crear la fila ANTES de que la persona se registre.
--
--  Este archivo agrega el sentido inverso: si la fila en `catequistas` se crea
--  (o se le cambia el email) DESPUÉS de que la cuenta ya exista, se enlaza
--  igual. Así el orden deja de importar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Función: buscar un usuario existente en auth.users con el mismo email
-- -----------------------------------------------------------------------------
create or replace function public.vincular_usuario_existente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    update public.catequistas c
       set user_id = u.id,
           aceptado_at = coalesce(c.aceptado_at, now())
      from auth.users u
     where c.id = new.id
       and c.user_id is null
       and lower(u.email) = lower(new.email);
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Trigger (no recursivo: la función actualiza `user_id`, no `email`)
-- -----------------------------------------------------------------------------
drop trigger if exists trg_vincular_usuario_existente on public.catequistas;
create trigger trg_vincular_usuario_existente
  after insert or update of email on public.catequistas
  for each row
  when (new.user_id is null)
  execute function public.vincular_usuario_existente();

-- =============================================================================
--  Reparación puntual: enlaza filas ya existentes que quedaron en `user_id = null`
--  y cuyo email ya tiene cuenta en auth.users. Puede reaplicarse sin problema.
-- =============================================================================
update public.catequistas c
   set user_id = u.id,
       aceptado_at = coalesce(c.aceptado_at, now())
  from auth.users u
 where c.user_id is null
   and lower(c.email) = lower(u.email);
