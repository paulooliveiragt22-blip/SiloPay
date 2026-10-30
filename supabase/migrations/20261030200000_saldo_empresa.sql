-- Saldo da empresa: entrada manual menos o que foi enviado ao colaborador.
-- O envio debita a empresa e credita a subconta na mesma transação.

create table public.company_cash_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  kind text not null check (kind in ('entrada', 'envio')),
  amount_cents bigint not null check (amount_cents > 0),
  payment_order_id uuid unique references public.payment_orders (id),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint company_cash_entries_company_idempotency_unique unique (company_id, idempotency_key),
  constraint company_cash_entries_origin check (
    (kind = 'entrada' and payment_order_id is null)
    or (kind = 'envio' and payment_order_id is not null)
  )
);

create index company_cash_entries_company_id_idx on public.company_cash_entries (company_id);

create trigger company_cash_entries_no_update
before update or delete on public.company_cash_entries
for each row execute function public.gestor_ledger_immutable();

alter table public.company_cash_entries enable row level security;

revoke all on table public.company_cash_entries from public, anon, authenticated;

comment on table public.company_cash_entries is
  'Caixa da empresa. entrada aumenta o saldo; envio diminui e referencia a ordem do colaborador.';

create view public.v_saldo_empresa
with (security_invoker = false) as
select
  m.company_id,
  coalesce(sum(c.amount_cents) filter (where c.kind = 'entrada'), 0)::bigint as entradas_cents,
  coalesce(sum(c.amount_cents) filter (where c.kind = 'envio'), 0)::bigint as enviados_cents,
  (
    coalesce(sum(c.amount_cents) filter (where c.kind = 'entrada'), 0)
    - coalesce(sum(c.amount_cents) filter (where c.kind = 'envio'), 0)
  )::bigint as saldo_cents
from public.gestor_current_membership() m
left join public.company_cash_entries c on c.company_id = m.company_id
where m.role = 'admin'
group by m.company_id;

create view public.v_extrato_empresa
with (security_invoker = false) as
select
  c.id,
  c.company_id,
  c.kind,
  c.amount_cents,
  c.created_at,
  e.name as employee_name
from public.gestor_current_membership() m
join public.company_cash_entries c on c.company_id = m.company_id
left join public.payment_orders o on o.id = c.payment_order_id
left join public.employees e on e.id = o.employee_id
where m.role = 'admin';

revoke all on table public.v_saldo_empresa from public, anon, authenticated;
revoke all on table public.v_extrato_empresa from public, anon, authenticated;
grant select on table public.v_saldo_empresa to authenticated;
grant select on table public.v_extrato_empresa to authenticated;

comment on view public.v_saldo_empresa is
  'Saldo da empresa para o admin. entradas manuais menos envios aos colaboradores.';

