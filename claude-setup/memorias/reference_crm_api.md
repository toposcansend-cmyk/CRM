---
name: reference-crm-api
description: Endpoint webhook do CRM Toposcan e ~30 actions suportadas — fonte da verdade técnica (V7.5)
metadata: 
  node_type: memory
  type: reference
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# CRM Toposcan — API Webhook (V7.12 — atualizado 26/05/2026)

## Acesso direto ao código fonte (clasp)

Projeto Apps Script está clonado localmente em `C:\Users\23GAMER\.gemini\antigravity\scratch\clasp-crm\`:
- `Code.js` — fonte completa (~2400 linhas, V7.5)
- `appsscript.json` — manifest com scopes + Advanced Service Calendar v3
- `.clasp.json` — `scriptId: 1Pxlm30KKFm2z2Zcc8I4tLZfIa_Y5Yimh9GbD62cZWSdkSPANM59tJXBK`
- Credenciais OAuth em `C:\Users\23GAMER\.clasprc.json` (login persistente)

**Workflow para evoluir o backend:**
1. Editar `Code.js` + `appsscript.json`
2. `clasp push --force`
3. `clasp deploy -i AKfycbz_EE5M_grgoMdkjs7OJHHlDPSQB8qH-oJ4T6Pqg-0qDZYWq1qTZv_sZeJ6mXU-5-Gt3A -d "V7.x descrição"` (mantém URL estável!)
4. Se adicionou novo scope: forçar autorização via `forceAuthX()` executada manualmente no editor
5. Testar com PowerShell `Invoke-RestMethod`

## Endpoint único (POST, Content-Type: text/plain)

```
https://script.google.com/macros/s/AKfycbz_EE5M_grgoMdkjs7OJHHlDPSQB8qH-oJ4T6Pqg-0qDZYWq1qTZv_sZeJ6mXU-5-Gt3A/exec
```

**Secret obrigatório em TODA requisição:** `toposcan-agent-2026`

## Actions por módulo (~30 actions totais)

### 🎯 Vendas / CRM Consolidado (16 colunas A-P)
| Action | Função |
|---|---|
| `listAll` | Lista propostas ativas (exclui Fechada/Perdida) |
| `find` | Busca por `cliente` ou `numeroProposta` — retorna TUDO inclusive Fechada |
| `update` | Edita 1 proposta (auto-cascata se status vira "Fechada") |
| `bulkUpdate` | Array de updates |
| `addLead` | Cria novo lead |

### 💰 Financeiro V4.0 (14 colunas — aba "Financeiro")
| Action | Função |
|---|---|
| `ensureFinanceiro` | Garante que aba existe |
| `addPaymentPlan` | Cria N parcelas (`replace:true` sobrescreve) |
| `listPayments` | Lista parcelas (filtros: filter/vendedor/numeroProposta/cliente/fromDate/toDate) |
| `updatePayment` | Edita parcela (rowIndex + fields{}) |
| `markPaid` | Marca paga (rowIndex + dataPagamento opcional) |
| `getFinanceKPIs` | KPIs agregados (aReceber30, recebidoMes, atrasado, previstoProxMes) |
| `seedHistorico` | One-shot: 37 fechadas históricas (já executado) |

### 💼 Operação V5.0 (TopoPartners — 16 colunas com `categoria` em P)
| Action | Função |
|---|---|
| `ensureTopoPartners` | Garante aba |
| `addTopoPartner` | Cria custo (categoria obrigatória) |
| `listTopoPartners` | Lista (filtros: parceiro/status/projeto/categoria) |
| `updateTopoPartner` | Edita custo |
| `deleteTopoPartner` | Remove (irreversível — tripla confirmação na UI) |
| `getTopoPartnersKPIs` | Métricas |

### 🛠️ Engenharia / Produção V6.0 (16 colunas)
| Action | Função |
|---|---|
| `ensureProducao` | Garante aba |
| `addProducao` | Cria 1 tarefa |
| `bulkAddProducao` | Cria N tarefas (`{itens: [...]}`) — usar sempre que possível |
| `listProducao` | Lista (filtros: projeto/numeroProposta/status/responsavel) |
| `updateProducao` | Edita tarefa |
| `deleteProducao` | Remove |
| `getProducaoKPIs` | Métricas |

### 🎯 Central de Inteligência V7.0 (cross-funcional)
| Action | Função |
|---|---|
| `getCrossKPIs` | KPIs consolidados das 4 áreas + margem real do mês (com -11% imposto) |
| `getActiveAlerts` | Alertas priorizados — inclui detecção CROSS (tarefa concluída → libera parcela) |
| `getDailyBriefing` | Briefing matinal pronto em texto |
| `installTriggers` | **V7.7** — Instala 2 triggers: segunda 9h + sexta 16h (reinstala limpo) |
| `uninstallTriggers` | Remove triggers (cobre nomes V7.0-V7.7) |
| `getTriggersHealth` | Health check dos triggers ativos (última execução + status). Read-only. |
| `runDailyBriefNow` | [legado] Dispara dailyMorningBrief por email (manual) |
| `runMondayPlanNow` | **V7.7** — Dispara mondayPlanningBrief agora (teste manual) |
| `runFridayRecapNow` | **V7.7** — Dispara fridayWeekRecap agora (teste manual) |
| `sendTestEmail` | Email de teste arbitrário (params: to, subject, text) |
| `diagEmail` | Diagnóstico de envio (quota, scopes, sample) — **⚠️ envia 2 emails reais, consome 2/quota** |

### 🧠 Aprendizados V7.12 (memoria institucional ilimitada — Rafaela)
| Action | Função | Parâmetros |
|---|---|---|
| `ensureAprendizados` | Garante aba `Aprendizados` (9 col: id/data/categoria/titulo/conteudo/tags/clienteRelacionado/numeroProposta/criadoEm) | — |
| `addLearning` | Insere lição (id auto `APR-NNNN`) | `titulo`*, `conteudo`*, `categoria?`, `data?`, `tags?`, `clienteRelacionado?`, `numeroProposta?` |
| `getLearnings` | Busca com filtros opcionais (todos AND) | `id?`, `categoria?`, `tags?` (CSV — todas presentes), `cliente?` (substring), `numeroProposta?`, `search?` (em titulo/conteudo/tags), `limit?` |
| `updateLearning` | Edita por id (campos editaveis: data/categoria/titulo/conteudo/tags/clienteRelacionado/numeroProposta) | `id`*, +campos |
| `deleteLearning` | Remove por id | `id`* |

**Categorias sugeridas:** `Cliente | Padrao | Regra | Webhook | Identidade | Fluxo | Equipe | Tecnico | Email | Financeiro` (não enforcado — campo livre)
**Chave de retorno em list:** `results` (não `itens` nem `parcelas`)

### 📧🗓️ Assistente Pessoal V7.5 (email + Meet)
| Action | Função | Parâmetros |
|---|---|---|
| `sendEmail` | Envia 1 email arbitrário | `to`, `subject`, `body`/`htmlBody`, `cc?`, `bcc?` |
| `createMeetEvent` | Cria evento Calendar com link Meet | `title`, `startISO`, `endISO`, `attendees[]`, `description?`, `timeZone?` |
| `listMeetSuggestions` | Sugere horários livres | `attendees[]`, `startISO`, `endISO`, `durationMinutes?`, `startHour?`, `endHour?` |
| `listUpcomingEvents` | Lista próximos eventos | `days?` (7), `max?` (20) |

### 🚨 Funções de force-auth (manter no Code.js — emergências futuras)
- `forceAuthEmail()` — força popup OAuth para `script.send_mail`
- `forceAuthTriggers()` — para `script.scriptapp` (também instala triggers)
- `forceAuthCalendar()` — para `calendar` + `calendar.events`

Executar do Editor sem try/catch — popup OAuth aparece naturalmente.

## OAuth scopes ativos (verificado 23/05/2026 via diagEmail)
```
✅ spreadsheets
✅ script.external_request
✅ script.send_mail (MailApp funcionando)
✅ script.scriptapp (triggers instalados)
✅ calendar + calendar.events
⚠️ userinfo.email — NÃO autorizado (Session.getEffectiveUser falha)
⚠️ mail.google.com / gmail.send — NÃO autorizado (GmailApp falha)
+ Advanced Service: Calendar v3 (para Meet conferenceData)
```

**Pendência:** rodar `forceAuthEmail()` e re-autorizar com scopes completos OU rodar nova função que toca GmailApp + Session.getEffectiveUser pra forçar popup OAuth. Não bloqueante (MailApp cobre envio de email).

## Padrões de Request

- **Datas:** `DD/MM/AAAA` (string) — ou `ISO 8601 com TZ` para Calendar (`2026-05-23T10:00:00-03:00`)
- **Valores:** number (`15000`), não string (`"R$15.000,00"`)
- **Status Vendas (col I):** Em análise / Em contato / Proposta enviada / Negociação / Fechada / Perdida
- **Status Produção:** Não iniciado / Em andamento / Em revisão / Concluído / Bloqueado / Retirada / N/A
- **Status Financeiro (derivado):** Pago / Pendente / Atrasado / Cancelado
- **Status Custos (derivado):** Pago / Parcial / Pendente
- **Categoria Custos:** Parceiro/Serviço · Equipamento · Veículo · Cartão de Crédito · Outros

## Dados de origem (planilha real)

- **Spreadsheet ID:** `1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4`
- **4 abas ativas:** `CRM Consolidado` (16) · `Financeiro` (14) · `TopoPartners` (16) · `Producao` (16)

## Agentes autônomos (Triggers do Google rodando 24/7) — V7.7

- **mondayPlanningBrief** — SEGUNDA 9h → 🎯 PLANO DA SEMANA (top 10 ações priorizadas por valor)
- **fridayWeekRecap** — SEXTA 16h → 📅 RECAP DA SEMANA (recebido, concluído, em aberto)
- **Total:** 2 triggers físicos no Apps Script (apenas 2 emails/semana)
- **Destinatários:** guilherme@toposcan.com.br + marcelo@toposcan.com.br
- **Quota:** 100 emails/dia (workspace) — gasto típico: 4 emails/semana
- **Mudança de destinatário:** `PropertiesService.getScriptProperties().setProperty('CENTRAL_EMAIL', 'a@x.com,b@y.com')`
- **V7.6 — Instrumentação:** cada execução grava `TRIGGER_RUN_<name>` no PropertiesService (lastRun + status + error). Consultar via `getTriggersHealth`.
- **V7.7 — Mudança em 23/05/2026:** triggers diários (dailyMorningBrief, detectInadimplencia, weeklyStrategicReport) REMOVIDOS a pedido do Guilherme. Funções mantidas como código morto (chamáveis via `runDailyBriefNow` se quiser disparar manualmente).

## Auto-cascata: ao virar Fechada

Quando `agentUpdate` muda status para "Fechada":
1. Adiciona observação automática em col M (timestamp + próximos passos)
2. Envia email para Guilherme+Marcelo: *"🎉 Fechou! Cliente · R$X"* com checklist (Financeiro/Engenharia/Operação)
3. Retorna `cascade` no response com info de próximos passos

## URLs úteis

- **CRM Frontend:** https://toposcansend-cmyk.github.io/CRM/
- **CRM Frontend + Central privada:** https://toposcansend-cmyk.github.io/CRM/?central=1
- **Apps Script Editor:** https://script.google.com/home/projects/1Pxlm30KKFm2z2Zcc8I4tLZfIa_Y5Yimh9GbD62cZWSdkSPANM59tJXBK/edit
- **Repo:** https://github.com/toposcansend-cmyk/CRM
