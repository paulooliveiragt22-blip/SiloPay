-- Gestor Agro. Aplicar somente no projeto rbgrdujuuriabpekltis.
-- Leitura nas views v_*. Mutação nas funções abaixo. Lançamento sem update.
-- registrar_adiantamento_teste sai quando o webhook TRANSFER_DONE existir.

create type public.gestor_member_role as enum ('admin', 'funcionario');
create type public.gestor_employee_status as enum ('ativo', 'inativo');
create type public.gestor_pix_key_type as enum ('cpf', 'cnpj', 'email', 'phone', 'evp');
create type public.gestor_payment_kind as enum ('adiantamento', 'reembolso');
create type public.gestor_payment_status as enum ('pendente', 'confirmada', 'falhou', 'cancelada');
create type public.gestor_ledger_kind as enum ('adiantamento', 'reembolso', 'baixa', 'devolucao');
create type public.gestor_receipt_status as enum ('em_analise', 'aprovado', 'parcial', 'recusado');
create type public.gestor_receipt_category as enum (
  'combustivel', 'alimentacao', 'pedagio', 'hospedagem',
  'manutencao', 'insumos', 'frete', 'outros'
);
create type public.gestor_charge_status as enum ('pendente', 'paga', 'cancelada', 'falhou');
create type public.gestor_asaas_environment as enum ('sandbox', 'producao');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text not null,
  status text not null default 'ativa' check (status in ('ativa', 'suspensa')),
  created_at timestamptz not null default now(),
  constraint companies_cnpj_digits check (cnpj ~ '^[0-9]{14}$'),
  constraint companies_cnpj_unique unique (cnpj)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  user_id uuid references auth.users (id),
  name text not null,
  cpf text not null,
  pix_key_type public.gestor_pix_key_type not null,
  pix_key text not null,
  status public.gestor_employee_status not null default 'ativo',
  created_at timestamptz not null default now(),
  constraint employees_cpf_digits check (cpf ~ '^[0-9]{11}$'),
  constraint employees_pix_key_present check (length(btrim(pix_key)) > 0),
  constraint employees_company_cpf_unique unique (company_id, cpf)
);

create unique index employees_user_id_unique
  on public.employees (user_id)
  where user_id is not null;

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  user_id uuid not null references auth.users (id),
  role public.gestor_member_role not null,
  employee_id uuid references public.employees (id),
  created_at timestamptz not null default now(),
  constraint memberships_user_unique unique (user_id),
  constraint memberships_role_employee check (
    (role = 'admin' and employee_id is null)
    or (role = 'funcionario' and employee_id is not null)
  )
);

create unique index memberships_employee_unique
  on public.memberships (employee_id)
  where employee_id is not null;

create table public.asaas_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id),
  wallet_id text,
  api_key_ciphertext bytea,
  environment public.gestor_asaas_environment not null default 'sandbox',
  status text not null default 'desconectada' check (status in ('desconectada', 'conectada')),
  created_at timestamptz not null default now()
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  employee_id uuid not null references public.employees (id),
  kind public.gestor_payment_kind not null,
  amount_cents bigint not null check (amount_cents > 0),
  status public.gestor_payment_status not null default 'pendente',
  asaas_transfer_id text,
  external_reference text not null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint payment_orders_asaas_transfer_unique unique (asaas_transfer_id),
  constraint payment_orders_external_reference_unique unique (external_reference),
  constraint payment_orders_company_idempotency_unique unique (company_id, idempotency_key)
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  employee_id uuid not null references public.employees (id),
  amount_claimed_cents bigint not null check (amount_claimed_cents > 0),
  amount_approved_cents bigint,
  status public.gestor_receipt_status not null default 'em_analise',
  category public.gestor_receipt_category not null,
  storage_path text not null,
  place_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  constraint receipts_storage_path_present check (length(btrim(storage_path)) > 0),
  constraint receipts_place_note_length check (place_note is null or length(place_note) <= 200),
  constraint receipts_review_consistency check (
    (status = 'em_analise' and amount_approved_cents is null and reviewed_at is null)
    or (status = 'recusado' and amount_approved_cents = 0 and reviewed_at is not null)
    or (status = 'aprovado' and amount_approved_cents = amount_claimed_cents and reviewed_at is not null)
    or (
      status = 'parcial'
      and amount_approved_cents > 0
      and amount_approved_cents < amount_claimed_cents
      and reviewed_at is not null
    )
  )
);

