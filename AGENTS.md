# SiloPay

Fonte, nesta ordem se divergirem:

1. `docs/business_rules.md` — dinheiro, papéis, comprovante, gateway
2. `docs/arquitetura-next.md` — pastas, imports, rotas
3. `docs/planejamento.md` — ordem de construção

O produto é SiloPay. O banco remoto continua o projeto Supabase **gestor**, ref `rbgrdujuuriabpekltis`. Nunca aplicar SQL em outro projeto.

Contrato dos dois clientes (Next e Flutter): leitura em `v_*`, mutação em RPC, lançamento imutável. O domínio TypeScript não recalcula saldo.

Regras persistentes do agente: `.cursor/rules/`.
