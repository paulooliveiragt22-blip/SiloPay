-- Cargo, telefone, endereço e admissão no cadastro.
-- Colaborador antigo permanece com esses campos nulos.

alter table public.employees
  add column job_title text,
  add column phone text,
  add column postal_code text,
  add column street text,
  add column street_number text,
  add column address_complement text,
  add column district text,
  add column city text,
  add column state text,
  add column hired_on date;

alter table public.employees
  add constraint employees_job_title check (job_title is null or length(btrim(job_title)) between 1 and 80),
  add constraint employees_phone check (phone is null or phone ~ '^[0-9]{10,11}$'),
  add constraint employees_postal_code check (postal_code is null or postal_code ~ '^[0-9]{8}$'),
  add constraint employees_street check (street is null or length(btrim(street)) between 1 and 120),
  add constraint employees_street_number check (street_number is null or length(btrim(street_number)) between 1 and 20),
  add constraint employees_address_complement check (
    address_complement is null or length(btrim(address_complement)) between 1 and 80
  ),
  add constraint employees_district check (district is null or length(btrim(district)) between 1 and 80),
  add constraint employees_city check (city is null or length(btrim(city)) between 1 and 80),
  add constraint employees_state check (state is null or state ~ '^[A-Z]{2}$'),
  add constraint employees_profile_together check (
    (
      job_title is null
      and phone is null
      and postal_code is null
      and street is null
      and street_number is null
      and address_complement is null
      and district is null
      and city is null
      and state is null
      and hired_on is null
    )
    or (
      job_title is not null
      and phone is not null
      and postal_code is not null
      and street is not null
      and street_number is not null
      and district is not null
      and city is not null
      and state is not null
    )
  );

drop function public.cadastrar_funcionario_com_acesso(text, text, text, text, uuid, timestamptz);

create function public.cadastrar_funcionario_com_acesso(
  p_name text,
  p_cpf text,
  p_pix_key_type text,
  p_pix_key text,
  p_user_id uuid,
  p_temp_expires_at timestamptz,
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
  v_employee_id uuid;
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_cep text := regexp_replace(coalesce(p_postal_code, ''), '[^0-9]', '', 'g');
  v_pix_type public.gestor_pix_key_type;
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

  insert into public.employees (
    company_id, user_id, name, cpf, pix_key_type, pix_key,
    job_title, phone, postal_code, street, street_number, address_complement,
    district, city, state, hired_on
  )
  values (
    v_company_id, p_user_id, btrim(p_name), v_cpf, v_pix_type, btrim(p_pix_key),
    v_job, v_phone, v_cep, v_street, v_number, v_complement,
    v_district, v_city, v_state, p_hired_on
  )
  returning id into v_employee_id;

  insert into public.memberships (company_id, user_id, role, employee_id)
  values (v_company_id, p_user_id, 'funcionario', v_employee_id);

  insert into public.acesso_colaborador (user_id, employee_id, must_change_password, temp_password_expires_at)
  values (p_user_id, v_employee_id, true, p_temp_expires_at);

  return jsonb_build_object('employee_id', v_employee_id, 'user_id', p_user_id);
end;
$$;

revoke all on function public.cadastrar_funcionario_com_acesso(
  text, text, text, text, uuid, timestamptz, text, text, text, text, text, text, text, text, text, date
) from public, anon, authenticated;

grant execute on function public.cadastrar_funcionario_com_acesso(
  text, text, text, text, uuid, timestamptz, text, text, text, text, text, text, text, text, text, date
) to authenticated;

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
  public.gestor_senha_temporaria(e.id) as senha_temporaria,
  e.job_title,
  e.phone,
  e.postal_code,
  e.street,
  e.street_number,
  e.address_complement,
  e.district,
  e.city,
  e.state,
  e.hired_on
from public.gestor_current_membership() m
join public.employees e on e.company_id = m.company_id
join lateral public.gestor_saldos(e.id) s on true
where m.role = 'admin';