create table public.return_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  employee_id uuid not null references public.employees (id),
  amount_cents bigint not null check (amount_cents > 0),
  status public.gestor_charge_status not null default 'pendente',
  asaas_payment_id text,
  created_at timestamptz not null default now(),
  constraint return_charges_asaas_payment_unique unique (asaas_payment_id)
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  employee_id uuid not null references public.employees (id),
  kind public.gestor_ledger_kind not null,
  amount_cents bigint not null check (amount_cents > 0),
  payment_order_id uuid references public.payment_orders (id),
  receipt_id uuid references public.receipts (id),
  return_charge_id uuid references public.return_charges (id),
  created_at timestamptz not null default now(),
  constraint ledger_entries_one_origin check (
    num_nonnulls(payment_order_id, receipt_id, return_charge_id) = 1
  )
);

create index employees_company_id_idx on public.employees (company_id);
create index receipts_company_status_idx on public.receipts (company_id, status);
create index receipts_employee_id_idx on public.receipts (employee_id);
create index ledger_entries_employee_kind_idx on public.ledger_entries (employee_id, kind);
create index payment_orders_employee_id_idx on public.payment_orders (employee_id);

create or replace function public.gestor_ledger_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'lancamento imutavel';
end;
$$;

create trigger ledger_entries_no_update
before update or delete on public.ledger_entries
for each row execute function public.gestor_ledger_immutable();

