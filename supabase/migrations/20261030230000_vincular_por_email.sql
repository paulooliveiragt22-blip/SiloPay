-- Vínculo pelo e-mail de uma conta que já existe. A ficha mostra só se há vínculo.

create or replace view public.v_subconta_funcionario
with (security_invoker = true) as
select
  e.id as employee_id,
  e.company_id,
  e.name as employee_name,
  e.status,
  s.transferido_cents,
  s.em_analise_cents,
  s.baixado_cents,
  s.saldo_cents,
  (e.user_id is not null) as vinculado
from public.gestor_current_membership() m
join public.employees e on e.company_id = m.company_id
join lateral public.gestor_saldos(e.id) s on true
where m.role = 'admin';

create or replace function public.vincular_funcionario_por_email(
  p_employee_id uuid,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_user_id uuid;
begin
  v_email := lower(btrim(p_email));
  if v_email is null
    or length(v_email) < 3
    or length(v_email) > 320
    or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Informe o e-mail da conta.' using errcode = '22023';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email;

  if v_user_id is null then
    raise exception 'Este e-mail ainda não tem conta. A pessoa precisa entrar uma vez antes do vínculo.'
      using errcode = '02000';
  end if;

  begin
    return public.vincular_funcionario(p_employee_id, v_user_id);
  exception
    when others then
      if sqlerrm = 'funcionario ja vinculado' then
        raise exception 'Este colaborador já tem conta vinculada.' using errcode = '42501';
      elsif sqlerrm = 'usuario ja vinculado a uma empresa' then
        raise exception 'Este e-mail já pertence a uma empresa.' using errcode = '42501';
      else
        raise;
      end if;
  end;
end;
$$;

revoke all on function public.vincular_funcionario_por_email(uuid, text) from public, anon, authenticated;
grant execute on function public.vincular_funcionario_por_email(uuid, text) to authenticated;

comment on function public.vincular_funcionario_por_email(uuid, text) is
  'Vincula o colaborador ao e-mail de uma conta que já existe. Não cria usuário.';
