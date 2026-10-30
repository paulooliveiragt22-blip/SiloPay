-- Cadastro editável e rastro de quem fez. Sem valor e sem senha.
-- Aplicar somente em https://rbgrdujuuriabpekltis.supabase.co

create table public.company_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  actor_user_id uuid not null,
  kind text not null check (kind in (
    'colaborador_criado',
    'senha_gerada',
    'senha_trocada',
    'senha_renovada',
    'saldo_adicionado'
  )),
  employee_id uuid references public.employees (id),
  occurred_at timestamptz not null default now()
);

create index company_events_company_occurred_idx
  on public.company_events (company_id, occurred_at desc);

alter table public.company_events enable row level security;

create policy company_events_admin_read
  on public.company_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gestor_current_membership() m
      where m.company_id = company_events.company_id
        and m.role = 'admin'
    )
  );

revoke all on table public.company_events from public, anon, authenticated;
grant select on table public.company_events to authenticated;

create or replace function public.gestor_anotar_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_kind text;
begin
  if auth.uid() is null then
    return new;
  end if;

  begin
    if tg_table_name = 'employees' and tg_op = 'INSERT' then
      insert into public.company_events (company_id, actor_user_id, kind, employee_id)
      values (new.company_id, auth.uid(), 'colaborador_criado', new.id);
      return new;
    end if;

    if tg_table_name = 'acesso_colaborador' then
      select e.company_id into v_company
      from public.employees e
      where e.id = new.employee_id;

      if v_company is null then
        return new;
      end if;

      if tg_op = 'INSERT' then
        v_kind := 'senha_gerada';
      elsif tg_op = 'UPDATE'
        and new.must_change_password
        and (
          not old.must_change_password
          or old.temp_password_expires_at is distinct from new.temp_password_expires_at
        )
      then
        v_kind := 'senha_renovada';
      elsif tg_op = 'UPDATE' and old.must_change_password and not new.must_change_password then
        v_kind := 'senha_trocada';
      else
        return new;
      end if;

      insert into public.company_events (company_id, actor_user_id, kind, employee_id)
      values (v_company, auth.uid(), v_kind, new.employee_id);
      return new;
    end if;

    if tg_table_name = 'company_cash_entries' and tg_op = 'INSERT' and new.kind = 'entrada' then
      insert into public.company_events (company_id, actor_user_id, kind, employee_id)
      values (new.company_id, auth.uid(), 'saldo_adicionado', null);
      return new;
    end if;
  exception
    when others then
      raise warning 'evento nao gravado: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.gestor_anotar_evento() from public, anon, authenticated;

create trigger employees_anotar_evento
  after insert on public.employees
  for each row execute function public.gestor_anotar_evento();

create trigger acesso_colaborador_anotar_evento
  after insert or update on public.acesso_colaborador
  for each row execute function public.gestor_anotar_evento();

create trigger company_cash_entries_anotar_evento
  after insert on public.company_cash_entries
  for each row execute function public.gestor_anotar_evento();

create or replace view public.v_eventos_empresa
with (security_invoker = true) as
select
  e.id,
  e.occurred_at,
  e.kind,
  e.employee_id,
  emp.name as employee_name,
  case
    when actor.name is not null then actor.name
    else 'Empresa'
  end as actor_name
from public.company_events e
join public.gestor_current_membership() m
  on m.company_id = e.company_id
 and m.role = 'admin'
left join public.employees emp on emp.id = e.employee_id
left join public.employees actor on actor.user_id = e.actor_user_id;

revoke all on table public.v_eventos_empresa from public, anon;
grant select on table public.v_eventos_empresa to authenticated;

create or replace function public.atualizar_cadastro_colaborador(
  p_employee_id uuid,
  p_job_title text,
  p_phone text,
  p_postal_code text,
  p_street text,
  p_street_number text,
  p_address_complement text,
  p_district text,
  p_city text,
  p_state text,
  p_hired_on date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.gestor_member_role;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_cep text := regexp_replace(coalesce(p_postal_code, ''), '[^0-9]', '', 'g');
  v_job text := btrim(coalesce(p_job_title, ''));
  v_street text := btrim(coalesce(p_street, ''));
  v_number text := btrim(coalesce(p_street_number, ''));
  v_complement text := nullif(btrim(coalesce(p_address_complement, '')), '');
  v_district text := btrim(coalesce(p_district, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_state text := upper(btrim(coalesce(p_state, '')));
begin
  select m.company_id, m.role into v_company_id, v_role
  from public.gestor_current_membership() m;

  if v_role is distinct from 'admin' then
    raise exception 'somente admin atualiza cadastro' using errcode = '42501';
  end if;

  if length(v_job) = 0 or length(v_job) > 80 then
    raise exception 'Informe o cargo, com até 80 caracteres.' using errcode = '22023';
  end if;

  if v_phone ~ '^55[0-9]{10,11}$' then
    v_phone := substring(v_phone from 3);
  end if;

  if v_phone !~ '^[0-9]{10,11}$' then
    raise exception 'O telefone precisa ter DDD e 10 ou 11 dígitos.' using errcode = '22023';
  end if;

  if v_cep !~ '^[0-9]{8}$' then
    raise exception 'O CEP precisa ter 8 dígitos.' using errcode = '22023';
  end if;

  if length(v_street) = 0 or length(v_street) > 120
    or length(v_number) = 0 or length(v_number) > 20
    or length(v_district) = 0 or length(v_district) > 80
    or length(v_city) = 0 or length(v_city) > 80
    or (v_complement is not null and length(v_complement) > 80)
    or v_state not in (
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
      'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    )
  then
    raise exception 'Informe rua, número, bairro, cidade e UF.' using errcode = '22023';
  end if;

  update public.employees
  set
    job_title = v_job,
    phone = v_phone,
    postal_code = v_cep,
    street = v_street,
    street_number = v_number,
    address_complement = v_complement,
    district = v_district,
    city = v_city,
    state = v_state,
    hired_on = p_hired_on
  where id = p_employee_id
    and company_id = v_company_id;

  if not found then
    raise exception 'Este colaborador não está na empresa.' using errcode = '02000';
  end if;

  return jsonb_build_object('employee_id', p_employee_id);
end;
$$;

revoke all on function public.atualizar_cadastro_colaborador(
  uuid, text, text, text, text, text, text, text, text, text, date
) from public, anon, authenticated;

grant execute on function public.atualizar_cadastro_colaborador(
  uuid, text, text, text, text, text, text, text, text, text, date
) to authenticated;

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
  v_status public.gestor_receipt_status;
  v_path text;
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

  v_path := lower(btrim(p_storage_path));
  if v_path !~ (
    '^' || v_company_id::text || '/' || v_employee_id::text ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
  ) then
    raise exception 'foto invalida' using errcode = '22023';
  end if;

  select r.id, r.status into v_receipt_id, v_status
  from public.receipts r
  where r.company_id = v_company_id
    and r.employee_id = v_employee_id
    and r.storage_path = v_path;

  if v_receipt_id is not null then
    return jsonb_build_object(
      'receipt_id', v_receipt_id,
      'status', v_status,
      'idempotent', true
    );
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'receipts'
      and name = v_path
  ) then
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
    v_path,
    nullif(btrim(p_place_note), '')
  )
  returning id into v_receipt_id;

  return jsonb_build_object(
    'receipt_id', v_receipt_id,
    'status', 'em_analise',
    'idempotent', false
  );
end;
$$;

notify pgrst, 'reload schema';
