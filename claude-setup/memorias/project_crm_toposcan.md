---
name: project-crm-toposcan
description: "CRM Toposcan no GitHub — V7.12 (4 áreas + Aprendizados), 4 gerentes Claude nomeados (Rafaela/Beatriz/Vanessa/Fernanda)"
metadata: 
  node_type: memory
  type: project
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# CRM Toposcan — Estado completo (V7.12 — 26/05/2026)

**Repositório:** https://github.com/toposcansend-cmyk/CRM  
**Deploy:** https://toposcansend-cmyk.github.io/CRM/  
**Conta GitHub:** toposcansend-cmyk (email: toposcan.send@gmail.com)  
**Frontend principal:** `crm.html` (~7700 linhas, single-page app)

## Linha do tempo de gestão

1. **Antigravity Bot** — 2026-02-25: estrutura inicial, data_v10.js
2. **Guilherme** — commits manuais: filtros vendedor, correções
3. **OpenClaw Caretaker** — 03/13 a 04/24: Premium UI, sync Sheets
4. **Claude Code (eu)** — a partir de 2026-05-19, gestão transferida
   - 05/19 Financeiro V4 (parcelas, KPIs, 37 fechadas seeded)
   - 05/20 TopoPartners V5 (5 categorias de custo, margem real -11% imposto)
   - 05/21 Engenharia V6 (matriz subitem×fase, 11 projetos, 115 tarefas seeded)
   - 05/22 **V7.0 Central de Inteligência** + 4 gerentes Claude unificados nos Projects
   - 05/22 **V7.5 Assistente Pessoal** (email + Meet sob comando) + auth completa
   - 05/23 **V7.6** monitor de triggers (`getTriggersHealth` + instrumentação `_recordTriggerRun`) + smoke test infra + backup Git memórias
   - 05/23 **V7.7** triggers diários removidos a pedido do Guilherme. Apenas 2 emails/semana: segunda 9h (plano) + sexta 16h (recap)
   - 05/24 — V7.8 Fluxo de Caixa, V7.9 redesenho timeline, V7.10 pagos com badge, V7.11 sync memórias entre PCs
   - 05/26 **V7.12** Aprendizados — aba `Aprendizados` (9 col) + 5 actions (`ensure/add/get/update/delete`) = memória institucional ilimitada das IAs gerentes (substitui o teto 30×500 do claude.ai nativo)
   - 05/26 — **Os 4 gerentes Claude ganham nomes:** Rafaela (Comercial) · Beatriz (Engenharia) · Vanessa (Financeiro) · Fernanda (Operação)

## Arquitetura — 4 áreas integradas

| Área | Gerente IA | Frontend (tab) | Planilha | Módulo Code.js |
|---|---|---|---|---|
| 🎯 Vendas | **Rafaela** ([[project-rafaela-gerente-comercial]]) | Oportunidades/Pipeline/Evolução | `CRM Consolidado` (16 col) | V3.1 |
| 🛠️ Engenharia | **Beatriz** ([[project-beatriz-gerente-engenharia]]) | 🛠️ Engenharia | `Producao` (16 col) | V6.0 |
| 💰 Financeiro | **Vanessa** ([[project-vanessa-gerente-financeiro]]) | 💰 Financeiro / 💸 Fluxo de Caixa | `Financeiro` (14 col) | V4.0 + V7.8 |
| 💼 Operação | **Fernanda** ([[project-fernanda-gerente-operacao]]) | 💼 Custos de Operação | `TopoPartners` (16 col) | V5.0 |
| **🎯 Central** | (todos) | 🎯 Central (privada `?central=1`) | (consolidado) | V7.0+V7.5 |
| **🧠 Memória** | Rafaela (principal) | (sem UI, só API) | `Aprendizados` (9 col) | V7.12 |

**Chave universal:** `numeroProposta` amarra tudo (ex: `06202534.0`).

## Backend (GAS)

- **Spreadsheet ID:** `1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4`
- **Script ID:** `1Pxlm30KKFm2z2Zcc8I4tLZfIa_Y5Yimh9GbD62cZWSdkSPANM59tJXBK`
- **Code.js:** `C:\Users\23GAMER\.gemini\antigravity\scratch\clasp-crm\Code.js` (~3303 linhas pós-V7.12)
- **Deployment estável:** `AKfycbz_EE5M_grgoMdkjs7OJHHlDPSQB8qH-oJ4T6Pqg-0qDZYWq1qTZv_sZeJ6mXU-5-Gt3A` (mantido entre versões — não criar deploy novo, sempre `clasp deploy -i <id>`)
- **Atual:** V7.12 @32 (deployed 26/05/2026) — Aprendizados

## Camada MCP (ponte claude.ai → webhook GAS) — NOVO 26/05/2026

