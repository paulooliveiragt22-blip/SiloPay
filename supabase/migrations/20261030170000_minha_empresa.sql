create view public.v_minha_empresa
with (security_invoker = true) as
select
  c.id as company_id,
  c.name as company_name
from public.gestor_current_membership() m
join public.companies c on c.id = m.company_id;

revoke all on table public.v_minha_empresa from public, anon, authenticated;
grant select on table public.v_minha_empresa to authenticated;
