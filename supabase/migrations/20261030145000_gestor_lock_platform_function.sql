-- A função rls_auto_enable vem do projeto Supabase e não é da API do gestor.
-- Sem política, o linter trata asaas_accounts como tabela aberta. A política
-- recusa o usuário logado. O service_role continua passando, para o webhook.

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

create policy asaas_accounts_no_client on public.asaas_accounts
for all to authenticated
using (false)
with check (false);
