---
name: project-crm-toposcan
description: "CRM Toposcan no GitHub — arquitetura V7.5, 4 áreas integradas, Central de Inteligência, 4 gerentes Claude"
metadata: 
  node_type: memory
  type: project
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# CRM Toposcan — Estado completo (V7.5 — 22/05/2026)

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

## Arquitetura — 4 áreas integradas

| Área | Frontend (tab) | Planilha (16 col) | Módulo Code.js |
|---|---|---|---|
| 🎯 Vendas | Oportunidades/Pipeline/Evolução | `CRM Consolidado` | V3.1 (agentFind/Update/etc) |
| 💰 Financeiro | 💰 Financeiro | `Financeiro` (14 col) | V4.0 (~150 linhas) |
| 💼 Operação | 💼 Custos de Operação | `TopoPartners` (categoria em P) | V5.0 |
| 🛠️ Engenharia | 🛠️ Engenharia | `Producao` | V6.0 |
| **🎯 Central** | **🎯 Central (privada)** | (consolidado das 4) | V7.0+V7.5 |

**Chave universal:** `numeroProposta` amarra tudo (ex: `06202534.0`).

## Backend (GAS)

- **Spreadsheet ID:** `1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4`
- **Script ID:** `1Pxlm30KKFm2z2Zcc8I4tLZfIa_Y5Yimh9GbD62cZWSdkSPANM59tJXBK`
- **Code.js:** `C:\Users\23GAMER\.gemini\antigravity\scratch\clasp-crm\Code.js` (~2400 linhas)
- **Deployment estável:** `AKfycbz_EE5M_grgoMdkjs7OJHHlDPSQB8qH-oJ4T6Pqg-0qDZYWq1qTZv_sZeJ6mXU-5-Gt3A` (mantido entre versões)
- **Atual:** V7.7 @24 (deployed 23/05/2026)

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

Usuários autenticados (mesma senha hash):
- admin@toposcan.com.br · guilherme@toposcan.com.br · marcelo@toposcan.com.br · allana@toposcan.com.br · rafaela@toposcan.com.br

## Os 4 Gerentes Claude (claude.ai/Projects)

Cada um com identidade primária + conhecimento total cross-area + 4 actions de Email/Meet:

| Project ID | Identidade primária |
|---|---|
| `019e08c9-697e-731a-95d9-45ecb4a9fd62` | 🎯 Comercial (Vendas/Funil) |
| `019e523e-a9f8-72c5-b115-1a9e7fb8f563` | 💰 Financeiro |
| `019e45c7-5a18-77d5-bef4-6648502be4cd` | 💼 Operação |
| `019e51fc-bf69-7765-892f-cdfe7daec5fd` | 🛠️ Engenharia (Super Gerente) |

Prompts no repo: `PROMPT-CLAUDE-{COMERCIAL,FINANCEIRO,OPERACAO,ENGENHARIA}.md` (~500-600 linhas cada).

**Padrão de reaplicação:** Chrome MCP injeta conteúdo do GitHub API em cada Project automaticamente. Ver `technical_patterns_gas_oauth_chrome.md`.

## Agentes autônomos (Triggers Google)

Rodando 24/7 sem intervenção, enviam pra **guilherme@toposcan.com.br + marcelo@toposcan.com.br**:

- 8h diário — `dailyMorningBrief` (briefing + 5 alertas top)
- 10h+16h diário — `detectInadimplencia` (se houver atraso)
- Segunda 9h — `weeklyStrategicReport`

**Quota:** 100 emails/dia. Gasto típico: 5-15/dia.

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
