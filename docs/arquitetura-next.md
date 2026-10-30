# Arquitetura do Next.js

Base lida na documentação: Next.js 16.2.9 (App Router) e `@supabase/ssr` 0.12.5. Node.js 24.x (`engines.node`: `24.x`). TypeScript 5.1 ou mais novo. React 19.2. Turbopack é o padrão de `dev` e `build`.

O Next.js 16 ainda aceita Node 20.9 como mínimo de execução. Essa linha encerrou em 30 de abril de 2026 e a Vercel tirou o 20 de builds e functions em 1 de outubro de 2026. O runtime do projeto é o 24, padrão atual da Vercel, com correção até 30 de abril de 2028. O 22 ainda existe na Vercel, mas encerra em 30 de abril de 2027. O 26 entrou em LTS em 28 de outubro de 2026 e ainda não é runtime de function na Vercel.

Este projeto é o cliente web dos dois papéis e o único processo que fala com o gateway. O saldo continua no Postgres. O navegador não recalcula dinheiro. O domínio pede uma transferência; o adaptador, escolhido por `provider`, fala com o gateway.

## Quatro entradas

Cada uma é um POST ou uma página que o cliente alcança direto. Travar a página não trava a ação.

| Entrada | Arquivo | O que faz | O que não faz |
|---|---|---|---|
| Proxy | `src/proxy.ts` | Renova o cookie de sessão do Supabase e manda quem não está logado para `/login` | Autorizar papel, dar baixa, chamar o gateway |
| Server Component | `src/app/**/page.tsx` | Lê a view com a sessão do usuário e mostra um DTO | Mutar saldo |
| Server Action | `src/presentation/actions/*.ts` | Comprovante, baixa, pedido de Pix. Confere sessão e papel de novo, valida o corpo, chama o caso de uso | Confiar no `tenant` ou no `employee_id` vindos do formulário como prova de permissão |
| Route Handler | `src/app/api/payments/[provider]/webhook/route.ts` | Recebe o gateway, confere o segredo daquela conta, grava com a chave secreta do Supabase | Usar cookie de usuário. O gateway não tem sessão |

O proxy roda em Node.js. Não existe `runtime` nesse arquivo. O nome antigo `middleware.ts` e a função `middleware` ficaram para trás no Next.js 16; o arquivo é `proxy.ts` e a função é `proxy`.

O `@supabase/ssr` exige esse passo na borda: página de servidor lê cookie, mas não grava cookie. Sem o `setAll` no proxy, a sessão expirada não renova quando a pessoa abre o site no dia seguinte. O pacote antigo `@supabase/auth-helpers-nextjs` não entra.

O webhook fica fora do matcher do proxy. A proteção dele é o segredo cifrado da conta, não o login. O `[provider]` só escolhe o adaptador que sabe ler o corpo daquele gateway.

## Arquitetura limpa

Três pastas, com uma regra de importação. O Next.js exige `src/app` para rota, então a página fica fora de `presentation`, mas só compõe: não lê tabela, não chama o gateway e não calcula saldo.

| Camada | Pasta | Pode importar | Não pode |
|---|---|---|---|
| Domínio | `src/domain` | Nada de framework | `next`, Supabase, HTTP de gateway, React |
| Dados | `src/data` | `domain` e os SDKs | `app`, componente, `next/navigation` |
| Apresentação | `src/presentation` e `src/app` | `domain` e o caso de uso já montado | Cliente Supabase, chave, query solta |

O saldo não é reimplementado no TypeScript. A view entrega o número. O domínio guarda o que a tela precisa garantir antes da RPC: centavos inteiros, valor maior que zero, valor aceito entre zero e o informado, categoria da lista. O caso de uso devolve sucesso ou erro. Quem chama `forbidden()` e `revalidatePath` é a action, na apresentação.

O Flutter não importa esse `domain`. O contrato compartilhado entre os dois clientes continua o do banco: view para leitura, RPC para mutação, regras em `business_rules.md`. Duplicar a fórmula do saldo em TypeScript e em Dart faria os dois divergirem.

## Árvore

```
src/
  proxy.ts
  domain/
    money.ts                 # centavos e faixa do valor aceito
    receipt.ts               # categoria e estados do comprovante
    ports.ts                 # contratos de leitura, RPC e Pix
    review-receipt.ts        # caso de uso: porta entra, resultado sai
    request-transfer.ts
  data/
    supabase/
      server.ts              # createServerClient
      browser.ts             # createBrowserClient, só no login e no upload
      session-proxy.ts
      reads.ts               # só v_*
      mutations.ts           # só rpc
    payments/
      gateway.ts             # escolhe o adaptador pelo provider da conta
      <provider>/
        client.ts            # server-only. Um gateway, um adaptador
    index.ts                 # liga as portas às implementações
  presentation/
    actions/
      submit-receipt.ts
      review-receipt.ts
      request-transfer.ts
    components/              # preview da foto, formulário
  app/
    (public)/login/page.tsx
    (session)/layout.tsx
    (session)/admin/...
    (session)/campo/...
    api/payments/[provider]/webhook/route.ts
```

Módulo com chave ou regra de escrita começa com `import 'server-only'`. Se um componente cliente importar esse arquivo, o build quebra.

`page.tsx` e `route.ts` não dividem o mesmo segmento.

## Sessão e papel

Dois clientes Supabase, os dois do `@supabase/ssr`:

- Servidor: `createServerClient(url, chave pública, { cookies: { getAll, setAll } })`. Nas páginas, `setAll` pode falhar; a renovação real está no proxy.
- Navegador: `createBrowserClient`. Serve o login e o upload da foto. Não chama o gateway e não usa a chave secreta.

Variáveis:

