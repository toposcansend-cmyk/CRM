---
name: backlog-crm
description: "Features futuras planejadas para o CRM Toposcan, ainda não implementadas"
metadata: 
  node_type: memory
  type: backlog
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# Backlog CRM Toposcan

## 🎯 Centro de Custo por Projeto (alta prioridade)

**Solicitado:** 2026-05-20 pelo Guilherme

**Objetivo:** consolidar receita (Financeiro) + custos (TopoPartners) por projeto fechado para ter visão de margem real.

**Pré-requisitos** (já prontos):
- Aba Financeiro com parcelas vinculadas por `numeroProposta`
- Aba TopoPartners com `projeto` (texto, normalmente "Cliente - NumeroProposta") apontando para uma proposta Fechada

**Como implementar:**
1. Nova aba **📈 Centro de Custo** no CRM web (após TopoPartners)
2. Backend GAS — nova action `getProjectPNL` que:
   - Lê CRM Consolidado (filtro Fechada)
   - Cruza com Financeiro (soma parcelas por numeroProposta)
   - Cruza com TopoPartners (soma valorAcordado por projeto)
   - Retorna por projeto: receita_bruta, recebido, a_receber, custo_parceiros, custo_pago, margem_prevista, margem_realizada, %margem
3. Frontend:
   - KPIs gerais: Receita Total, Custo Total, Margem Bruta %, Top 5 Projetos por margem
   - Lista filtrada por vendedor / período / cliente
   - Drill-down em cada projeto mostrando: parcelas de receita + parcelas de custo lado a lado

**How to apply:** quando o Guilherme retomar, levantar pelo menos 3-5 projetos com TopoPartners já lançados para validar o cruzamento, depois construir a aba.

**Why:** Hoje Guilherme tem visibilidade de receita (Financeiro) e custos de parceiro (TopoPartners) separados. Faltam ver a margem real por projeto, que é o número que importa pra decidir precificação futura.