create or replace function public.adicionar_saldo_empresa(
  p_amount_cents bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_key text;
  v_existing uuid;
  v_saldo bigint;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin lanca saldo' using errcode = '42501';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'valor deve ser maior que zero' using errcode = '22023';
  end if;

  v_key := btrim(p_idempotency_key);
  if v_key is null or v_key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'idempotencia invalida' using errcode = '22023';
  end if;

  perform 1 from public.companies where id = v_company_id for update;

  select id into v_existing
  from public.company_cash_entries
  where company_id = v_company_id
    and idempotency_key = v_key;

  if v_existing is not null then
    select
      coalesce(sum(amount_cents) filter (where kind = 'entrada'), 0)
      - coalesce(sum(amount_cents) filter (where kind = 'envio'), 0)
    into v_saldo
    from public.company_cash_entries
    where company_id = v_company_id;

    return jsonb_build_object(
      'company_id', v_company_id,
      'amount_cents', p_amount_cents,
      'saldo_cents', v_saldo,
      'idempotent', true
    );
  end if;

  insert into public.company_cash_entries (company_id, kind, amount_cents, idempotency_key)
  values (v_company_id, 'entrada', p_amount_cents, v_key);

  select
    coalesce(sum(amount_cents) filter (where kind = 'entrada'), 0)
    - coalesce(sum(amount_cents) filter (where kind = 'envio'), 0)
  into v_saldo
  from public.company_cash_entries
  where company_id = v_company_id;

  return jsonb_build_object(
    'company_id', v_company_id,
    'amount_cents', p_amount_cents,
    'saldo_cents', v_saldo,
    'idempotent', false
  );
exception
  when unique_violation then
    select
      coalesce(sum(amount_cents) filter (where kind = 'entrada'), 0)
      - coalesce(sum(amount_cents) filter (where kind = 'envio'), 0)
    into v_saldo
    from public.company_cash_entries
    where company_id = v_company_id;

    return jsonb_build_object(
      'company_id', v_company_id,
      'amount_cents', p_amount_cents,
      'saldo_cents', v_saldo,
      'idempotent', true
    );
end;
$$;

create or replace function public.enviar_saldo_colaborador(
  p_employee_id uuid,
  p_kind text,
  p_amount_cents bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_key text;
  v_saldo bigint;
  v_existing_id uuid;
  v_existing_status public.gestor_payment_status;
  v_order_id uuid;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin transfere' using errcode = '42501';
  end if;

  if p_kind is distinct from 'adiantamento' and p_kind is distinct from 'reembolso' then
    raise exception 'tipo de envio invalido' using errcode = '22023';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'valor deve ser maior que zero' using errcode = '22023';
  end if;

  v_key := btrim(p_idempotency_key);
  if v_key is null or v_key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'idempotencia invalida' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.employees
    where id = p_employee_id
      and company_id = v_company_id
      and status = 'ativo'
  ) then
    raise exception 'funcionario inativo ou de outra empresa' using errcode = '02000';
  end if;

  perform 1 from public.companies where id = v_company_id for update;

  select id, status into v_existing_id, v_existing_status
  from public.payment_orders
  where company_id = v_company_id
    and idempotency_key = v_key;

  if v_existing_id is not null then
    return jsonb_build_object(
      'payment_order_id', v_existing_id,
      'status', v_existing_status,
      'idempotent', true
    );
  end if;

  select
    coalesce(sum(amount_cents) filter (where kind = 'entrada'), 0)
    - coalesce(sum(amount_cents) filter (where kind = 'envio'), 0)
  into v_saldo
  from public.company_cash_entries
  where company_id = v_company_id;

  if p_amount_cents > v_saldo then
    raise exception 'O saldo da empresa não cobre este valor.' using errcode = 'P0001';
  end if;

  v_order_id := gen_random_uuid();

  insert into public.payment_orders (
    id,
    company_id,
    employee_id,
    kind,
    amount_cents,
    status,
    external_reference,
    idempotency_key
  )
  values (
    v_order_id,
    v_company_id,
    p_employee_id,
    p_kind::public.gestor_payment_kind,
    p_amount_cents,
    'confirmada',
    v_order_id::text,
    v_key
  );

  insert into public.ledger_entries (
    company_id,
    employee_id,
    kind,
    amount_cents,
    payment_order_id
  )
  values (
    v_company_id,
    p_employee_id,
    p_kind::text::public.gestor_ledger_kind,
    p_amount_cents,
    v_order_id
  );

  insert into public.company_cash_entries (
    company_id,
    kind,
    amount_cents,
    payment_order_id,
    idempotency_key
  )
  values (
    v_company_id,
    'envio',
    p_amount_cents,
    v_order_id,
    v_key
  );

  return jsonb_build_object(
    'payment_order_id', v_order_id,
    'status', 'confirmada',
    'idempotent', false
  );
exception
  when unique_violation then
    select id, status into v_existing_id, v_existing_status
    from public.payment_orders
    where company_id = v_company_id
      and idempotency_key = v_key;

    if v_existing_id is null then
      raise;
    end if;

    return jsonb_build_object(
      'payment_order_id', v_existing_id,
      'status', v_existing_status,
      'idempotent', true
    );
end;
$$;

revoke all on function public.adicionar_saldo_empresa(bigint, text) from public, anon, authenticated;
revoke all on function public.enviar_saldo_colaborador(uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function public.adicionar_saldo_empresa(bigint, text) to authenticated;
grant execute on function public.enviar_saldo_colaborador(uuid, text, bigint, text) to authenticated;

revoke all on function public.registrar_adiantamento_teste(uuid, bigint, text) from public, anon, authenticated;

comment on function public.adicionar_saldo_empresa(bigint, text) is
  'Entrada manual no saldo da empresa. Nao credita colaborador.';

comment on function public.enviar_saldo_colaborador(uuid, text, bigint, text) is
  'Debita o saldo da empresa e credita a subconta. Recusa se o saldo nao cobre.';

comment on function public.registrar_adiantamento_teste(uuid, bigint, text) is
  'Aposentada. O envio autenticado sai de enviar_saldo_colaborador.';
