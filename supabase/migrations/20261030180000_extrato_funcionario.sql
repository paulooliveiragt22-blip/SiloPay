create view public.v_extrato_funcionario
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
  l.id as ledger_id
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
  null::uuid
from public.gestor_current_membership() m
join public.receipts r on r.company_id = m.company_id
where m.role = 'admin';

revoke all on table public.v_extrato_funcionario from public, anon, authenticated;
grant select on table public.v_extrato_funcionario to authenticated;

comment on view public.v_extrato_funcionario is
  'Extrato da subconta para o admin da mesma empresa. Mesmas colunas de v_meu_extrato.';
