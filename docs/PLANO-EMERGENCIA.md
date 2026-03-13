# Plano de Emergência - CRM Toposcan

Este documento contém os procedimentos para restaurar o sistema em caso de falha crítica.

---

## 🆘 Cenário 1: "O site não carrega as propostas"
**Sintoma:** A lista de oportunidades aparece vazia ou com uma mensagem de erro.

**Causa Provável:** O Google Apps Script Bridge parou de responder ou atingiu o limite de quota.

**O que fazer:**
1.  **Verifique a Planilha:** Veja se você consegue abrir o Google Sheets normalmente.
2.  **Atualize a Implantação:** 
    - Vá em Apps Script > Gerenciar Implantações.
    - Edite a implantação atual e salve como uma **Nova Versão**.
    - Isso "reinicia" o serviço na nuvem do Google.
3.  **Backup Estático (Contingência):**
    - Se a nuvem do Google estiver fora do ar, o CRM tentará ler o arquivo `proposals.js` local.
    - No seu computador, rode: `python crm-sync-v2.py --direction both`
    - Isso forçará uma atualização do arquivo estático no GitHub.

---

## 🆘 Cenário 2: "Salvei uma edição mas ela não aparece no Excel"
**Sintoma:** O CRM diz que salvou, mas a planilha não mudou.

**O que fazer:**
1.  **Verifique o Console (F12):** Veja se há erros de "CORS" ou "404".
2.  **Verifique o Apps Script:** Garanta que a função `doPost` não está com erros de sintaxe (compare com o arquivo `GoogleAppsScript-Bridge.js`).
3.  **Sincronização Forçada:** 
    - No CRM, clique no botão "**Sincronizar**" (ícone de refresh no topo).
    - Isso obriga o site a reenviar qualquer edição que ficou presa no seu navegador (`localStorage`).

---

## 🆘 Cenário 3: "O lead 'X' sumiu de tudo"
**Sintoma:** Um registro importante não está nem no site nem no Excel.

**O que fazer:**
1.  **Snapshots de Backup:** O sistema tira fotos da sua planilha toda vez que você roda o sync manual.
2.  **Recupere o dado:**
    - Vá na pasta `C:\Users\23GAMER\.openclaw\workspace\empresa\toposcan\snapshots/`.
    - Procure o arquivo `.json` mais recente.
    - Lá você encontrará o conteúdo de todas as propostas para copiar e colar de volta se necessário.

---

## 🆘 Cenário 4: "Mudei a estrutura da planilha e quebrou o CRM"
**Sintoma:** As colunas aparecem deslocadas ou o valor está zerado.

**O que fazer:**
1.  **Não mude a ordem das colunas A até P.** O CRM espera:
    - Vendedor (A), Proposta (B), Cliente (C), etc.
2.  Se precisar mudar, você deve atualizar os índices no objeto `COLUMNS` tanto no `crm.html` quanto no `GoogleAppsScript-Bridge.js`.

---

## Contatos de Suporte
Este sistema foi projetado para ser resiliente. Se nada funcionar, peça ao seu Agente AI (OpenClaw) para realizar um "**Full Audit and Restore**" usando os snapshots locais.
