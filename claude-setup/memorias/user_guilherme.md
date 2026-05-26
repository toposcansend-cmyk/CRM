---
name: user-guilherme
description: "Perfil do usuário Guilherme — dono da Toposcan, empresa de topografia/aerolevantamento em Curitiba"
metadata: 
  node_type: memory
  type: user
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# Guilherme — Dono da Toposcan (perfil comercial/estratégico)

- **Empresa:** Toposcan — serviços de topografia, aerolevantamento 3D e escaneamento a laser (LiDAR)
- **Localização:** Curitiba/PR, Brasil
- **Email pessoal/operacional:** **guilherme@toposcan.com.br** (canal oficial para briefings/relatórios)
- **Email GitHub:** toposcan.send@gmail.com (somente Git/deploy)
- **Sócio:** **Marcelo** (perfil técnico/operacional — ver [user_marcelo.md])
- **Perfil:** mais **comercial** e ligado à **estratégia/receita**
- **Vendedores no CRM:** Guilherme, Marcelo, Allana _(Rafaela vendedora humana desligada — nome agora é da IA gerente Comercial, ver `project_rafaela_gerente_vendas.md`)_

## Áreas onde Guilherme lidera (vs Marcelo)

| Área | Quem domina |
|---|---|
| 🎯 Vendas / Funil / Fechamento | **Guilherme** |
| 💰 Estratégia financeira / Margem | **Guilherme** |
| 📈 Visão estratégica / Crescimento | **Guilherme** |
| 🤝 Relacionamento com clientes-chave | **Guilherme** (closer) |
| 🛠️ Produção técnica | Marcelo |
| 💼 Operação (parceiros, equipamentos) | Marcelo |
| 🏗️ Coleta de campo | Ambos (mais Marcelo) |

## Sinais de identificação (quando Guilherme está falando)

Pistas linguísticas / de tópico:
- 💰 Vocabulário comercial: pipeline, deal, fechamento, follow-up, meta, receita, margem, projeção
- 👥 Cita vendedores e clientes-chave: Allana, CB Engenharia, UNILIVRE, SIMEPAR
- 📊 KPIs estratégicos: saúde da operação, pipeline ponderado, mês fechado
- 💸 Análise financeira: inadimplência, parcelas, recebimentos, margem real
- 🎯 Visão top-down: "como tá a operação?", "estratégia para crescer"
- 🚀 Cresimento, expansão, oportunidades

Pistas comportamentais:
- Comando direto + autonomia ampla ("execute sozinho")
- Foco em **resultado** (não em **como** fazer)
- Trata operação como sistema/negócio
- Pensa em meta, projeção, taxa de conversão
- Cobra verificação ("não recebi nada")

## Tratamento ideal com Guilherme

**Linguagem:**
- Business, direto, com números
- Bullets > parágrafos
- Cite **vendedor + cliente + R$ + ação** sempre
- Emojis estratégicos: 🔴 ⚠️ ✅ 💰 🏆 🎯 📊

**Conteúdo prioritário ao iniciar conversa:**
1. Saúde geral da operação (score 0-100)
2. Pipeline ativo + ponderado
3. Deals próximos do fechamento
4. Inadimplência crítica
5. Projeção do mês vs meta
6. Margem real do mês

**Quando ele perguntar algo técnico (cross-funcional):** executar normalmente E sugerir *"💡 Para deep-dive técnico, o Marcelo/Gerente Engenharia tem visão completa"*

## Canais para relatórios automáticos da Central V7.0
- guilherme@toposcan.com.br (dono — recebe TUDO)
- marcelo@toposcan.com.br (pleno — recebe briefings/alertas como co-gestor)

> **Importante:** quando enviar qualquer relatório, briefing ou alerta automático da Central de Inteligência, mandar para os DOIS emails acima (não para toposcan.send@gmail.com).

## Central de Inteligência V7.x — Status: ATIVA ✅ (autorizada 22/05/2026)
- **Scopes autorizados:** `script.send_mail`, `script.scriptapp`, `gmail.send`, `spreadsheets`, `script.external_request`, `userinfo.email`, `calendar`, `calendar.events`
- **Advanced Service ativo:** Calendar v3 (para conferenceData/Meet links)
- **3 agentes autônomos rodando 24/7 no Google:**
  - `dailyMorningBrief` — todo dia às 8h envia briefing completo
  - `detectInadimplencia` — 10h e 16h diários, alerta se houver inadimplência
  - `weeklyStrategicReport` — segunda-feira 9h, relatório estratégico
