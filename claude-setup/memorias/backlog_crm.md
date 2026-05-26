---
name: backlog-crm
description: "Backlog priorizado de melhorias do CRM Toposcan + evolução do Claude operacional"
metadata: 
  node_type: memory
  type: backlog
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
  updated: 2026-05-22
---

# 📋 Backlog Toposcan + Evolução do Claude

> Priorizado em 22/05/2026 após autoanálise (ver `autoanalise_2026-05-22.md`).

---

## 🔥 PRIORIDADE 1 — Robustez do próprio Claude (próxima sessão)

### 1.1 Smoke test script
**O que:** Script PowerShell `tests/smoke.ps1` que valida no início de cada sessão:
- ~30 actions da API respondem (200 OK + estrutura)
- Quota MailApp ≥ 10
- Triggers V7 instalados (`installTriggers` retorna lista)
- Calendar acessível (`listUpcomingEvents`)
- Saúde geral > 70 (`getCrossKPIs`)

**Esforço:** 1h  
**Bloqueio se falhar:** sim — investigar antes de operar

### 1.2 Sistema de retry com fallback
**O que:** wrapper genérico em JS + PowerShell:
```js
tryWithFallback([strategyA, strategyB, strategyC], maxAttempts=3)
```
- Backoff exponencial entre tentativas
- Varia estratégia quando uma falha
- Lança erro só após esgotar TODAS

**Esforço:** 30min código + refactor retroativo  
**Onde aplicar:** Chrome MCP automation, GAS calls, file ops

### 1.3 Padrões de fallback documentados
Expandir `technical_patterns_gas_oauth_chrome.md` com:
- Cache GitHub → trocar pra api.github.com
- Popup OAuth → procurar link em `_blank` no log
- Coordenadas fallham → usar `find() + ref`
- UI re-renderiza → reabrir e fazer scroll de novo
- Try/catch + OAuth = bug silencioso → criar `forceAuth*()` sem try/catch
- PowerShell + emojis = encoding bug → texto plano

**Esforço:** 30min

### 1.4 error_patterns.md (memória nova)
Catalogar TODA falha com causa raiz pra próximas sessões evitarem.

**Esforço:** 15min estrutura + crescimento contínuo

### 1.5 Regra: nunca declarar feito sem prova externa
`ok: true` da API ≠ ação concluída.

Toda operação importante:
- Email → verificar com `listMessages` ou cobrar prova do usuário
- Evento Calendar → verificar com `listUpcomingEvents`
- Planilha → re-ler valor após escrita

**Esforço:** mudança de protocolo, sem código novo

---

## 🎯 PRIORIDADE 2 — Funcionalidades de negócio (esta semana)

### 2.1 Centro de Custo por Projeto (parcialmente implementado)
Já existe a aba "💼 Custos de Operação" com agrupamento por projeto + venda + margem com -11%.

**Falta:**
- Drill-down: clicar num projeto → ver TODAS as parcelas de receita + TODOS os custos lado a lado, timeline
- Comparativo: margem prevista vs realizada
- Top 5 projetos por margem absoluta + 5 por % margem

**Esforço:** 2-3h

### 2.2 WhatsApp integration
Marcelo usa WhatsApp mais que email. Crítico pra alertas:

**O que precisa:**
- WhatsApp Business Cloud API (gratuita até 1.000 conversas/mês)
- Verificar número (toposcan)
- Endpoint GAS pra enviar
- Triggers: alerta crítico (inadimplência > R$10k, bloqueio > 5d) → WhatsApp imediato

**Esforço:** 4-6h (inclui setup Business + verificação)

### 2.3 Dashboard 🤖 IA (saúde do sistema)
Aba privada (igual Central) com:
- Quota email diária + projeção
- Triggers: último disparo + próximo
- Stats: emails enviados últimos 30d, eventos criados, fechamentos cascateados
- Logs: erros recentes da API
- Status dos 5 Projects no claude.ai (última atualização)

**Esforço:** 2-3h

### 2.4 Auto-cadastro de produção quando fecha
Hoje: ao virar Fechada, manda email sugerindo *"crie matriz de produção"*.

**Melhoria:** detectar template pelo serviço (Scan to BIM, LiDAR, Aerolevantamento, Igrejas, etc) e CRIAR automaticamente as tarefas. Guilherme só revisa.

**Esforço:** 2h (mapear serviço→template + bulkAddProducao)

### 2.5 Backup automático de memórias
Cron diário que faz commit + push das memórias num repo PRIVADO:
- `toposcansend-cmyk/claude-memories-toposcan` (privado)
- Histórico evolutivo + DR (disaster recovery)

