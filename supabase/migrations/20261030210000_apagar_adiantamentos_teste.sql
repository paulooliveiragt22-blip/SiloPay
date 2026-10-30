-- Remove só os dois adiantamentos do lançamento de teste aposentado.
-- Eles não debitaram o saldo da empresa. O envio de R$ 5,00 permanece.
-- A trava de imutabilidade volta no fim. O app continua sem apagar lançamento.

alter table public.ledger_entries disable trigger ledger_entries_no_update;

delete from public.ledger_entries l
using public.payment_orders o
where l.payment_order_id = o.id
  and l.kind = 'adiantamento'
  and l.amount_cents in (1000, 200000)
  and o.idempotency_key in (
    '12558392-6fe8-49f1-adc6-015b4b74862f:1000',
    '12558392-6fe8-49f1-adc6-015b4b74862f:200000'
  )
  and not exists (
    select 1 from public.company_cash_entries c where c.payment_order_id = o.id
  );

delete from public.payment_orders o
where o.idempotency_key in (
  '12558392-6fe8-49f1-adc6-015b4b74862f:1000',
  '12558392-6fe8-49f1-adc6-015b4b74862f:200000'
)
and not exists (
  select 1 from public.ledger_entries l where l.payment_order_id = o.id
)
and not exists (
  select 1 from public.company_cash_entries c where c.payment_order_id = o.id
);

alter table public.ledger_entries enable trigger ledger_entries_no_update;
