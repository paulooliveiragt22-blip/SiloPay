-- Conta de pagamento sem segredo na leitura. Ordem de Pix nasce pendente.
-- O lançamento só nasce em aplicar_resultado_transferencia, chamada pelo webhook.

create view public.v_conta_pagamento
with (security_invoker = false) as
select
  a.company_id,
  a.provider,
  a.environment::text as environment,
  a.status,
  a.external_account_id
from public.gestor_current_membership() m
join public.payment_accounts a on a.company_id = m.company_id
where m.role = 'admin';

create view public.v_destino_pix
with (security_invoker = true) as
select
  e.id as employee_id,
  e.company_id,
  e.pix_key_type::text as pix_key_type,
  e.pix_key
from public.gestor_current_membership() m
join public.employees e on e.company_id = m.company_id
where m.role = 'admin'
  and e.status = 'ativo';

revoke all on table public.v_conta_pagamento from public, anon, authenticated;
revoke all on table public.v_destino_pix from public, anon, authenticated;
grant select on table public.v_conta_pagamento to authenticated;
grant select on table public.v_destino_pix to authenticated;

comment on view public.v_conta_pagamento is
  'Conta conectada da empresa, sem ciphertext. Só o admin.';

comment on view public.v_destino_pix is
  'Chave Pix já cadastrada. O envio não pede a chave de novo.';

create or replace function public.conectar_conta_pagamento(
  p_provider text,
  p_external_account_id text,
  p_environment text,
  p_api_key_ciphertext bytea,
  p_webhook_secret_ciphertext bytea
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_provider text;
  v_external text;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin conecta a conta' using errcode = '42501';
  end if;

  v_provider := btrim(p_provider);
  v_external := btrim(p_external_account_id);

  if v_provider is null or v_provider !~ '^[a-z][a-z0-9_]{0,31}$' then
    raise exception 'provedor invalido' using errcode = '22023';
  end if;

  if v_external is null or length(v_external) = 0 or length(v_external) > 200 then
    raise exception 'conta externa invalida' using errcode = '22023';
  end if;

  if p_environment is distinct from 'sandbox' and p_environment is distinct from 'producao' then
    raise exception 'ambiente invalido' using errcode = '22023';
  end if;

  if p_api_key_ciphertext is null or octet_length(p_api_key_ciphertext) = 0
    or p_webhook_secret_ciphertext is null or octet_length(p_webhook_secret_ciphertext) = 0 then
    raise exception 'segredo ausente' using errcode = '22023';
  end if;

  insert into public.payment_accounts (
    company_id,
    provider,
    external_account_id,
    environment,
    api_key_ciphertext,
    webhook_secret_ciphertext,
    status
  )
  values (
    v_company_id,
    v_provider,
    v_external,
    p_environment::public.gestor_payment_environment,
    p_api_key_ciphertext,
    p_webhook_secret_ciphertext,
    'conectada'
  )
  on conflict (company_id) do update
  set
    provider = excluded.provider,
    external_account_id = excluded.external_account_id,
    environment = excluded.environment,
    api_key_ciphertext = excluded.api_key_ciphertext,
    webhook_secret_ciphertext = excluded.webhook_secret_ciphertext,
    status = 'conectada';

  return jsonb_build_object(
    'company_id', v_company_id,
    'provider', v_provider,
    'environment', p_environment,
    'status', 'conectada'
  );
end;
$$;

create or replace function public.abrir_ordem_pix(
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
    raise exception 'tipo de pix invalido' using errcode = '22023';
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
    from public.payment_accounts
    where company_id = v_company_id
      and status = 'conectada'
  ) then
    raise exception 'conta de pagamento desconectada' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.employees
    where id = p_employee_id
      and company_id = v_company_id
      and status = 'ativo'
      and length(btrim(pix_key)) > 0
  ) then
    raise exception 'funcionario inativo ou de outra empresa' using errcode = '02000';
  end if;

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
    'pendente',
    v_order_id::text,
    v_key
  );

  return jsonb_build_object(
    'payment_order_id', v_order_id,
    'status', 'pendente',
    'idempotent', false
  );
exception
  when unique_violation then
    select id, status into v_existing_id, v_existing_status
    from public.payment_orders
    where company_id = v_company_id
      and idempotency_key = v_key;
    return jsonb_build_object(
      'payment_order_id', v_existing_id,
      'status', v_existing_status,
      'idempotent', true
    );
end;
$$;

