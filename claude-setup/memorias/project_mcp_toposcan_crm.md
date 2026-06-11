---
name: project-mcp-toposcan-crm
description: "Servidor MCP que wrappea o webhook CRM V7.12 — 35 ferramentas usadas pelas 4 IAs gerentes via claude.ai. Deployed em Cloudflare Workers, criado em 26/05/2026."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31834073-2e7f-4248-8498-47bd4242e065
---

# 🌐 MCP Toposcan CRM — servidor de ferramentas pras 4 IAs

Criado em **26/05/2026** pra resolver o gap: as IAs gerentes na claude.ai não tinham ferramenta nativa pra POST arbitrário ao webhook. Agora chamam ações via tools MCP nomeadas (ex: `crm_get_cross_kpis`, `crm_list_producao`).

## Endpoint público

```
https://toposcan-crm-mcp.toposcan.workers.dev/mcp
```

- **GET /** → info do servidor + lista de endpoints
- **GET /health** → smoke do webhook upstream
- **POST /mcp** → JSON-RPC 2.0 (initialize, tools/list, tools/call)

## Stack técnica

- **Runtime:** Cloudflare Workers (free tier, 100k req/dia, edge global, sem cold start)
- **Framework:** Hono 4.x
- **Linguagem:** TypeScript (ES2022)
- **Protocolo:** MCP JSON-RPC 2.0 (Streamable HTTP, stateless)
- **Conta Cloudflare:** `9857af7323ac99bc3bda79b163b2f2ae` (toposcan.send@gmail.com)
- **Subdomínio Workers:** `toposcan` (toposcan.workers.dev)

## Código fonte

`C:/Users/23GAMER/work/CRM/mcp-server/`
- `src/index.ts` — ~750 linhas, servidor completo
- `wrangler.toml` — config Workers + var WEBHOOK_URL
- `package.json` — deps (hono, wrangler)

## Deploy workflow

```powershell
cd C:\Users\23GAMER\work\CRM\mcp-server
npx wrangler deploy
```

**Secret management** (⚠️ não usar pipe PowerShell — injeta newline):
```bash
TOKEN='<wrangler OAuth token>'
ACCOUNT='9857af7323ac99bc3bda79b163b2f2ae'
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/scripts/toposcan-crm-mcp/secrets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"WEBHOOK_SECRET","text":"toposcan-agent-2026","type":"secret_text"}'
```

## 35 ferramentas expostas

| Área | Ferramentas (prefixo `crm_`) |
|---|---|
| 🎯 Vendas | `list_all`, `find`, `update`, `bulk_update`, `add_lead` |
| 💰 Financeiro | `add_payment_plan`, `list_payments`, `update_payment`, `mark_paid`, `get_finance_kpis`, `get_cash_flow`, `get_cash_balance`, `set_cash_balance` |
| 💼 Operação | `add_topo_partner`, `list_topo_partners`, `update_topo_partner`, `delete_topo_partner`, `get_topo_partners_kpis` |
| 🛠️ Engenharia | `add_producao`, `bulk_add_producao`, `list_producao`, `update_producao`, `get_producao_kpis` |
| 🎯 Central | `get_cross_kpis`, `get_active_alerts`, `get_daily_briefing` |
| 🧠 Aprendizados V7.12 | `ensure_aprendizados`, `add_learning`, `get_learnings`, `update_learning`, `delete_learning` |
| 📧🗓️ Assistente | `send_email`, `create_meet_event`, `list_meet_suggestions`, `list_upcoming_events` |
| 📋 Propostas (Camila, 10/06) | `next_proposal_number`, `generate_proposal` |

> **v1.3.0 (10/06/2026):** 42 tools (era 35) — +`crm_next_proposal_number` +`crm_generate_proposal` pra Camila (5ª gerente). Deploy confirmado: health `tools_count:42`, Version ID `bd6a6438`.
> ⚠️ Verificar: `nextProposalNumber` retornou 108 (GAS direto) e 201 (via MCP) em chamadas próximas — checar determinismo do scan de sequencial (possível E032).

## Como conecta nas IAs

1. Criado em `claude.ai → Personalizar → Conectores → "+" → Adicionar conector personalizado`
2. Nome: **"Toposcan CRM"** — URL: o endpoint MCP acima
3. **Account-level** → propaga AUTOMATICAMENTE pros 4 Projects (Rafaela, Beatriz, Vanessa, Fernanda)
4. Cada IA vê as 42 tools no toolbox dela (35 + 2 Camila = 42; jun/2026)

## Smoke test ao vivo (26/05/2026)

Mensagem enviada à Beatriz: *"chama crm_get_cross_kpis e me mostra saude geral + a receber 30d + projetos ativos engenharia"*. Resposta:

| Indicador | Valor |
|---|---|
| Saúde geral | 100/100 |
| A receber 30d | R$ 127.533,32 |
| Projetos ativos engenharia | 13 |

Números batem com chamada direta ao webhook GAS. Confirma camada MCP funcional ponta a ponta.

## Custo

**Zero.** Cloudflare Workers Free + Google Apps Script (já existia) + claude.ai Plano Max (já existia).

## Manutenção / evolução

**Adicionar nova ferramenta:**
1. Adicionar action no Code.js (Apps Script) — `clasp push` + `clasp deploy -i <id>`
2. Adicionar entrada no array `TOOLS` em `mcp-server/src/index.ts`
3. `npx wrangler deploy` (no diretório mcp-server)

**Trocar webhook URL** (ex: migrar Apps Script): atualizar `WEBHOOK_URL` em `wrangler.toml` + redeploy.

**Logs:**
```
npx wrangler tail
```

## Limitações conhecidas

- Cloudflare Workers timeout: 30s soft, 6 min hard — chamadas longas do GAS podem cair (raras)
- Apps Script tem 6 min execution limit por request
- Quota Apps Script: 100 emails/dia (compartilhada com triggers V7.7)
- Secret atual hardcoded no env do Worker — rotação requer redeploy

## Referências

- `[[reference-crm-api]]` — actions originais do webhook V7.12
- `[[error-patterns]]` E017-E019 — pitfalls do deploy Cloudflare
- `[[project-crm-toposcan]]` — estado consolidado do CRM