- **URL pública:** `https://toposcan-crm-mcp.toposcan.workers.dev/mcp`
- **Stack:** Cloudflare Workers + Hono + TypeScript (35 tools)
- **Código:** `C:\Users\23GAMER\work\CRM\mcp-server\src\index.ts`
- **Conector claude.ai:** "Toposcan CRM" (account-level, auto-ativo nos 4 Projects)
- **Por quê:** claude.ai não tem fetch HTTP arbitrário; as 4 IAs gerentes precisavam de adapter pra chamar o webhook
- **Ver:** [[project-mcp-toposcan-crm]] e [[technical-patterns-mcp-server]]

## Frontend (crm.html)

**Abas visíveis (em ordem):**
- Oportunidades · Pipeline · Evolucao · Follow-up · Orcamento · 💰 Financeiro · 💼 Custos de Operação · 🛠️ Engenharia

**Abas privadas (escondidas por default):**
- 🎯 Central — desbloqueio: `?central=1` ou Ctrl+Shift+G
- Insights, KPIs — `display:none` permanente

**Recursos UI especiais:**
- Sort por coluna em Oportunidades (click no header)
- Edição inline em Engenharia (click direto na fase/responsável/data)
- Barras HSL coloridas em Engenharia (0%=vermelho, 100%=verde, com thumb arrastável)
- Esconde projetos 100% concluídos da lista Engenharia (com banner)
- Auto-cascata visível ao fechar proposta (logs no observação)

## Login SHA-256

Usuários humanos autenticados (mesma senha hash):
- admin@toposcan.com.br · guilherme@toposcan.com.br · marcelo@toposcan.com.br · allana@toposcan.com.br
- ~~rafaela@toposcan.com.br~~ — vendedora desligada; o nome "Rafaela" agora é a IA gerente Comercial (não loga no CRM, opera via webhook)

## Os 4 Gerentes Claude (claude.ai/Projects) — nomeados em 26/05/2026

Cada um com identidade primária + conhecimento total cross-area + 4 actions de Email/Meet + 5 actions de Aprendizados (V7.12):

| Project ID | Nome IA | Identidade | Stakeholder principal |
|---|---|---|---|
| `019e08c9-697e-731a-95d9-45ecb4a9fd62` | **Rafaela** | 🎯 Comercial (Vendas/Funil) | Guilherme |
| `019e51fc-bf69-7765-892f-cdfe7daec5fd` | **Beatriz** | 🛠️ Engenharia (Produção/Modelagem) | Marcelo |
| `019e523e-a9f8-72c5-b115-1a9e7fb8f563` | **Vanessa** | 💰 Financeiro (A receber/Margem) | Ambos |
| `019e45c7-5a18-77d5-bef4-6648502be4cd` | **Fernanda** | 💼 Operação (Parceiros/Equip/Veículos) | Marcelo |

Prompts no repo: `PROMPT-CLAUDE-{COMERCIAL,FINANCEIRO,OPERACAO,ENGENHARIA}.md` (~500-600 linhas cada).

**Padrão de reaplicação:** Chrome MCP injeta conteúdo do GitHub API em cada Project automaticamente. Ver `technical_patterns_gas_oauth_chrome.md`.

## Agentes autônomos (Triggers Google) — pós V7.7

Rodando 24/7 sem intervenção, enviam pra **guilherme@toposcan.com.br + marcelo@toposcan.com.br**:

- **Segunda 9h** — `mondayPlanningBrief` (Plano da semana, top 10 ações)
- **Sexta 16h** — `fridayWeekRecap` (Recap: recebido, concluído, em aberto)

⚠️ Triggers diários (dailyMorningBrief, detectInadimplencia, weeklyStrategicReport) **REMOVIDOS** em 23/05/2026 a pedido do Guilherme. Funções continuam no código como "morte cerebral", chamáveis via `runDailyBriefNow`/`runMondayPlanNow`/`runFridayRecapNow`.

**Quota:** 100 emails/dia (workspace). Gasto típico: 4 emails/semana.

## Dados populados (snapshot 22/05)

- 37 propostas Fechadas históricas (R$ 521.800 total) em Financeiro
- 11 projetos ativos com 115 tarefas em Engenharia
- 8 tarefas em andamento, 10 concluídas no mês
- R$ 109.966 a receber em 30d, R$ 31.060 em custos do mês

## Deploy workflow

**Frontend:** push para `main` → GitHub Actions copia `crm.html` → `index.html` em `deploy/` → GitHub Pages publica (~20-30s).

**Backend (GAS):**
```bash
cd C:\Users\23GAMER\.gemini\antigravity\scratch\clasp-crm
clasp push --force
clasp deploy -i AKfycbz_EE5M_grg... -d "V7.x descrição"
```

Mantém URL estável entre versões.

## Documentos no repo

- `ROTINAS-AGENTES.md` — guia da Central V7.0
- `PROMPTS-CLAUDE-LEIA-PRIMEIRO.md` — guia de aplicação dos 4 prompts
- `PROMPT-CLAUDE-*.md` — os 4 prompts unificados
- `COMO-PUBLICAR-FINANCEIRO.md`, `COMO-PUBLICAR-WEBHOOK.md` — docs históricos
