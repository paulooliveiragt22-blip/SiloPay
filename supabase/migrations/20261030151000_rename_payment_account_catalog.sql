-- Renomear a constraint também renomeia o índice que a sustenta.

alter table public.payment_accounts
  rename constraint asaas_accounts_pkey to payment_accounts_pkey;
alter table public.payment_accounts
  rename constraint asaas_accounts_company_id_key to payment_accounts_company_id_key;
alter table public.payment_accounts
  rename constraint asaas_accounts_company_id_fkey to payment_accounts_company_id_fkey;
alter table public.payment_accounts
  rename constraint asaas_accounts_status_check to payment_accounts_status_check;
