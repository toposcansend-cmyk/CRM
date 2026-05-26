---
name: metrics
description: "Métricas de auto-monitoramento do Claude operando o CRM Toposcan. Atualizar a cada sessão relevante."
metadata:
  node_type: memory
  type: metrics
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
  created: 2026-05-23
---

# 📊 Métricas — Claude operando Toposcan

> Atualizar ao final de cada sessão. Acumular pra detectar tendência.

## Sessão atual: 2026-05-23 (auditoria + execução de dívida técnica)

| Métrica | Valor |
|---|---|
| Duração da sessão | (em curso) |
| Tarefas planejadas | 9 |
| Tarefas concluídas | (atualizar no final) |
| Smoke test rodado no início? | ❌ Não (rodei só quando pedido — corrigir hábito) |
| Endpoints OK no smoke | 13/13 |
| Latência média API | 2.981 ms |
| Quota MailApp consumida hoje | 30/100 |
| Alertas operacionais detectados | 13 (~R$73.866 acionáveis) |
| Retry rate | 0% (todas operações 1ª tentativa) |
| User corrections | 0 |
| Arquivos criados | (atualizar no final) |
| Arquivos editados | (atualizar no final) |
| Bugs descobertos | 2 (gmail.send + userinfo.email scopes faltando) |

## Histórico de sessões

### 2026-05-19 — Setup inicial Financeiro V4
- Saída: aba Financeiro + 37 fechadas seed + KPIs

### 2026-05-20 — TopoPartners V5
- Saída: 5 categorias de custo + margem real -11%

### 2026-05-21 — Engenharia V6
- Saída: matriz subitem×fase + 11 projetos + 115 tarefas seed

### 2026-05-22 — Maratona V7.0+V7.5
- Saída: Central de Inteligência + 4 gerentes Claude + Sofia + 3 triggers + 4 actions Email/Meet
- **Falhas notáveis:** try/catch OAuth silencioso · cache CDN GitHub · coordenadas hardcoded
- **Autoanálise:** ver [[autoanalise-session-2026-05-22]]

### 2026-05-23 — Esta sessão
- Saída: error_patterns + smoke.ps1 + metrics + hook SessionStart + backup git + monitor triggers
- (atualizar com resumo no final)

---

## 🎯 Metas evolutivas

| Métrica | Baseline | Meta 30 dias | Meta 90 dias |
|---|---|---|---|
| Smoke test no início | 0% | 100% | 100% |
| Retry rate | 0% (1 sessão) | < 10% | < 5% |
| End-to-end success | 100% (1 sessão) | > 95% | > 98% |
| User correction rate | 0/sessão | < 1/sessão | < 0.5/sessão |
| Bugs descobertos por sessão | (decrescente) | (decrescente) | < 1/sessão |
| Identificação auto user (Guilherme) | 100% (4/4) | 100% | 100% |
| Identificação auto user (Marcelo) | N/A | > 80% | > 95% |

---

## 📋 Como atualizar (protocolo)

Ao final de cada sessão relevante:

1. Preencher seção da sessão atual com números reais
2. Mover sessão atual para "Histórico de sessões" com resumo de 1-3 linhas
3. Comparar métricas vs sessão anterior — anotar se piorou
4. Se descobriu padrão novo de erro → adicionar em [[error-patterns]]
5. Se identificou padrão de uso novo → atualizar [[learning-user-identification]]

**Princípio:** métricas só valem se forem comparadas. Sem histórico, não há aprendizado.