**Esforço:** 1h

---

## 🛠️ PRIORIDADE 3 — Fluxos técnicos (área Marcelo, médio prazo)

### 3.1 Auto-execução cross-Project
Sofia delega Comercial → Comercial executa → Sofia agrega.
- Hoje cada Project é silo
- Solução: webhook chain ou Project tools (quando Anthropic liberar)

**Esforço:** 4-6h

### 3.2 BIM / IFC QA automático
Para Marcelo:
- Script Python com `ifcopenshell`
- Cliente entrega IFC → Claude valida:
  - LOD declarado vs real
  - Contagem de elementos esperada (paredes, lajes, esquadrias)
  - Regras de nomenclatura Toposcan
  - Coordenadas (georeferenciamento OK?)
- Relatório QA Word gerado automaticamente

**Esforço:** 1 semana

### 3.3 Análise de viabilidade técnica
Cliente pede orçamento → Claude:
- Calcula área, complexidade
- Estima horas Jean+Luiza+Gabriela (baseado em projetos similares)
- Sugere preço com margem alvo
- Considera disponibilidade da equipe (carga atual via getProducaoKPIs)
- Gera proposta PDF

**Esforço:** 2 semanas

### 3.4 Processamento de nuvens automatizado
Script que detecta novo `.las` no Drive → processa via `laspy`:
- Decimação
- Análise de densidade
- Conversão pra `.e57` ou `.ply` conforme template do projeto
- Notifica Jean que está pronto pra Cyclone

**Esforço:** 1 semana

### 3.5 Briefing automático de campo
*"Amanhã vamos pra Ilha do Mel"* → Claude prepara:
- Equipamentos necessários (baseado em projetos passados)
- Checklist do drone (bateria, calibração, SD card)
- Contatos locais
- Previsão do tempo (API meteorológica)
- Distâncias, pontos críticos
- PDF pra Marcelo levar offline

**Esforço:** 2-3 dias

---

## 🌍 PRIORIDADE 4 — Funcionalidades amplas (longo prazo)

### 4.1 Voice interface
Pro Guilherme no carro, Marcelo no campo:
- App mobile com Whisper + Anthropic
- Captura voz → Claude → TTS de resposta
- *"Sofia, marca reunião com Carlos amanhã 10h"* sem digitar

**Esforço:** 1-2 semanas (POC)

### 4.2 Plugin AutoCAD nativo
- LISP ou .NET addin
- Comando `(c-ai "explica esse desenho")` dentro do AutoCAD
- Claude lê DXF, analisa, responde

**Esforço:** 2-3 semanas

### 4.3 Add-in Revit
- Dynamo scripts gerados por Claude
- Comandos de IA dentro do Revit

**Esforço:** 2-3 semanas

### 4.4 Fine-tuning Toposcan
Quando Anthropic liberar fine-tuning:
- Treinar Claude nos contratos passados, datasheets de equipamentos, padrões internos
- IA específica da empresa

**Esforço:** depende da Anthropic + 1 mês

### 4.5 Captação ativa via Claude
Claude monitora portais (ComprasNet, etc) e detecta oportunidades:
- Cliente pede topografia em Curitiba → Claude detecta + gera proposta + envia
- Quase automação completa do lead

**Esforço:** 2-3 semanas

---

## 📊 Métricas a estabelecer

Cada sessão deve registrar (em `metrics.md` a criar):
- Tempo total da sessão
- Tarefas concluídas
- Retry rate (% operações que falharam 1+ vez)
- End-to-end success rate (% "feito" que VERDADEIRAMENTE foi)
- User correction count
- Lines shipped

Meta após 5 sessões: baseline confiável.  
Meta após 20 sessões: retry rate < 10%, correction rate < 5%.

---

## 🧠 Princípios pra próximas sessões

1. **Smoke test antes de qualquer trabalho novo**
2. **Nunca declarar feito sem prova externa**
3. **Use `find()` + `ref`, não coordenadas hardcoded**
4. **Use api.github.com, não raw para conteúdo fresh**
5. **Funções com OAuth: sem try/catch silencioso**
6. **3 estratégias antes de pedir ajuda**
7. **Toda falha vira entrada em `error_patterns.md`**
8. **Atualize `learning_user_identification.md` toda sessão relevante**
9. **End-of-session: 5 min de autoanálise**

---

*Atualizado: 22/05/2026 após autoanálise da sessão maratona V7.5.*
