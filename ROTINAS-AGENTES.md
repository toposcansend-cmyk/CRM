# 🎯 CENTRAL DE INTELIGÊNCIA V7.0 — Rotinas + Agentes Proativos

> Sistema autônomo que monitora as 4 áreas da Toposcan 24/7, dispara alertas cross-funcionais, envia briefings por email e sincroniza departamentos automaticamente.

---

## 🚀 O que foi entregue

### 1. Backend (Google Apps Script) — 6 novas actions
| Action | O que faz |
|---|---|
| `getCrossKPIs` | KPIs consolidados das 4 áreas + margem real do mês com -11% imposto |
| `getActiveAlerts` | Lista priorizada de alertas (Comercial, Financeiro, Operação, Engenharia, Cross) |
| `getDailyBriefing` | Briefing matinal em texto pronto (consumido por email + dashboard) |
| `installTriggers` | Instala os 3 agentes autônomos (chamada única) |
| `uninstallTriggers` | Remove os triggers (rollback) |
| `runDailyBriefNow` | Dispara o briefing por email AGORA (teste manual) |

### 2. Frontend (CRM web) — nova aba 🎯 Central de Comando
- **Saúde da operação** (score 0-100 com barra colorida)
- **4 cards de KPIs** (Comercial, Financeiro, Operação, Engenharia)
- **Margem real do mês** (venda bruta → -11% imposto → líquido → -custos = margem)
- **Lista de alertas ativos** com filtros por área
- **3 botões de ação:**
  - 🔄 Atualizar
  - 📧 Enviar briefing por email AGORA
  - ⚙️ Instalar agentes automáticos (uma vez só)

### 3. Auto-cascata ao Fechar Proposta
Quando um deal vira `Fechada` via API ou frontend:
- Adiciona observação automática registrando próximos passos
- Dispara email avisando: *"PROPOSTA FECHADA — próximos passos: cadastrar parcelas (Financeiro), criar produção (Engenharia), confirmar parceiros (Operação)"*
- Calcula e mostra margem líquida esperada (89% do valor)

### 4. Agentes Autônomos (3 rotinas via Google triggers)

| Agente | Quando dispara | O que faz |
|---|---|---|
| **dailyMorningBrief** | Todo dia às 8h | Email com briefing completo (KPIs + top 5 alertas) |
| **detectInadimplencia** | 10h e 16h diários | Se houver parcela atrasada ou vencendo em 3d → email com lista de cobranças |
| **weeklyStrategicReport** | Segunda 9h | Relatório semanal estratégico para revisão de meta |

**Email destino:** `toposcan.send@gmail.com`
(Mudar via Apps Script: `PropertiesService.getScriptProperties().setProperty('CENTRAL_EMAIL', 'novo@email.com')`)

---

## ✅ Como ativar (5 segundos)

1. Abra o CRM: https://toposcansend-cmyk.github.io/CRM/
2. Clique na nova aba **🎯 Central** (primeira da esquerda)
3. Clique em **⚙️ Instalar agentes automáticos**
4. Confirma o popup → recebe email no minuto seguinte às 8h amanhã

A partir daí, todo dia às 8h o briefing chega no seu email automaticamente.

---

## 🧠 Lógica dos Alertas Cross-Funcionais

A grande novidade é a inteligência **cruzando dados das 4 planilhas**:

### Detecção automática:

| Sinal detectado | Alerta gerado |
|---|---|
| Tarefa Engenharia `Concluído` hoje + parcela `Pendente` na mesma proposta | 💡 **"Concluir libera parcela R$ X"** (área: Cross) — sugere ligar pro cliente cobrando |
| Coleta de campo `Concluído` + parceiro do projeto com `valorPago = 0` | ⚠️ Parceiro entregou mas não foi pago (avisa Operação) |
| Deal `Negociação` ≥80% + sem update há 5d | 🎯 **"Pronto pra fechar"** — sugere reunião de fechamento |
| Parcela `vencimento` ≤ 3d futuro | 🟡 **"Vence em 3d"** — sugere lembrete amigável |
| Parcela `Atrasado` > 14d | 🔴 **"Inadimplência"** — sugere cobrar HOJE |
| Modelista com > 5 tarefas paralelas | ⚠️ **"Sobrecarga"** — sugere redistribuição |
| Tarefa `Em andamento` com `previsaoEntrega` < hoje | 🔴/⚠️ **"Tarefa atrasada"** com dias de atraso |
| Tarefa `Bloqueado` | 🔴 **"Bloqueada"** + observação registrada |
| Deal sem update > 14d (estágios Em contato/Proposta/Negociação) | 🔴 **"Deal travado"** |

