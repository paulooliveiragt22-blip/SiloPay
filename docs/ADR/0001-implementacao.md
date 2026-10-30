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

Cliente da sessão nas páginas e nas actions. `createBrowserClient` só no login e no upload da foto. `SUPABASE_SECRET_KEY` só no webhook do gateway. `payment_accounts` não é lida pelo cliente.

### Gateway

O nome do provedor é a coluna `provider`. Tabela, coluna de domínio, enum e rota não citam um gateway. O adaptador em `src/data/payments/<provider>/` traduz o evento. A action não faz HTTP. Falha e cancelamento não geram lançamento. Id externo é `text`.

O adiantamento de teste (`registrar_adiantamento_teste`) existe para a baixa ter saldo. Sai quando o webhook confirmar a transferência.

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

1. App Next: proxy, clientes Supabase, `reads` / `mutations`, login, layout por papel, `/admin` e `/campo` lendo as views. A baixa chama `reviewReceipt`. O funcionário envia comprovante em `/campo/comprovantes/novo`.
2. Flutter, com o mesmo contrato SQL. Não importa `src/domain`.
3. Primeiro adaptador de gateway, em sandbox. Até lá não há webhook nem ordem pendente real.
4. Cadastro de funcionário em `/admin/funcionarios/novo` e a tela `/admin/funcionarios/[id]`. As RPCs `cadastrar_funcionario` e `vincular_funcionario` já existem.

## Consequências

- Um usuário pertence a uma empresa. Não há cookie de workspace.
- A service role não entra em página nem em action de usuário.
- Mudança de saldo, papel ou gateway que não esteja em `docs/business_rules.md` para e pergunta. Não entra default de mercado.
