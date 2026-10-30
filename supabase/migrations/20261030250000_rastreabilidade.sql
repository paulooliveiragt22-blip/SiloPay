-- Histórico de comprovantes e o tipo do envio no extrato da empresa.
-- Não apaga comprovante. Não recalcula saldo.

create view public.v_comprovantes
with (security_invoker = true) as
select
  r.id as receipt_id,
  r.company_id,
  r.employee_id,
  e.name as employee_name,
  r.amount_claimed_cents,
  r.amount_approved_cents,
  r.status,
  r.category,
  r.storage_path,
  r.place_note,
  r.submitted_at,
  r.reviewed_at
from public.gestor_current_membership() m
join public.receipts r on r.company_id = m.company_id
join public.employees e on e.id = r.employee_id
where m.role = 'admin';

revoke all on table public.v_comprovantes from public, anon, authenticated;
grant select on table public.v_comprovantes to authenticated;

comment on view public.v_comprovantes is
  'Todos os comprovantes da empresa para o admin, em qualquer estado.';

create or replace view public.v_extrato_empresa
with (security_invoker = false) as
select
  c.id,
  c.company_id,
  c.kind,
  c.amount_cents,
  c.created_at,
  coalesce(envio_emp.name, devolucao_emp.name) as employee_name,
  o.kind::text as envio_kind
from public.gestor_current_membership() m
join public.company_cash_entries c on c.company_id = m.company_id
left join public.payment_orders o on o.id = c.payment_order_id
left join public.employees envio_emp on envio_emp.id = o.employee_id
left join public.return_charges rc on rc.id = c.return_charge_id
left join public.employees devolucao_emp on devolucao_emp.id = rc.employee_id
where m.role = 'admin';

create or replace view public.v_extrato_funcionario
with (security_invoker = true) as
select
  l.created_at as occurred_at,
  l.kind::text as kind,
  l.amount_cents,
  case
    when l.kind in ('adiantamento', 'reembolso') then 'credito'
    else 'debito'
  end as efeito,
  null::public.gestor_receipt_status as receipt_status,
  l.employee_id,
  l.company_id,
  l.receipt_id,
  l.id as ledger_id,
  null::text as storage_path,
  null::text as category,
  null::bigint as amount_approved_cents
from public.gestor_current_membership() m
join public.ledger_entries l on l.company_id = m.company_id
where m.role = 'admin'
union all
select
  r.submitted_at,
  'comprovante',
  r.amount_claimed_cents,
  'informativo',
  r.status,
  r.employee_id,
  r.company_id,
  r.id,
  null::uuid,
  r.storage_path,
  r.category::text,
  r.amount_approved_cents
from public.gestor_current_membership() m
join public.receipts r on r.company_id = m.company_id
where m.role = 'admin';

create or replace view public.v_meu_extrato
with (security_invoker = true) as
select
  l.created_at as occurred_at,
  l.kind::text as kind,
  l.amount_cents,
  case
    when l.kind in ('adiantamento', 'reembolso') then 'credito'
    else 'debito'
  end as efeito,
  null::public.gestor_receipt_status as receipt_status,
  l.employee_id,
  l.company_id,
  l.receipt_id,
  l.id as ledger_id,
  null::text as storage_path,
  null::text as category,
  null::bigint as amount_approved_cents
from public.gestor_current_membership() m
join public.ledger_entries l on l.employee_id = m.employee_id
where m.role = 'funcionario'
  and not public.gestor_senha_bloqueada()
union all
select
  r.submitted_at,
  'comprovante',
  r.amount_claimed_cents,
  'informativo',
  r.status,
  r.employee_id,
  r.company_id,
  r.id,
  null::uuid,
  r.storage_path,
  r.category::text,
  r.amount_approved_cents
from public.gestor_current_membership() m
join public.receipts r on r.employee_id = m.employee_id
where m.role = 'funcionario'
  and not public.gestor_senha_bloqueada();
