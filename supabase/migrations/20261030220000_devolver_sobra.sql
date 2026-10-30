-- Devolução da sobra: sai da subconta e volta para o saldo da empresa na mesma operação.

alter table public.company_cash_entries
  add column return_charge_id uuid unique references public.return_charges (id);

alter table public.company_cash_entries drop constraint company_cash_entries_kind_check;
alter table public.company_cash_entries
  add constraint company_cash_entries_kind_check
  check (kind in ('entrada', 'envio', 'devolucao'));

alter table public.company_cash_entries drop constraint company_cash_entries_origin;
alter table public.company_cash_entries
  add constraint company_cash_entries_origin check (
    (kind = 'entrada' and payment_order_id is null and return_charge_id is null)
    or (kind = 'envio' and payment_order_id is not null and return_charge_id is null)
    or (kind = 'devolucao' and payment_order_id is null and return_charge_id is not null)
  );

create or replace view public.v_saldo_empresa
with (security_invoker = false) as
select
  m.company_id,
  coalesce(sum(c.amount_cents) filter (where c.kind = 'entrada'), 0)::bigint as entradas_cents,
  coalesce(sum(c.amount_cents) filter (where c.kind = 'envio'), 0)::bigint as enviados_cents,
  (
    coalesce(sum(c.amount_cents) filter (where c.kind in ('entrada', 'devolucao')), 0)
    - coalesce(sum(c.amount_cents) filter (where c.kind = 'envio'), 0)
  )::bigint as saldo_cents,
  coalesce(sum(c.amount_cents) filter (where c.kind = 'devolucao'), 0)::bigint as devolucoes_cents
from public.gestor_current_membership() m
left join public.company_cash_entries c on c.company_id = m.company_id
where m.role = 'admin'
group by m.company_id;

create or replace function public.devolver_sobra(
  p_employee_id uuid,
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
  v_sobra bigint;
  v_existing uuid;
  v_charge_id uuid;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin devolve sobra' using errcode = '42501';
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
  ) then
    raise exception 'funcionario de outra empresa' using errcode = '02000';
  end if;

  perform 1 from public.companies where id = v_company_id for update;

  select return_charge_id into v_charge_id
  from public.company_cash_entries
  where company_id = v_company_id
    and idempotency_key = v_key
    and kind = 'devolucao';

  if v_charge_id is not null then
    return jsonb_build_object('return_charge_id', v_charge_id, 'idempotent', true);
  end if;

  select s.saldo_cents into v_sobra
  from public.gestor_saldos(p_employee_id) s;

  if v_sobra is null or v_sobra <= 0 then
    raise exception 'Não há sobra nesta subconta.' using errcode = 'P0001';
  end if;

  if p_amount_cents > v_sobra then
    raise exception 'A sobra do colaborador não cobre este valor.' using errcode = 'P0001';
  end if;

  insert into public.return_charges (company_id, employee_id, amount_cents, status)
  values (v_company_id, p_employee_id, p_amount_cents, 'paga')
  returning id into v_charge_id;

  insert into public.ledger_entries (
    company_id,
    employee_id,
    kind,
    amount_cents,
    return_charge_id
  )
  values (
    v_company_id,
    p_employee_id,
    'devolucao',
    p_amount_cents,
    v_charge_id
  );

  insert into public.company_cash_entries (
    company_id,
    kind,
    amount_cents,
    return_charge_id,
    idempotency_key
  )
  values (
    v_company_id,
    'devolucao',
    p_amount_cents,
    v_charge_id,
    v_key
  );

  return jsonb_build_object('return_charge_id', v_charge_id, 'idempotent', false);
exception
  when unique_violation then
    select return_charge_id into v_existing
    from public.company_cash_entries
    where company_id = v_company_id
      and idempotency_key = v_key
      and kind = 'devolucao';

    if v_existing is null then
      raise;
    end if;

    return jsonb_build_object('return_charge_id', v_existing, 'idempotent', true);
end;
$$;

revoke all on function public.devolver_sobra(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.devolver_sobra(uuid, bigint, text) to authenticated;

comment on function public.devolver_sobra(uuid, bigint, text) is
  'Diminui a subconta e credita o saldo da empresa. Recusa se passar da sobra.';

do $$
declare
  src text;
  fn text;
begin
  foreach fn in array array[
    'public.adicionar_saldo_empresa(bigint,text)',
    'public.enviar_saldo_colaborador(uuid,text,bigint,text)'
  ]
  loop
    src := pg_get_functiondef(fn::regprocedure);
    src := replace(src, $old$kind = 'entrada'$old$, $new$kind in ('entrada', 'devolucao')$new$);
    if src not like '%kind in (''entrada'', ''devolucao'')%' then
      raise exception 'formula do caixa nao atualizada';
    end if;
    execute src;
  end loop;
end;
$$;