| Nome | Onde vive |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente e servidor |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cliente e servidor. É a chave pública (no painel antigo, anon) |
| `SUPABASE_SECRET_KEY` | Só o webhook. Sem prefixo `NEXT_PUBLIC_` |
| `PAYMENT_KEYS_ENCRYPTION_KEY` | Só o servidor. Cifra a chave de API e o segredo de webhook de cada empresa |

A chave de cada empresa não vai para variável de ambiente do projeto. Fica cifrada em `payment_accounts` e só o adaptador daquele `provider` decifra.

O papel não mora num cookie. O proxy só sabe se há sessão. O layout `(session)` chama `verifySession()` e lê o vínculo (`admin` ou `funcionario`) no banco. Cada Server Action chama `verifySession()` de novo. Papel errado usa `forbidden()`, de `next/navigation`.

`params` e `searchParams` são Promise. Em página e route: `const { id } = await props.params`.

## Leitura e escrita

A página lê view com o cliente da sessão, então a RLS vale:

- funcionário: `v_minha_subconta`, `v_meu_extrato`
- admin: `v_fila_comprovantes`, `v_subconta_funcionario`

A action de comprovante e a de baixa chamam a RPC com o mesmo cliente da sessão. O Postgres recusa o que o papel não pode. O Next.js recusa antes, para a tela não depender só do erro do banco.

Pedido de Pix:

1. A action confere admin e valida valor e funcionário da mesma empresa.
2. A RPC abre a ordem pendente.
3. O adaptador em `data/payments/<provider>` envia o Pix com a referência igual ao id da ordem. O caso de uso pede isso pela porta. A action não chama o HTTP do gateway.
4. O saldo só muda quando o webhook daquele gateway confirma a transferência.

O webhook é o único uso da chave secreta do Supabase. Ele grava o lançamento de forma idempotente por `provider_transfer_id`. Falha e cancelamento não geram lançamento.

Foto: bucket privado. O navegador sobe o arquivo pela política do Storage, na pasta da própria empresa e do próprio usuário. A action recebe o caminho, não o binário. A empresa vê a imagem por URL assinada, curta, gerada no servidor.

Depois de uma baixa ou de um comprovante, `revalidatePath` da fila e do extrato. Essas telas usam cookie, então não são estáticas. `revalidateTag` no Next.js 16 pede o segundo argumento (perfil de cache); enquanto der para invalidar pelo path, fica no path.

## Server Action

Tratar como endpoint público. O id da action muda a cada build, e isso não substitui login.

Em toda action:

- sessão lida no servidor, nunca um user id enviado pelo formulário
- o id de funcionário ou de comprovante é só o alvo; a permissão sai do vínculo no banco e da RLS
- corpo validado (valor em centavos, categoria da lista fechada) antes da RPC
- retorno enxuto: situação e mensagem. Sem linha inteira do banco e sem chave
- origem cruzada: o Next.js só aceita a própria origem. `serverActions.allowedOrigins` só entra se um proxy reescrever o host e o `x-forwarded-host` deixar de bater com o site

## Rotas

Grupos `(public)` e `(session)` não aparecem na URL.

| URL | Papel | Função |
|---|---|---|
| `/login` | público | Entrar |
| `/admin` | admin | Funcionários e saldo de cada subconta |
| `/admin/funcionarios/novo` | admin | Cadastro e chave Pix |
| `/admin/funcionarios/[id]` | admin | Extrato, transferir, reembolsar, pedir devolução |
| `/admin/comprovantes` | admin | Fila |
| `/admin/comprovantes/[id]` | admin | Foto, valor informado, valor aceito |
| `/admin/pagamentos` | admin | Conectar a conta no gateway, sandbox primeiro |
| `/campo` | funcionário | Transferido, em análise, baixado, saldo |
| `/campo/comprovantes/novo` | funcionário | Foto, valor, categoria |
| `/campo/comprovantes` | funcionário | Estado de cada comprovante |
| `/api/payments/[provider]/webhook` | gateway | Confirmação de Pix e de devolução |

No navegador largo, a fila fica ao lado da foto. No estreito, empilha. Componente cliente só no preview da foto e no formulário. O resto é Server Component.

## Tema

O tema atual dessa stack é o **base-nova** do shadcn/ui, em cima de Tailwind CSS v4. A cor base é `neutral`. Os tokens são variáveis CSS em OKLCH, com claro e escuro. Não há `tailwind.config.js`.

Quando o app for criado, `components.json` fica assim:

```json
{
  "style": "base-nova",
  "rsc": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

`globals.css` importa `tailwindcss` e `shadcn/tailwind.css`, declara `@custom-variant dark (&:is(.dark *))` e mapeia as cores em `@theme inline`. O raio padrão é `0.625rem`. O scaffold completo sai do `npx shadcn@latest init`, não de uma cópia manual de tutorial antigo.

O escuro segue o sistema. O layout raiz usa `suppressHydrationWarning` no `html` e um `ThemeProvider` com `attribute="class"`, `defaultTheme="system"`, `enableSystem` e `disableTransitionOnChange`. Esse provider é o único cliente obrigatório em volta da árvore.

Botão, diálogo, select e aba vêm do shadcn, que por baixo usa Radix. Variante de componente nosso usa CVA. Cor de saldo, erro e sucesso usa os tokens (`primary`, `destructive`, `muted`), não hex solto na tela.

## O que fica de fora

- `pages/`, `getServerSideProps`, `middleware.ts`
- `@supabase/auth-helpers-nextjs`
- `tailwind.config.js` e tema `new-york` do shadcn antigo
- chave do gateway, chave secreta do Supabase ou fórmula de saldo no bundle do navegador
- service role em página, action de usuário ou componente cliente
- cache estático de saldo, fila ou extrato
