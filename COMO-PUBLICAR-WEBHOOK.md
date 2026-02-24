# Como Publicar o Webhook Google Apps Script

Tempo estimado: **3-5 minutos**

## Passo 1 — Abrir o Apps Script

1. Acesse: **https://script.google.com**
2. Clique em **"Novo projeto"** (botão azul)

## Passo 2 — Colar o código

1. Apague todo o código que aparece (a função `myFunction` padrão)
2. Copie TODO o conteúdo do arquivo `google-apps-script.js` deste repositório
3. Cole no editor
4. Salve: **Ctrl + S** → digite o nome **"CRM Toposcan Sync"** → OK

## Passo 3 — Publicar como Web App

1. Clique no botão **"Implantar"** (canto superior direito)
2. Selecione **"Nova implantação"**
3. Clique no ícone de engrenagem ⚙️ ao lado de "Tipo" e selecione **"App da Web"**
4. Configure:
   - **Descrição:** `CRM Toposcan v3`
   - **Executar como:** `Eu mesmo`
   - **Quem pode acessar:** `Qualquer pessoa`
5. Clique **"Implantar"**
6. Se pedir autorização → clique "Autorizar acesso" → escolha sua conta Google → "Permitir"
7. **Copie a URL** que aparece (formato: `https://script.google.com/macros/s/AKfycb.../exec`)

## Passo 4 — Configurar no CRM

1. Abra o arquivo `crm.html` neste repositório
2. Encontre a linha (por volta da linha 1175):
   ```javascript
   const WEBHOOK_URL = '';
   ```
3. Substitua por:
   ```javascript
   const WEBHOOK_URL = 'https://script.google.com/macros/s/SUA_URL_AQUI/exec';
   ```
4. Salve e faça **git push** para o GitHub

## Passo 5 — Testar

1. Acesse o CRM: https://toposcansend-cmyk.github.io/CRM/
2. Edite uma proposta qualquer
3. Clique no botão **"↻ Sincronizar"**
4. Deve aparecer: "Dados enviados para a planilha com sucesso!"
5. Abra a planilha e confirme a atualização

---

## Problemas Comuns

### "Erro de autorização"
→ No Apps Script, clique em "Implantar" → "Gerenciar implantações" → edite e republique.

### "A URL retorna HTML em vez de JSON"
→ Certifique-se de que o acesso está como "Qualquer pessoa" (não "Qualquer pessoa com link").

### "Proposta não aparece na planilha"
→ Verifique se o `SHEET_NAME` no script está igual ao nome da aba na planilha (padrão: `Planilha1`).

---

## Atualizar o código no futuro

Quando precisar atualizar o código do webhook:
1. Abra https://script.google.com → selecione "CRM Toposcan Sync"
2. Cole o novo código
3. Clique "Implantar" → "Gerenciar implantações"
4. Clique no lápis ✏️ → selecione "Nova versão" → "Implantar"
5. A URL permanece a mesma — não precisa atualizar o CRM!
