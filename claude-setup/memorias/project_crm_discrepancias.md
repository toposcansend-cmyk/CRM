---
name: project-crm-discrepancias
description: Divergências entre o manual operacional do Antigravity e o código atualmente no repositório GitHub do CRM
metadata: 
  node_type: memory
  type: project
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# Discrepâncias: Manual Operacional × Repositório GitHub

Levantadas em 2026-05-19 ao cruzar [[project-crm-manual-operacional]] com o estado atual de [[project-crm-toposcan]].

## 1. Versão do Google Apps Script (CRÍTICO)

- **Manual:** descreve API com 5 actions (`listAll`, `find`, `addLead`, `update`, `bulkUpdate`) e secret `toposcan-agent-2026`.
- **Repositório:** `google-apps-script.js` só tem `doGet` (leitura) e `doPost` (edits via JSON body). Auth token: `toposcan-crm-2026-v2`. Nenhuma action nomeada.
- **Conclusão:** Existe uma **versão V3+** do GAS publicada em outro deployment URL (o do manual), que **NÃO ESTÁ NO GIT**. A versão no repo é antiga.

**Why:** Antigravity/OpenClaw provavelmente editaram o GAS direto no script.google.com sem commitar de volta no repo.

**How to apply:** Para operar o CRM, usar a URL e secret do manual. Para evoluir o código, será preciso primeiro **resincronizar o `google-apps-script.js` do repo com a versão real publicada**.

## 2. Estrutura de Colunas (15 vs 16)

- **Manual:** 16 colunas (A-P), com `status` (O) e `observacao` (P) **separados**.
- **Repositório:** `COLUMN_MAP` tem 15 colunas (A-O). Campo `observacao` mapeia para coluna 15 (O). Status é **derivado** do conteúdo de observacao via `statusValidos`:
  ```js
  const statusValidos = ['fechada','pendente','perdida','lead','enviada','standby'];
  if (statusValidos.includes(obsLower)) item.status = ...
  ```
- **Conclusão:** A planilha real provavelmente já tem 16 colunas (col P adicionada). O GAS novo lê P separadamente. O código no repo ainda assume o modelo antigo de campo único.

## 3. Lógica de Status

- **Manual:** Status definido explicitamente em col O. Probabilidade derivada do status (Lead=10%, Enviada=30%, Pendente=50%, Standby=20%, Fechada=100%, Perdida=0%).
- **Repositório:** Fallback derivado de probabilidade quando observacao não bate com `statusValidos`:
  - `prob >= 100` → Fechada
  - `prob <= 0` → Perdida
  - `prob <= 20` → Lead
  - `prob <= 40` → Enviada
  - `prob > 40` → Pendente
- **Bug latente:** Standby (20%) cairia no fallback como **Lead**, não Standby. O novo modelo (manual) resolve isso ao ler status explícito.

## 4. Rafaela ausente do Auth

- **Manual:** Equipe inclui **Rafaela** (Júnior em ramp-up).
- **Repositório:** `AUTH_USERS` em `crm.html` linhas 1738-1743 só tem admin, guilherme, marcelo, allana. **Rafaela não pode logar.**

**How to apply:** Adicionar `rafaela@toposcan.com.br` ao `AUTH_USERS` com o hash SHA-256 da senha quando autorizado pelo Guilherme.

## 5. Frontend ainda usa modelo antigo

- O `crm.html` no repo lê `observacao` como campo único.
- Se a planilha agora tem col P separada, o frontend pode estar mostrando dados desatualizados ou status incorreto, dependendo do que o GAS retorna.

## Próximas ações sugeridas (aguardando OK do Guilherme)

1. **Auditoria:** rodar `listAll` na API nova do manual e comparar a resposta com o que o `crm.html` espera.
2. **Sync do GAS:** baixar a versão V3+ do script.google.com e commitar no `google-apps-script.js` do repo.
3. **Atualizar frontend:** ajustar `crm.html` para ler `status` e `observacao` como campos separados.
4. **Adicionar Rafaela:** incluir no `AUTH_USERS`.
5. **Documentar deployment IDs:** registrar quais GAS deployments estão ativos e qual é o canônico.
