insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy receipts_photo_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (
    select m.company_id::text from public.gestor_current_membership() m
  )
  and (storage.foldername(name))[2] = (
    select m.employee_id::text from public.gestor_current_membership() m
  )
  and (select m.role from public.gestor_current_membership() m) = 'funcionario'
);

create policy receipts_photo_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (
    select m.company_id::text from public.gestor_current_membership() m
  )
  and (
    (select m.role from public.gestor_current_membership() m) = 'admin'
    or (storage.foldername(name))[2] = (
      select m.employee_id::text from public.gestor_current_membership() m
    )
  )
);

create unique index receipts_storage_path_key on public.receipts (storage_path);

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
    'status', 'em_analise'
  );
end;
$$;
