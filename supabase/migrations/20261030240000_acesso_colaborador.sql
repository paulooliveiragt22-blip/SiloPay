-- Login do colaborador criado pela empresa. Senha temporária de 24 horas.
-- A senha em texto não entra nesta tabela.

create table public.acesso_colaborador (
  user_id uuid primary key references auth.users (id) on delete cascade,
  employee_id uuid not null unique references public.employees (id),
  must_change_password boolean not null default true,
  temp_password_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.acesso_colaborador enable row level security;
revoke all on table public.acesso_colaborador from public, anon, authenticated;

create or replace function public.gestor_senha_bloqueada()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.acesso_colaborador a
    where a.user_id = auth.uid()
      and a.must_change_password
  );
$$;

create or replace function public.gestor_senha_temporaria(p_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select a.must_change_password
  from public.acesso_colaborador a
  join public.employees e on e.id = a.employee_id
  join public.gestor_current_membership() m
    on m.company_id = e.company_id
   and m.role = 'admin'
  where e.id = p_employee_id;
$$;

create or replace function public.gestor_exigir_validade_senha(p_expires timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_expires is null
    or p_expires <= now()
    or p_expires > now() + interval '24 hours 5 minutes' then
    raise exception 'A senha temporária vence em 24 horas.' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.gestor_exigir_conta_colaborador(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb;
begin
  select u.raw_app_meta_data into v_meta
  from auth.users u
  where u.id = p_user_id;

  if not found then
    raise exception 'usuario nao encontrado' using errcode = '02000';
  end if;

  if coalesce(v_meta->>'silopay_conta', '') is distinct from 'funcionario' then
    raise exception 'Este e-mail já pertence a uma empresa.' using errcode = '42501';
  end if;

  if exists (select 1 from public.memberships where user_id = p_user_id) then
    raise exception 'Este e-mail já pertence a uma empresa.' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.gestor_encerrar_sessoes(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.mfa_amr_claims
  where session_id in (select s.id from auth.sessions s where s.user_id = p_user_id);

  delete from auth.refresh_tokens
  where user_id = p_user_id::text;

  delete from auth.sessions
  where user_id = p_user_id;
end;
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

  if exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and coalesce(u.raw_app_meta_data->>'silopay_conta', '') = 'funcionario'
  ) or exists (
    select 1 from public.acesso_colaborador a where a.user_id = auth.uid()
  ) then
    raise exception 'Esta conta é de colaborador.' using errcode = '42501';
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

create or replace function public.cadastrar_funcionario_com_acesso(
  p_name text,
  p_cpf text,
  p_pix_key_type text,
  p_pix_key text,
  p_user_id uuid,
  p_temp_expires_at timestamptz
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

  perform public.gestor_exigir_validade_senha(p_temp_expires_at);
  perform public.gestor_exigir_conta_colaborador(p_user_id);

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

  insert into public.employees (company_id, user_id, name, cpf, pix_key_type, pix_key)
  values (v_company_id, p_user_id, btrim(p_name), v_cpf, v_pix_type, btrim(p_pix_key))
  returning id into v_employee_id;

  insert into public.memberships (company_id, user_id, role, employee_id)
  values (v_company_id, p_user_id, 'funcionario', v_employee_id);

  insert into public.acesso_colaborador (user_id, employee_id, must_change_password, temp_password_expires_at)
  values (p_user_id, v_employee_id, true, p_temp_expires_at);

  return jsonb_build_object('employee_id', v_employee_id, 'user_id', p_user_id);
end;
$$;

create or replace function public.abrir_acesso_colaborador(
  p_employee_id uuid,
  p_user_id uuid,
  p_temp_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_linked jsonb;
begin
  perform public.gestor_exigir_validade_senha(p_temp_expires_at);
  perform public.gestor_exigir_conta_colaborador(p_user_id);
  v_linked := public.vincular_funcionario(p_employee_id, p_user_id);

  insert into public.acesso_colaborador (user_id, employee_id, must_change_password, temp_password_expires_at)
  values (p_user_id, p_employee_id, true, p_temp_expires_at);

  return v_linked;
end;
$$;

create or replace function public.renovar_senha_colaborador(
  p_employee_id uuid,
  p_temp_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_user_id uuid;
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin cadastra funcionario' using errcode = '42501';
  end if;

  perform public.gestor_exigir_validade_senha(p_temp_expires_at);

  select e.user_id into v_user_id
  from public.employees e
  where e.id = p_employee_id
    and e.company_id = v_company_id
  for update;

  if v_user_id is null then
    raise exception 'Este colaborador ainda não tem conta.' using errcode = '02000';
  end if;

  insert into public.acesso_colaborador (user_id, employee_id, must_change_password, temp_password_expires_at)
  values (v_user_id, p_employee_id, true, p_temp_expires_at)
  on conflict (user_id) do update
    set must_change_password = true,
        temp_password_expires_at = excluded.temp_password_expires_at;

  perform public.gestor_encerrar_sessoes(v_user_id);

  return jsonb_build_object('user_id', v_user_id);
end;
$$;

create or replace function public.confirmar_senha_inicial()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'sessao ausente' using errcode = '42501';
  end if;

  select a.temp_password_expires_at into v_expires
  from public.acesso_colaborador a
  where a.user_id = auth.uid()
    and a.must_change_password
  for update;

  if not found then
    raise exception 'Não há senha temporária para trocar.' using errcode = '02000';
  end if;

  if v_expires <= now() then
    raise exception 'A senha temporária venceu. Peça outra à empresa.' using errcode = '42501';
  end if;

  update public.acesso_colaborador
  set must_change_password = false
  where user_id = auth.uid();

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.encerrar_acesso_vencido()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sessao ausente' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.acesso_colaborador a
    where a.user_id = auth.uid()
      and a.must_change_password
      and a.temp_password_expires_at <= now()
  ) then
    raise exception 'A senha temporária ainda vale.' using errcode = '42501';
  end if;

  perform public.gestor_encerrar_sessoes(auth.uid());
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.receipts_block_provisional_password()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.gestor_senha_bloqueada() then
    raise exception 'Troque a senha temporária antes de continuar.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists receipts_require_password on public.receipts;
create trigger receipts_require_password
  before insert on public.receipts
  for each row
  execute function public.receipts_block_provisional_password();

create or replace view public.v_minha_subconta
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
where m.role = 'funcionario'
  and not public.gestor_senha_bloqueada();

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
  l.id as ledger_id
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
  null::uuid
from public.gestor_current_membership() m
join public.receipts r on r.employee_id = m.employee_id
where m.role = 'funcionario'
  and not public.gestor_senha_bloqueada();

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
  public.gestor_senha_temporaria(e.id) as senha_temporaria
from public.gestor_current_membership() m
join public.employees e on e.company_id = m.company_id
join lateral public.gestor_saldos(e.id) s on true
where m.role = 'admin';

create view public.v_meu_acesso
with (security_invoker = false) as
select
  a.must_change_password,
  a.temp_password_expires_at
from public.acesso_colaborador a
where a.user_id = auth.uid();

revoke all on function public.gestor_senha_bloqueada() from public, anon, authenticated;
revoke all on function public.gestor_senha_temporaria(uuid) from public, anon, authenticated;
revoke all on function public.gestor_exigir_validade_senha(timestamptz) from public, anon, authenticated;
revoke all on function public.gestor_exigir_conta_colaborador(uuid) from public, anon, authenticated;
revoke all on function public.gestor_encerrar_sessoes(uuid) from public, anon, authenticated;
revoke all on function public.cadastrar_funcionario_com_acesso(text, text, text, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.abrir_acesso_colaborador(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.renovar_senha_colaborador(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.confirmar_senha_inicial() from public, anon, authenticated;
revoke all on function public.encerrar_acesso_vencido() from public, anon, authenticated;
revoke all on function public.cadastrar_funcionario(text, text, text, text) from public, anon, authenticated;
revoke all on function public.vincular_funcionario(uuid, uuid) from public, anon, authenticated;
revoke all on function public.vincular_funcionario_por_email(uuid, text) from public, anon, authenticated;

grant execute on function public.gestor_senha_bloqueada() to authenticated;
grant execute on function public.gestor_senha_temporaria(uuid) to authenticated;
grant execute on function public.cadastrar_funcionario_com_acesso(text, text, text, text, uuid, timestamptz) to authenticated;
grant execute on function public.abrir_acesso_colaborador(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.renovar_senha_colaborador(uuid, timestamptz) to authenticated;
grant execute on function public.confirmar_senha_inicial() to authenticated;
grant execute on function public.encerrar_acesso_vencido() to authenticated;

grant select on public.v_meu_acesso to authenticated;

comment on table public.acesso_colaborador is
  'Marca senha temporária do colaborador. Não guarda a senha.';