create or replace function public.falhar_ordem_pix(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_status public.gestor_payment_status;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin transfere' using errcode = '42501';
  end if;

  select status into v_status
  from public.payment_orders
  where id = p_order_id
    and company_id = v_company_id
  for update;

  if v_status is null then
    raise exception 'ordem de outra empresa' using errcode = '02000';
  end if;

  if v_status = 'confirmada' then
    raise exception 'ordem ja confirmada' using errcode = 'P0001';
  end if;

  if v_status = 'pendente' then
    update public.payment_orders
    set status = 'falhou'
    where id = p_order_id;
    v_status := 'falhou';
  end if;

  return jsonb_build_object('payment_order_id', p_order_id, 'status', v_status);
end;
$$;

create or replace function public.registrar_envio_pix(
  p_order_id uuid,
  p_provider_transfer_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_status public.gestor_payment_status;
  v_current text;
  v_transfer text;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin transfere' using errcode = '42501';
  end if;

  v_transfer := btrim(p_provider_transfer_id);
  if v_transfer is null or length(v_transfer) = 0 then
    raise exception 'id externo ausente' using errcode = '22023';
  end if;

  select status, provider_transfer_id into v_status, v_current
  from public.payment_orders
  where id = p_order_id
    and company_id = v_company_id
  for update;

  if v_status is distinct from 'pendente' then
    raise exception 'ordem nao pendente' using errcode = 'P0001';
  end if;

  if v_current is not null and v_current is distinct from v_transfer then
    raise exception 'ordem ja enviada' using errcode = 'P0001';
  end if;

  update public.payment_orders
  set provider_transfer_id = v_transfer
  where id = p_order_id;

  return jsonb_build_object('payment_order_id', p_order_id, 'status', 'pendente');
end;
$$;

create or replace function public.aplicar_resultado_transferencia(
  p_order_id uuid,
  p_outcome text,
  p_provider_transfer_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders%rowtype;
  v_transfer text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'somente webhook' using errcode = '42501';
  end if;

  if p_outcome is distinct from 'confirmed'
    and p_outcome is distinct from 'failed'
    and p_outcome is distinct from 'cancelled' then
    raise exception 'resultado invalido' using errcode = '22023';
  end if;

  select * into v_order
  from public.payment_orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'ordem ausente' using errcode = '02000';
  end if;

  v_transfer := nullif(btrim(p_provider_transfer_id), '');

  if p_outcome = 'confirmed' then
    if v_transfer is null then
      raise exception 'id externo ausente' using errcode = '22023';
    end if;
    if v_order.status = 'confirmada' and v_order.provider_transfer_id = v_transfer then
      return jsonb_build_object('payment_order_id', v_order.id, 'status', 'confirmada', 'idempotent', true);
    end if;
    if v_order.status is distinct from 'pendente' then
      raise exception 'ordem nao pendente' using errcode = 'P0001';
    end if;

    update public.payment_orders
    set status = 'confirmada', provider_transfer_id = v_transfer
    where id = v_order.id;

    if not exists (
      select 1 from public.ledger_entries where payment_order_id = v_order.id
    ) then
      insert into public.ledger_entries (
        company_id,
        employee_id,
        kind,
        amount_cents,
        payment_order_id
      )
      values (
        v_order.company_id,
        v_order.employee_id,
        v_order.kind::text::public.gestor_ledger_kind,
        v_order.amount_cents,
        v_order.id
      );
    end if;

    return jsonb_build_object('payment_order_id', v_order.id, 'status', 'confirmada', 'idempotent', false);
  end if;

  if v_order.status = 'confirmada' then
    raise exception 'ordem ja confirmada' using errcode = 'P0001';
  end if;

  if v_order.status = 'pendente' then
    update public.payment_orders
    set status = case when p_outcome = 'failed' then 'falhou'::public.gestor_payment_status else 'cancelada'::public.gestor_payment_status end
    where id = v_order.id;
  end if;

  return jsonb_build_object(
    'payment_order_id', v_order.id,
    'status', case when p_outcome = 'failed' then 'falhou' else 'cancelada' end,
    'idempotent', v_order.status is distinct from 'pendente'
  );
end;
$$;

revoke all on function public.conectar_conta_pagamento(text, text, text, bytea, bytea) from public, anon, authenticated;
revoke all on function public.abrir_ordem_pix(uuid, text, bigint, text) from public, anon, authenticated;
revoke all on function public.falhar_ordem_pix(uuid) from public, anon, authenticated;
revoke all on function public.registrar_envio_pix(uuid, text) from public, anon, authenticated;
revoke all on function public.aplicar_resultado_transferencia(uuid, text, text) from public, anon, authenticated;

grant execute on function public.conectar_conta_pagamento(text, text, text, bytea, bytea) to authenticated;
grant execute on function public.abrir_ordem_pix(uuid, text, bigint, text) to authenticated;
grant execute on function public.falhar_ordem_pix(uuid) to authenticated;
grant execute on function public.registrar_envio_pix(uuid, text) to authenticated;
grant execute on function public.aplicar_resultado_transferencia(uuid, text, text) to service_role;

comment on function public.abrir_ordem_pix(uuid, text, bigint, text) is
  'Abre ordem pendente. Nao lanca saldo.';

comment on function public.aplicar_resultado_transferencia(uuid, text, text) is
  'Somente o webhook. Confirmacao lanca adiantamento ou reembolso. Falha e cancelamento nao lancam.';
