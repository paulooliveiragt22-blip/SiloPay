# Planejamento

Ciclo atual: só este planejamento. Banco e código começam depois, nesta ordem, sem pular etapa.

As regras de dinheiro estão em [business_rules.md](business_rules.md). Se o plano e as regras divergirem, vale a regra de negócio.

## Decisão de stack

O navegador fica em Next.js, no Node da Vercel. O smartphone fica em Flutter. Os dois papéis existem nos dois.

Flutter no navegador carrega um runtime grande, atrasa a primeira abertura e piora fila, formulário e tabela — que é o trabalho da empresa. Next.js abre como site, encaixa a foto ao lado do valor e concentra no mesmo projeto as rotas do gateway.

| Onde | O que abre | Quem |
|---|---|---|
| Navegador | Next.js na Vercel | Admin e funcionário |
| Smartphone | Flutter (Android e iOS) | Admin e funcionário |
| Navegador do telefone | O mesmo Next.js | Quem ainda não instalou o app |

| Peça | Função |
|---|---|
| Next.js na Vercel | Telas do navegador e, no mesmo Node, Pix, cobrança de devolução e webhook |
| Flutter | Telas do aparelho, câmera e fila de foto sem rede |
| Supabase | Login, dados, fotos, leitura em views, comprovante e baixa em RPC |

A baixa e o comprovante existem nas duas interfaces. O saldo, a permissão e a conta de pagamento existem uma vez. A chave do gateway fica só no Node, atrás de um adaptador. O domínio não sabe qual gateway é.

O navegador é Next.js 16 (App Router), com a borda em `src/proxy.ts` e as pastas `domain`, `data` e `presentation`. Detalhe em [arquitetura-next.md](arquitetura-next.md).

## Fora deste ciclo

- Mensalidade do SaaS e subconta no gateway criada pela Zampell
- Cartão corporativo
- OCR de cupom
- Cadastro de fazenda, talhão e frota (no comprovante, isso é texto livre)
- Limite automático por funcionário
- Vários papéis além de admin e funcionário

O banco já nasce com empresa em toda linha, para um segundo cliente não exigir outro desenho. O primeiro uso pode cadastrar empresas à mão.

## Entidades

Conceito para a migração futura. Ainda não é SQL.

| Entidade | Guarda |
|---|---|
| empresa | Nome, CNPJ, situação |
| vínculo | Usuário, empresa, papel (`admin` ou `funcionario`) |
| funcionário | Nome, CPF, tipo e valor da chave Pix, situação, usuário |
| conta de pagamento | `provider` do adaptador, id da conta no gateway, chave e segredo do webhook cifrados, sandbox ou produção. A chave não fica numa coluna legível |
| ordem de Pix | Funcionário, tipo (`adiantamento` ou `reembolso`), centavos, situação, id da transferência no gateway, referência externa |
| lançamento | Tipo, centavos, ordem ou comprovante ou cobrança de origem. Sem update |
| comprovante | Valor informado, valor aceito, situação, categoria, foto, texto opcional de fazenda/placa, quem baixou e quando |
| cobrança de devolução | Funcionário, centavos, situação, id da cobrança no gateway |

Situação da ordem: pendente, confirmada, falhou, cancelada.

Situação do comprovante: em análise, aprovado, parcial, recusado.

## O que o cliente lê e o que o servidor grava

Leitura, quando o banco existir:

- `v_minha_subconta` — transferido, em análise, baixado, saldo
- `v_meu_extrato` — lançamentos e comprovantes do funcionário
- `v_fila_comprovantes` — em análise, para o admin
- `v_subconta_funcionario` — o mesmo saldo, visto pelo admin

Gravação:

- `submit_receipt` — funcionário
- `review_receipt` — admin, uma vez, com o valor aceito
- transferência, reembolso, cobrança de devolução e webhook — só o serviço Node, com a chave do gateway

O webhook valida o segredo daquela conta. Confirmação da transferência gera adiantamento ou reembolso. Falha e cancelamento não geram lançamento. Pagamento recebido da cobrança de devolução gera o lançamento de devolução. O nome do evento fica no adaptador.

## Telas

As mesmas funções no Next.js e no Flutter. No telefone, a fila e o extrato empilham. No navegador largo, a fila fica ao lado da foto.

Admin:

1. Entrar
2. Lista de funcionários e saldo de cada subconta
3. Cadastro do funcionário com chave Pix
4. Transferir (adiantamento) e reembolsar
5. Fila de comprovantes: foto, valor informado, valor aceito
6. Extrato da subconta e ação de pedir a devolução da sobra
7. Conexão da conta de pagamento (sandbox primeiro)

Funcionário:

1. Entrar
2. Resumo: transferido, em análise, baixado, saldo
3. Enviar comprovante (foto, valor, categoria)
4. Lista dos comprovantes e o estado de cada um

## Ordem de construção

Quando este planejamento for aceito, a sequência é fixa.

1. **Banco.** Tabelas, views `v_*`, RPC de comprovante e de baixa, políticas para cada papel. Sem adaptador de gateway ainda. Transferência de teste pode nascer como ordem já confirmada, só para a baixa ter saldo — e sai quando o Pix real entrar.
2. **Navegador.** Next.js na Vercel, os dois papéis: resumo, comprovante e fila.
3. **Smartphone.** Flutter com as mesmas funções e a fila de foto sem rede.
4. **Gateway.** Primeiro adaptador em sandbox, nas rotas Node do mesmo projeto: Pix de adiantamento, Pix de reembolso, cobrança da sobra, webhook. A ordem deixa de ser confirmada na mão. Outro gateway entra como outro adaptador, com o mesmo contrato.

Cada etapa só começa com a anterior fechada: regras, depois banco, depois navegador, depois aparelho, depois dinheiro real de sandbox.