create or replace function public.gestor_current_membership()
returns table (
  company_id uuid,
  role public.gestor_member_role,
  employee_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select m.company_id, m.role, m.employee_id
  from public.memberships m
  where m.user_id = auth.uid();
$$;

create or replace function public.gestor_saldos(p_employee_id uuid)
returns table (
  employee_id uuid,
  transferido_cents bigint,
  em_analise_cents bigint,
  baixado_cents bigint,
  saldo_cents bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.id,
    coalesce((
      select sum(l.amount_cents)
      from public.ledger_entries l
      where l.employee_id = e.id
        and l.kind in ('adiantamento', 'reembolso')
    ), 0)::bigint,
    coalesce((
      select sum(r.amount_claimed_cents)
      from public.receipts r
      where r.employee_id = e.id
        and r.status = 'em_analise'
    ), 0)::bigint,
    coalesce((
      select sum(l.amount_cents)
      from public.ledger_entries l
      where l.employee_id = e.id
        and l.kind = 'baixa'
    ), 0)::bigint,
    coalesce((
      select
        coalesce(sum(l.amount_cents) filter (where l.kind in ('adiantamento', 'reembolso')), 0)
        - coalesce(sum(l.amount_cents) filter (where l.kind = 'baixa'), 0)
        - coalesce(sum(l.amount_cents) filter (where l.kind = 'devolucao'), 0)
      from public.ledger_entries l
      where l.employee_id = e.id
    ), 0)::bigint
  from public.employees e
  where e.id = p_employee_id;
$$;

create or replace function public.criar_empresa(p_name text, p_cnpj text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_cnpj text := regexp_replace(coalesce(p_cnpj, ''), '[^0-9]', '', 'g');
begin
  if auth.uid() is null then
    raise exception 'sessao ausente' using errcode = '42501';
  end if;

  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'usuario ja vinculado a uma empresa' using errcode = '42501';
  end if;

  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'nome da empresa obrigatorio' using errcode = '22023';
  end if;

  if v_cnpj !~ '^[0-9]{14}$' then
    raise exception 'cnpj deve ter 14 digitos' using errcode = '22023';
  end if;

  insert into public.companies (name, cnpj)
  values (btrim(p_name), v_cnpj)
  returning id into v_company_id;

  insert into public.memberships (company_id, user_id, role)
  values (v_company_id, auth.uid(), 'admin');

  return jsonb_build_object('company_id', v_company_id);
end;
$$;

create or replace function public.cadastrar_funcionario(
  p_name text,
  p_cpf text,
  p_pix_key_type text,
  p_pix_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_employee_id uuid;
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  v_pix_type public.gestor_pix_key_type;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin cadastra funcionario' using errcode = '42501';
  end if;

  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'nome do funcionario obrigatorio' using errcode = '22023';
  end if;

  if v_cpf !~ '^[0-9]{11}$' then
    raise exception 'cpf deve ter 11 digitos' using errcode = '22023';
  end if;

  begin
    v_pix_type := p_pix_key_type::public.gestor_pix_key_type;
  exception
    when invalid_text_representation then
      raise exception 'tipo de chave pix invalido' using errcode = '22023';
  end;

  if p_pix_key is null or length(btrim(p_pix_key)) = 0 then
    raise exception 'chave pix obrigatoria' using errcode = '22023';
  end if;

  insert into public.employees (company_id, name, cpf, pix_key_type, pix_key)
  values (v_company_id, btrim(p_name), v_cpf, v_pix_type, btrim(p_pix_key))
  returning id into v_employee_id;

  return jsonb_build_object('employee_id', v_employee_id);
end;
$$;

create or replace function public.vincular_funcionario(
  p_employee_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_employee public.employees%rowtype;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin vincula funcionario' using errcode = '42501';
  end if;

  select * into v_employee
  from public.employees
  where id = p_employee_id
    and company_id = v_company_id
  for update;

  if not found then
    raise exception 'funcionario nao encontrado' using errcode = '02000';
  end if;

  if v_employee.user_id is not null then
    raise exception 'funcionario ja vinculado' using errcode = '42501';
  end if;

  if exists (select 1 from public.memberships where user_id = p_user_id) then
    raise exception 'usuario ja vinculado a uma empresa' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'usuario nao encontrado' using errcode = '02000';
  end if;

  update public.employees
  set user_id = p_user_id
  where id = v_employee.id;

  insert into public.memberships (company_id, user_id, role, employee_id)
  values (v_company_id, p_user_id, 'funcionario', v_employee.id);

  return jsonb_build_object('employee_id', v_employee.id, 'user_id', p_user_id);
end;
$$;

create or replace function public.submit_receipt(
  p_amount_cents bigint,
  p_category text,
  p_storage_path text,
  p_place_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_employee_id uuid;
  v_category public.gestor_receipt_category;
  v_receipt_id uuid;
begin
  select m.company_id, m.role, m.employee_id
  into v_company_id, v_role, v_employee_id
  from public.gestor_current_membership() m;

  if v_role is distinct from 'funcionario' or v_employee_id is null then
    raise exception 'somente funcionario envia comprovante' using errcode = '42501';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'valor informado deve ser maior que zero' using errcode = '22023';
  end if;

  if p_storage_path is null or length(btrim(p_storage_path)) = 0 or p_storage_path like '%..%' then
    raise exception 'foto obrigatoria' using errcode = '22023';
  end if;

  if p_place_note is not null and length(p_place_note) > 200 then
    raise exception 'observacao acima de 200 caracteres' using errcode = '22023';
  end if;

  begin
    v_category := p_category::public.gestor_receipt_category;
  exception
    when invalid_text_representation then
      raise exception 'categoria invalida' using errcode = '22023';
  end;

  insert into public.receipts (
    company_id,
    employee_id,
    amount_claimed_cents,
    category,
    storage_path,
    place_note
  )
  values (
    v_company_id,
    v_employee_id,
    p_amount_cents,
    v_category,
    btrim(p_storage_path),
    nullif(btrim(p_place_note), '')
  )
  returning id into v_receipt_id;

  return jsonb_build_object(
    'receipt_id', v_receipt_id,
    'status', 'em_analise'
  );
end;
$$;

create or replace function public.review_receipt(
  p_receipt_id uuid,
  p_approved_cents bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_receipt public.receipts%rowtype;
  v_status public.gestor_receipt_status;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin da baixa' using errcode = '42501';
  end if;

  if p_approved_cents is null or p_approved_cents < 0 then
    raise exception 'valor aceito invalido' using errcode = '22023';
  end if;

  select * into v_receipt
  from public.receipts
  where id = p_receipt_id
    and company_id = v_company_id
    and status = 'em_analise'
  for update;

  if not found then
    raise exception 'comprovante indisponivel para baixa' using errcode = '02000';
  end if;

  if p_approved_cents > v_receipt.amount_claimed_cents then
    raise exception 'valor aceito acima do informado' using errcode = '22023';
  end if;

  v_status := case
    when p_approved_cents = v_receipt.amount_claimed_cents then 'aprovado'::public.gestor_receipt_status
    when p_approved_cents = 0 then 'recusado'::public.gestor_receipt_status
    else 'parcial'::public.gestor_receipt_status
  end;

  update public.receipts
  set
    amount_approved_cents = p_approved_cents,
    status = v_status,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = v_receipt.id;

  if p_approved_cents > 0 then
    insert into public.ledger_entries (
      company_id,
      employee_id,
      kind,
      amount_cents,
      receipt_id
    )
    values (
      v_receipt.company_id,
      v_receipt.employee_id,
      'baixa',
      p_approved_cents,
      v_receipt.id
    );
  end if;

  return jsonb_build_object(
    'receipt_id', v_receipt.id,
    'status', v_status,
    'amount_approved_cents', p_approved_cents
  );
end;
$$;

-- Temporário. A fase da Asaas passa a criar a ordem pendente e o lançamento
-- só nasce no TRANSFER_DONE. Esta função já grava os dois, para a baixa ter saldo.
create or replace function public.registrar_adiantamento_teste(
  p_employee_id uuid,
  p_amount_cents bigint,
  p_idempotency_key text default null
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
  v_order_id uuid;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin transfere' using errcode = '42501';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'valor deve ser maior que zero' using errcode = '22023';
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

  v_key := coalesce(nullif(btrim(p_idempotency_key), ''), gen_random_uuid()::text);

  select id into v_existing
  from public.payment_orders
  where company_id = v_company_id
    and idempotency_key = v_key;

  if v_existing is not null then
    return jsonb_build_object('payment_order_id', v_existing, 'idempotent', true);
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
    'adiantamento',
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
    'adiantamento',
    p_amount_cents,
    v_order_id
  );

  return jsonb_build_object(
    'payment_order_id', v_order_id,
    'idempotent', false
  );
end;
$$;

alter table public.companies enable row level security;
alter table public.employees enable row level security;
alter table public.memberships enable row level security;
alter table public.asaas_accounts enable row level security;
alter table public.payment_orders enable row level security;
alter table public.receipts enable row level security;
alter table public.return_charges enable row level security;
alter table public.ledger_entries enable row level security;

create policy companies_select on public.companies
for select to authenticated
using (id = (select m.company_id from public.gestor_current_membership() m));

create policy employees_select on public.employees
for select to authenticated
using (
  company_id = (select m.company_id from public.gestor_current_membership() m)
  and (
    (select m.role from public.gestor_current_membership() m) = 'admin'
    or id = (select m.employee_id from public.gestor_current_membership() m)
  )
);

create policy memberships_select on public.memberships
for select to authenticated
using (
  company_id = (select m.company_id from public.gestor_current_membership() m)
  and (
    (select m.role from public.gestor_current_membership() m) = 'admin'
    or user_id = auth.uid()
  )
);

create policy payment_orders_select on public.payment_orders
for select to authenticated
using (
  company_id = (select m.company_id from public.gestor_current_membership() m)
  and (
    (select m.role from public.gestor_current_membership() m) = 'admin'
    or employee_id = (select m.employee_id from public.gestor_current_membership() m)
  )
);

create policy receipts_select on public.receipts
for select to authenticated
using (
  company_id = (select m.company_id from public.gestor_current_membership() m)
  and (
    (select m.role from public.gestor_current_membership() m) = 'admin'
    or employee_id = (select m.employee_id from public.gestor_current_membership() m)
  )
);

create policy return_charges_select on public.return_charges
for select to authenticated
using (
  company_id = (select m.company_id from public.gestor_current_membership() m)
  and (
    (select m.role from public.gestor_current_membership() m) = 'admin'
    or employee_id = (select m.employee_id from public.gestor_current_membership() m)
  )
);

create policy ledger_entries_select on public.ledger_entries
for select to authenticated
using (
  company_id = (select m.company_id from public.gestor_current_membership() m)
  and (
    (select m.role from public.gestor_current_membership() m) = 'admin'
    or employee_id = (select m.employee_id from public.gestor_current_membership() m)
  )
);

create view public.v_minha_subconta
with (security_invoker = true) as
select
  s.employee_id,
  e.company_id,
  s.transferido_cents,
  s.em_analise_cents,
  s.baixado_cents,
  s.saldo_cents
from public.gestor_current_membership() m
join public.employees e on e.id = m.employee_id
join lateral public.gestor_saldos(e.id) s on true
where m.role = 'funcionario';

create view public.v_subconta_funcionario
with (security_invoker = true) as
select
  e.id as employee_id,
  e.company_id,
  e.name as employee_name,
  e.status,
  s.transferido_cents,
  s.em_analise_cents,
  s.baixado_cents,
  s.saldo_cents
from public.gestor_current_membership() m
join public.employees e on e.company_id = m.company_id
join lateral public.gestor_saldos(e.id) s on true
where m.role = 'admin';

create view public.v_fila_comprovantes
with (security_invoker = true) as
select
  r.id as receipt_id,
  r.company_id,
  r.employee_id,
  e.name as employee_name,
  r.amount_claimed_cents,
  r.category,
  r.storage_path,
  r.place_note,
  r.submitted_at
from public.gestor_current_membership() m
join public.receipts r on r.company_id = m.company_id
join public.employees e on e.id = r.employee_id
where m.role = 'admin'
  and r.status = 'em_analise';

create view public.v_meu_extrato
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
join public.ledger_entries l on l.employee_id = m.employee_id
where m.role = 'funcionario'
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
join public.receipts r on r.employee_id = m.employee_id
where m.role = 'funcionario';

revoke all on table public.companies from public, anon, authenticated;
revoke all on table public.employees from public, anon, authenticated;
revoke all on table public.memberships from public, anon, authenticated;
revoke all on table public.asaas_accounts from public, anon, authenticated;
revoke all on table public.payment_orders from public, anon, authenticated;
revoke all on table public.receipts from public, anon, authenticated;
revoke all on table public.return_charges from public, anon, authenticated;
revoke all on table public.ledger_entries from public, anon, authenticated;

grant select on table public.companies to authenticated;
grant select on table public.employees to authenticated;
grant select on table public.memberships to authenticated;
grant select on table public.payment_orders to authenticated;
grant select on table public.receipts to authenticated;
grant select on table public.return_charges to authenticated;
grant select on table public.ledger_entries to authenticated;

revoke all on table public.v_minha_subconta from public, anon, authenticated;
revoke all on table public.v_subconta_funcionario from public, anon, authenticated;
revoke all on table public.v_fila_comprovantes from public, anon, authenticated;
revoke all on table public.v_meu_extrato from public, anon, authenticated;

grant select on table public.v_minha_subconta to authenticated;
grant select on table public.v_subconta_funcionario to authenticated;
grant select on table public.v_fila_comprovantes to authenticated;
grant select on table public.v_meu_extrato to authenticated;

revoke all on function public.gestor_ledger_immutable() from public, anon, authenticated;
revoke all on function public.gestor_current_membership() from public, anon, authenticated;
revoke all on function public.gestor_saldos(uuid) from public, anon, authenticated;
revoke all on function public.criar_empresa(text, text) from public, anon, authenticated;
revoke all on function public.cadastrar_funcionario(text, text, text, text) from public, anon, authenticated;
revoke all on function public.vincular_funcionario(uuid, uuid) from public, anon, authenticated;
revoke all on function public.submit_receipt(bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.review_receipt(uuid, bigint) from public, anon, authenticated;
revoke all on function public.registrar_adiantamento_teste(uuid, bigint, text) from public, anon, authenticated;

grant execute on function public.gestor_current_membership() to authenticated;
grant execute on function public.gestor_saldos(uuid) to authenticated;
grant execute on function public.criar_empresa(text, text) to authenticated;
grant execute on function public.cadastrar_funcionario(text, text, text, text) to authenticated;
grant execute on function public.vincular_funcionario(uuid, uuid) to authenticated;
grant execute on function public.submit_receipt(bigint, text, text, text) to authenticated;
grant execute on function public.review_receipt(uuid, bigint) to authenticated;
grant execute on function public.registrar_adiantamento_teste(uuid, bigint, text) to authenticated;

comment on table public.asaas_accounts is
  'api_key_ciphertext nao entra em view nem em grant para authenticated.';

comment on function public.registrar_adiantamento_teste(uuid, bigint, text) is
  'Temporario. Substituir pelo Pix da Asaas confirmado em TRANSFER_DONE.';