- **Quota:** 100 emails/dia (workspace) — cada envio para 2 destinatários conta 2 da quota
- **Gerenciamento via API:** `installTriggers`, `uninstallTriggers`, `runDailyBriefNow`, `sendTestEmail`, `diagEmail`
- **Funções "force auth":** `forceAuthEmail`, `forceAuthTriggers`, `forceAuthCalendar` (não remover — re-autorização futura)
- **Confirmação de envio:** Guilherme confirmou recebimento dos 2 primeiros emails de teste em 22/05/2026

## Assistente Pessoal V7.5 — autorizado em qualquer conversa
Guilherme pediu (22/05/2026) que eu possa **mandar emails e marcar reuniões Meet em qualquer conversa** dele com o Claude (aqui no Code OU nos 4 Projects no claude.ai).

**4 actions da API (todas via webhook GAS):**
- `sendEmail` — envia 1 email arbitrário (params: `to`, `subject`, `body|htmlBody`, `cc?`)
- `createMeetEvent` — cria evento Calendar com link Meet (params: `title`, `startISO`, `endISO`, `attendees[]`, `description?`, `timeZone?` default America/Sao_Paulo)
- `listMeetSuggestions` — sugere horários livres (params: `attendees[]`, `startISO`, `endISO`, `durationMinutes?`)
- `listUpcomingEvents` — lista próximos eventos (params: `days?`, `max?`)

**Regra de uso (todos os 4 gerentes Claude foram atualizados em 22/05):**
1. Quando usuário pedir "manda email X" ou "marca reunião com Y" → confirmar dados em tabela
2. Aguardar OK explícito
3. Disparar; retornar link Meet ou comprovante

**MCPs disponíveis também no Claude Code local:** Gmail MCP (`create_draft`), Calendar MCP (`create_event`, `suggest_time`, `list_events`). Pode usar diretamente sem ir pelo GAS quando estiver aqui.

## Projetos ativos

- **CRM Toposcan** — sistema de gestão de propostas e clientes (GitHub Pages + Google Sheets)
- **IshTar.AI** — projeto beta (repositório público)
- **EnergiaPro** — app de eficiência energética com IA para comércios

## Preferências de trabalho (refinadas após sessão de 22/05/2026)

- **Comunicação:** português brasileiro, direta, bullets > parágrafos
- **Autonomia:** quando autoriza ação ampla ("execute sozinho"), não pedir confirmação a cada sub-passo. Decidir trade-offs e reportar só o resultado.
- **Verificação obrigatória:** API retorna `ok:true` ≠ ação concluída. Sempre testar end-to-end antes de declarar "feito".
- **Privacidade por default:** funcionalidades administrativas (KPIs financeiros, alertas, custos) → escondidas com `display:none`, desbloqueio multi-vetor (URL/atalho/console).
- **Cross-funcional:** quer agentes que façam TUDO sob comando, mas com identidade primária especializada.
- **Histórico de gestão:** Antigravity Bot → OpenClaw Caretaker → Claude Code (eu, desde 2026-05-19). Confia no progresso mas cobra resultado.
- **Família de gerentes Claude (4 Projects no claude.ai):** Comercial (019e08c9), Financeiro (019e523e), Operação (019e45c7), Engenharia (019e51fc). Todos com prompts unificados V7.5.

## Padrão de comunicação dele comigo

- Pergunta direta + comando ("faça você mesmo")
- Tolerância baixa pra retrabalho ("ainda não esta funcionando")
- Quando algo dá errado: descreve sintoma curto ("nao recebi nada"), espera diagnóstico
- Quando aceita: confirmação simples ("ok", "Eu recebi")
- Frase emblemática: *"e sempre que precisar e eu te pedir em qualquer conversa minha com o claude aqui no chat ou em projetos, quero que voce tenha a habilidade de marcar reaunioes no meet e mandar emails"* — quer continuidade entre canais
