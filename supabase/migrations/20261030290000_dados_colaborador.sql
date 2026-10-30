-- A ficha lê nome, CPF, Pix e o e-mail já gravado.
-- Aplicar somente em https://rbgrdujuuriabpekltis.supabase.co

create or replace function public.gestor_email_colaborador(p_employee_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.employees e
  join public.gestor_current_membership() m
    on m.company_id = e.company_id
   and m.role = 'admin'
  join auth.users u on u.id = e.user_id
  where e.id = p_employee_id;
$$;

revoke all on function public.gestor_email_colaborador(uuid) from public, anon, authenticated;
grant execute on function public.gestor_email_colaborador(uuid) to authenticated;

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
  (e.user_id is not null) as vinculado,
  public.gestor_senha_temporaria(e.id) as senha_temporaria,
  e.job_title,
  e.phone,
  e.postal_code,
  e.street,
  e.street_number,
  e.address_complement,
  e.district,
  e.city,
  e.state,
  e.hired_on,
  e.cpf,
  e.pix_key_type,
  e.pix_key,
  public.gestor_email_colaborador(e.id) as email
from public.gestor_current_membership() m
join public.employees e on e.company_id = m.company_id
join lateral public.gestor_saldos(e.id) s on true
where m.role = 'admin';

notify pgrst, 'reload schema';