Ordenação: alta → média → baixa, depois por valor R$ desc.

---

## 📊 KPIs Consolidados

A nova aba mostra em tempo real:

```
🌟 Saúde geral: 0-100 (desconto por atrasos/bloqueios/inadimplência)

🎯 COMERCIAL
- Pipeline ativo (R$ total) + ponderado (R$ × probabilidade%)
- Fechadas no mês (quantidade + R$)
- Deals travados >14d

💰 FINANCEIRO
- Recebido no mês
- A receber 30d / 90d
- Inadimplência total

💼 OPERAÇÃO
- Custo total do mês
- Pendente a pagar a parceiros

🛠️ ENGENHARIA
- Projetos ativos
- Tarefas em andamento / concluídas / atrasadas / bloqueadas

💎 MARGEM REAL DO MÊS
- Venda bruta − 11% imposto = Líquido
- Líquido − Custo total = Margem Real (R$ e %)
```

---

## 🤖 Como os 4 Gerentes Claude se beneficiam

Cada Project Claude (Comercial, Financeiro, Operação, Engenharia) agora pode usar essas 3 actions para abrir conversas com cobertura total:

```
🎯 Comercial: "Como tá a saúde da operação?"
→ getCrossKPIs + getActiveAlerts → 1ª resposta com snapshot + 2 alertas prioritários

💰 Financeiro: "Quem tá inadimplente?"
→ getActiveAlerts area:Financeiro → lista priorizada com sugestões

💼 Operação: "Margem do mês?"
→ getCrossKPIs → mostra cálculo completo

🛠️ Engenharia: "Que entrega libera dinheiro?"
→ getActiveAlerts area:Cross → mostra tarefas cuja conclusão destrava parcela
```

Os 4 prompts já têm as actions documentadas (V7 inclusas no próximo update dos prompts).

---

## 🔧 Endpoints técnicos

Todos via POST em:
```
https://script.google.com/macros/s/AKfycbz_EE5M_grgoMdkjs7OJHHlDPSQB8qH-oJ4T6Pqg-0qDZYWq1qTZv_sZeJ6mXU-5-Gt3A/exec
Content-Type: text/plain
Secret: toposcan-agent-2026
```

### Payload examples

**Saúde geral + KPIs:**
```json
{"action": "getCrossKPIs", "secret": "toposcan-agent-2026"}
```

**Lista de alertas:**
```json
{"action": "getActiveAlerts", "secret": "toposcan-agent-2026"}
```

**Briefing texto:**
```json
{"action": "getDailyBriefing", "secret": "toposcan-agent-2026"}
```

**Instalar agentes (1x só):**
```json
{"action": "installTriggers", "secret": "toposcan-agent-2026"}
```

**Disparar briefing por email AGORA (teste):**
```json
{"action": "runDailyBriefNow", "secret": "toposcan-agent-2026"}
```

---

## 🔮 Roadmap (próximos passos sugeridos)

- [ ] Slack/WhatsApp webhook (em vez de só email)
- [ ] Auto-cadastro de produção quando fecha (gera matriz template automática)
- [ ] Score de saúde por projeto (não só global)
- [ ] Previsão de receita 30/60/90 dias com IA
- [ ] Velocity histórica por modelista (Jean, Luiza, Gabriela)
- [ ] Alerta de margem em risco DURANTE o projeto (não só no fim)
- [ ] Sugestão automática de re-precificação para serviços com margem <30%

---

## 📍 Arquivos modificados nesta entrega

- `C:\Users\23GAMER\.gemini\antigravity\scratch\clasp-crm\Code.js` (+780 linhas: módulo V7.0)
- `C:\Users\23GAMER\work\CRM\crm.html` (+200 linhas: aba Central + JS)
- Deploy GAS: `AKfycbz_EE5M_grgoMdkjs7OJHHlDPSQB8qH-oJ4T6Pqg-0qDZYWq1qTZv_sZeJ6mXU-5-Gt3A` @18 (V7.0)

---

**Engenharia da Central:** Claude (Opus 4.7) · 22/05/2026
