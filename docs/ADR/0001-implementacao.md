# ADR 0001 — Implementação do código

Status: aceito. Data: 2026-10-30.

Se este arquivo divergir de `docs/business_rules.md`, vale a regra de negócio. Se divergir de uma pasta ou de um import, vale `docs/arquitetura-next.md`. Este ADR existe para o código não reabrir decisão já tomada.

## Contexto

O SiloPay é o navegador (Next.js) e, depois, o smartphone (Flutter). Os dois leem as mesmas views e chamam as mesmas RPCs. O banco do projeto Supabase `gestor` (`rbgrdujuuriabpekltis`) já está aplicado. O repositório GitHub é `paulooliveiragt22-blip/SiloPay`.

## Decisão

### Camadas

| Pasta | Papel |
|---|---|
| `src/domain` | Centavos, categoria, faixa da baixa, parser do `jsonb` das RPCs, caso de uso. Sem Next, sem Supabase, sem HTTP |
| `src/data` | Cliente Supabase, leitura só de `v_*`, mutação só de RPC, adaptador de gateway |
| `src/presentation` | Server Actions e componentes. `forbidden()` e `revalidatePath` ficam aqui |
| `src/app` | Rotas. A página compõe. Não calcula saldo e não chama o gateway |

Não criar `lib/`, `src/pro/`, `src/application/` nem `src/infrastructure/`.

O saldo não é recalculado em TypeScript nem em Dart. A view entrega `transferido_cents`, `em_analise_cents`, `baixado_cents` e `saldo_cents`.

### Sessão

`src/proxy.ts` só renova o cookie e manda quem não está logado para `/login`. O webhook `/api/payments/` fica fora do matcher.

O papel sai de `gestor_current_membership()`, não de cookie. Cada Server Action chama `verifySession()` de novo. Papel errado usa `forbidden()` de `next/navigation`.

Cliente da sessão nas páginas e nas actions. `createBrowserClient` só no login e no upload da foto. `SUPABASE_SECRET_KEY` fica no servidor: webhook do gateway e o módulo que cria ou troca a senha do colaborador. Não entra no navegador. `payment_accounts` não é lida pelo cliente.

### Gateway

O nome do provedor é a coluna `provider`. Tabela, coluna de domínio, enum e rota não citam um gateway. O adaptador em `src/data/payments/<provider>/` traduz o evento. A action não faz HTTP. Falha e cancelamento não geram lançamento. Id externo é `text`.

O saldo da empresa é a soma de `company_cash_entries`. A entrada é manual. O envio ao colaborador debita esse saldo na mesma RPC que credita a subconta. `registrar_adiantamento_teste` está aposentada.

### Tema

shadcn `base-nova`, Tailwind v4, `neutral`, tokens em `src/app/globals.css`. Sem `tailwind.config.js`. Escuro segue o sistema.

### Stack

Next.js 16 (App Router), Node `24.x`, `@supabase/ssr` atual, TypeScript estrito. Sem `middleware.ts` e sem `@supabase/auth-helpers-nextjs`. `params` é Promise. Invalidação de tela de dinheiro por `revalidatePath`.

## Já está no repositório

- Migrations aplicadas: fundação, trava da função de plataforma, `payment_accounts`, rename do catálogo.
- `src/data/supabase/database.types.ts` e os aliases em `contract.ts`.
- Domínio com teste sem banco: `money`, `receipt`, `rpc`, `reviewReceipt`, `submitReceipt`. `npm test` e `npm run typecheck`.
- Nome SiloPay no navegador usa Handel Gothic D Bold (`src/app/fonts/handel-gothic-d-bold.otf`). O restante da interface continua na fonte do sistema.
- Comprovante com foto: bucket privado `receipts` (JPG, PNG ou WebP, até 5 MB). O navegador sobe o arquivo em `{empresa}/{funcionario}/{uuid}.ext`. A action recebe o caminho. A fila pede URL assinada de 10 minutos. A RPC só grava se o objeto já existe nessa pasta.

As views geradas marcam colunas como anuláveis. Quem lê em `src/data` é que descarta linha sem os centavos. O domínio não recebe `null` no lugar de saldo.

## Ordem do código que ainda falta

1. App Next: proxy, clientes Supabase, `reads` / `mutations`, login, layout por papel, `/admin` e `/campo` lendo as views. A baixa chama `reviewReceipt`. O funcionário envia comprovante no modal de `/campo?enviar=1`.
2. Flutter (Android e iOS), só depois deste app Next fechado. O contrato continua o SQL. O Flutter não importa `src/domain`.
3. Gateway real fica fora deste ciclo. O saldo da empresa entra em `/admin/pagamentos` por `adicionar_saldo_empresa`. O envio na ficha chama `enviar_saldo_colaborador`.
4. Devolução da sobra na ficha, por `devolver_sobra`. O login do colaborador nasce no cadastro: `cadastrar_funcionario_com_acesso` liga o usuário já criado como colaborador. A senha temporária vale 24 horas e `confirmar_senha_inicial` libera o uso. `vincular_funcionario_por_email` saiu do app.

## Consequências

- Um usuário pertence a uma empresa. Não há cookie de workspace.
- A service role não vai para o navegador. No servidor, ela só cria ou troca a senha do colaborador e atende o webhook.
- Mudança de saldo, papel ou gateway que não esteja em `docs/business_rules.md` para e pergunta. Não entra default de mercado.
