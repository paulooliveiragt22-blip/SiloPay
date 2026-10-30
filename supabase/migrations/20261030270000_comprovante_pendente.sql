-- O colaborador corrige ou exclui só o comprovante ainda em análise.

create function public.gestor_travar_comprovante_pendente(p_receipt_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_employee_id uuid;
  v_status public.gestor_receipt_status;
  v_path text;
begin
  if public.gestor_senha_bloqueada() then
    raise exception 'Troque a senha temporária antes de continuar.' using errcode = '42501';
  end if;

  select m.company_id, m.role, m.employee_id
  into v_company_id, v_role, v_employee_id
  from public.gestor_current_membership() m;

  if v_role is distinct from 'funcionario' or v_employee_id is null then
    raise exception 'somente funcionario envia comprovante' using errcode = '42501';
  end if;

  select r.status, r.storage_path
  into v_status, v_path
  from public.receipts r
  where r.id = p_receipt_id
    and r.employee_id = v_employee_id
    and r.company_id = v_company_id
  for update;

  if v_status is null then
    raise exception 'Este comprovante não está na sua subconta.' using errcode = '02000';
  end if;

  if v_status is distinct from 'em_analise'
    or exists (select 1 from public.ledger_entries l where l.receipt_id = p_receipt_id)
  then
    raise exception 'Este comprovante já foi analisado.' using errcode = '42501';
  end if;

  return v_path;
end;
$$;

create function public.corrigir_comprovante(
  p_receipt_id uuid,
  p_amount_cents bigint,
  p_category text,
  p_place_note text,
  p_storage_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_employee_id uuid;
  v_old_path text;
  v_new_path text;
  v_category public.gestor_receipt_category;
begin
  v_old_path := public.gestor_travar_comprovante_pendente(p_receipt_id);

  select m.company_id, m.employee_id
  into v_company_id, v_employee_id
  from public.gestor_current_membership() m;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'valor informado deve ser maior que zero' using errcode = '22023';
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

  v_new_path := v_old_path;
  if p_storage_path is not null and length(btrim(p_storage_path)) > 0 then
    v_new_path := lower(btrim(p_storage_path));
    if v_new_path !~ (
      '^' || v_company_id::text || '/' || v_employee_id::text ||
      '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
    ) then
      raise exception 'foto invalida' using errcode = '22023';
    end if;
    if not exists (
      select 1 from storage.objects where bucket_id = 'receipts' and name = v_new_path
    ) then
      raise exception 'foto obrigatoria' using errcode = '22023';
    end if;
  end if;

  update public.receipts
  set amount_claimed_cents = p_amount_cents,
      category = v_category,
      place_note = nullif(btrim(p_place_note), ''),
      storage_path = v_new_path
  where id = p_receipt_id;

  if v_new_path is distinct from v_old_path then
    delete from storage.objects
    where bucket_id = 'receipts'
      and name = v_old_path;
  end if;

  return jsonb_build_object('receipt_id', p_receipt_id, 'status', 'em_analise');
end;
$$;

create function public.excluir_comprovante(p_receipt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  v_path := public.gestor_travar_comprovante_pendente(p_receipt_id);

  delete from public.receipts
  where id = p_receipt_id;

  delete from storage.objects
  where bucket_id = 'receipts'
    and name = v_path;

  return jsonb_build_object('receipt_id', p_receipt_id);
end;
$$;

revoke all on function public.gestor_travar_comprovante_pendente(uuid) from public, anon, authenticated;
revoke all on function public.corrigir_comprovante(uuid, bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.excluir_comprovante(uuid) from public, anon, authenticated;

grant execute on function public.corrigir_comprovante(uuid, bigint, text, text, text) to authenticated;
grant execute on function public.excluir_comprovante(uuid) to authenticated;

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
  null::bigint as amount_approved_cents,
  null::text as place_note
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
  r.amount_approved_cents,
  r.place_note
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
  null::bigint as amount_approved_cents,
  null::text as place_note
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
  r.amount_approved_cents,
  r.place_note
from public.gestor_current_membership() m
join public.receipts r on r.employee_id = m.employee_id
where m.role = 'funcionario'
  and not public.gestor_senha_bloqueada();
