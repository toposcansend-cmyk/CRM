# Como Sincronizar CRM → Planilha

## Método 1: Google Apps Script Web App (Recomendado)

### Passo 1: Criar o Webhook

1. Acesse https://script.google.com
2. Clique em "Novo projeto"
3. Cole o conteúdo de `google-apps-script.js`
4. Clique em "Implantar" → "Nova implantação"
5. Selecione "Aplicativo da Web"
6. Configure:
   - Executar como: "Eu mesmo"
   - Quem pode acessar: "Qualquer pessoa"
7. Clique em "Implantar"
8. **Copie a URL gerada** (ex: https://script.google.com/macros/s/xxx/exec)

### Passo 2: Configurar o CRM

1. Abra o CRM online
2. Abra o console do navegador (F12)
3. Digite: `localStorage.setItem('crm_webhook_url', 'SUA_URL_AQUI')`
4. Pressione Enter

Pronto! Agora quando você clicar em "Sincronizar", as edições vão para a planilha.

---

## Método 2: Sincronização Manual (Alternativa)

Se não quiser configurar o webhook, você pode:

1. Editar as propostas no CRM
2. Abrir o console do navegador (F12)
3. Digitar: `console.log(localStorage.getItem('crm_edits'))`
4. Copiar o JSON
5. Mandar para mim que eu sincronizo

---

## Testando

1. Edite uma proposta no CRM
2. Clique em "Sincronizar"
3. Verifique a planilha

---

**Dica:** O webhook só funciona se você tiver permissão para editar a planilha.
