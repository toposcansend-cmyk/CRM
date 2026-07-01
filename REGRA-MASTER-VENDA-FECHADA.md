# 🟣 REGRA MASTER — Toda venda FECHADA propaga para todas as áreas

> **Vale para TODOS:** operadores manuais da planilha/CRM (Guilherme, Marcelo, Allana, Luiz Gustavo, Rafaela…) **e** os 5 gerentes Claude (Rafaela/Beatriz/Vanessa/Fernanda/Sofia).
> Estabelecida em 30/06/2026 pelo Guilherme. Enforcement técnico ativo desde o backend **V7.20**.

---

## A regra

**Uma proposta com status `Fechada` DEVE existir em todas as áreas downstream:**

| Área | O que deve existir | Como criar |
|---|---|---|
| 💰 **Financeiro** | Plano de pagamento (parcela/recebível) | `addPaymentPlan` |
| 🛠️ **Engenharia** | Matriz de produção (tarefas de entrega) | `bulkAddProducao` |
| 💼 **Custos** | Custos previstos de operação (parceiros/equip.) | `addTopoPartner` — *pode ser 0 se produção 100% interna* |
| 💸 **Fluxo de Caixa** | Aparece automaticamente **se** o Financeiro existir | (derivado do Financeiro) |

**Chave que amarra tudo:** `numeroProposta`.

## Por que existe

Fechar uma venda **editando a célula direto na planilha** conta no total de "fechadas do mês" (que é lido) mas **NÃO dispara a cascata** (que é por evento) → a venda fica **órfã**: sem recebível, sem produção, sem custo. Já aconteceu (Camargo `062026208.0`/`062026209.0` e Jonathan `05202699.0` — fechadas por edição manual, invisíveis no resto).

## Como é ENFORÇADA (não depende de ninguém lembrar)

O detector **"Venda fechada incompleta"** (🟣) roda dentro do `getActiveAlerts` e **reconcilia Vendas × todas as abas POR LEITURA** a cada vez que qualquer canal lê os alertas (dashboard, briefing, e-mail, os 5 gerentes). Se uma venda Fechada recente (≤120d) falta em qualquer área, vira alerta **listando exatamente quais abas faltam**. Severidade **alta** se falta o Financeiro (dinheiro).

> **Princípio:** a omissão não é corrigida pedindo pra alguém lembrar — ela é tornada **impossível de passar despercebida**.

## O que cada um faz

- **Operador manual:** fechou uma venda? Prefira fechar **pela tela do CRM** (dispara a cascata). Se editou a planilha na mão, **crie o Financeiro + Engenharia + Custos** logo em seguida. O alerta 🟣 vai cobrar até você fazer.
- **Gerente Comercial (Rafaela):** ao registrar/detectar um fechamento, garantir a propagação e acionar Vanessa (Financeiro) + Beatriz (Engenharia) + Fernanda (Custos).
- **Gerentes de área:** ao ver um 🟣 da sua área, criar o registro que falta.

---
*Enforcement: `getActiveAlerts` / bloco "Venda fechada incompleta", `Code.js` V7.20. Janela: fechadas ≤120d com data válida.*
