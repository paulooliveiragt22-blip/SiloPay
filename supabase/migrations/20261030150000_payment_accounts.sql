-- A conta de pagamento não cita gateway. O adaptador entra na coluna provider.

alter type public.gestor_asaas_environment rename to gestor_payment_environment;

alter table public.asaas_accounts rename to payment_accounts;
alter table public.payment_accounts rename column wallet_id to external_account_id;

alter table public.payment_accounts
  add column provider text,
  add column webhook_secret_ciphertext bytea;

alter table public.payment_accounts
  add constraint payment_accounts_provider_code
  check (provider ~ '^[a-z][a-z0-9_]{0,31}$');

alter table public.payment_accounts
  alter column provider set not null;

alter policy asaas_accounts_no_client on public.payment_accounts
  rename to payment_accounts_no_client;

alter table public.payment_orders
  rename column asaas_transfer_id to provider_transfer_id;
alter table public.payment_orders
  rename constraint payment_orders_asaas_transfer_unique
  to payment_orders_provider_transfer_unique;

alter table public.return_charges
  rename column asaas_payment_id to provider_charge_id;
alter table public.return_charges
  rename constraint return_charges_asaas_payment_unique
  to return_charges_provider_charge_unique;

comment on table public.payment_accounts is
  'Conta da empresa num gateway. provider escolhe o adaptador. api_key_ciphertext e webhook_secret_ciphertext nao entram em view nem em grant para authenticated.';

comment on column public.payment_accounts.provider is
  'Codigo do adaptador, por exemplo o gateway escolhido pela empresa. Nao e enum fechado.';

comment on column public.payment_accounts.external_account_id is
  'Id da conta no gateway. Opaco para o dominio.';

comment on column public.payment_orders.provider_transfer_id is
  'Id da transferencia no gateway. Idempotencia do webhook.';

comment on column public.return_charges.provider_charge_id is
  'Id da cobranca no gateway. Idempotencia do webhook.';

comment on function public.registrar_adiantamento_teste(uuid, bigint, text) is
  'Temporario. A ordem real nasce pendente e o lancamento so nasce quando o gateway confirma a transferencia.';
