---
name: technical-patterns-gas-oauth-chrome
description: Padrões técnicos reutilizáveis para Google Apps Script + OAuth + Chrome MCP automation aprendidos no projeto Toposcan
metadata: 
  node_type: memory
  type: technical-reference
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# Padrões Técnicos — GAS, OAuth e Chrome MCP Automation

## 1. Apps Script — Adicionar novos scopes OAuth

**Problema:** scripts GAS não conseguem usar serviços novos (MailApp, CalendarApp, ScriptApp triggers) até o owner autorizar explicitamente via popup OAuth. Adicionar scopes no manifest não basta.

**Solução comprovada:**

```javascript
// 1) Adicionar scopes em appsscript.json:
"oauthScopes": [
  "https://www.googleapis.com/auth/script.send_mail",  // MailApp
  "https://www.googleapis.com/auth/script.scriptapp",  // ScriptApp triggers
  "https://www.googleapis.com/auth/calendar",          // Calendar
  "https://www.googleapis.com/auth/calendar.events",   // Calendar events
  "https://mail.google.com/"                           // GmailApp
]

// 2) Para Calendar com Meet, adicionar Advanced Service:
"dependencies": {
  "enabledAdvancedServices": [
    { "userSymbol": "Calendar", "version": "v3", "serviceId": "calendar" }
  ]
}

// 3) clasp push --force + clasp deploy -i <id>

// 4) Criar função force-auth SEM try/catch — chamada que usa o serviço.
//    O try/catch ENGOLE o erro de auth e impede o popup. Sem ele, GAS exibe popup OAuth.
function forceAuthEmail() {
  MailApp.sendEmail({ to: 'me@x.com', subject: 'test', body: 'test' });
  // ⚠️ NÃO usar try/catch aqui — precisa do erro pra abrir o popup
}

// 5) No Apps Script Editor (script.google.com):
//    Selecionar função no dropdown → clicar Executar
//    Popup "Autorização obrigatória" aparece → "Revisar permissões"
//    Aba abre com warning "Google não verificou este app" → "Acessar Projeto (não seguro)"
//    Permitir acesso → scope autorizado pra sempre

// 6) Para cada NOVO scope, criar uma nova forceAuthX() e repetir o fluxo
```

**Por que cada scope precisa autorização separada:**
- Google só pede consent dos scopes que estão REALMENTE sendo usados em runtime
- Adicionar no manifest avisa o Google, mas só dispara o popup quando o código TENTA usar
- Por isso forceAuthX faz a chamada concreta (não try/catch)

## 2. Chrome MCP — Automação do claude.ai Projects

**Padrão para reaplicar prompts em massa nos Custom Instructions:**

```javascript
// JavaScript injetado via Chrome MCP javascript_tool:
(async () => {
  // 1) Cancela qualquer modal aberto
  const cancelBtn = Array.from(document.querySelectorAll('button'))
    .find(b => /cancelar/i.test(b.textContent||'') && b.offsetParent !== null);
  if (cancelBtn) cancelBtn.click();
  await new Promise(r => setTimeout(r, 500));

  // 2) Localiza header "Instruções" e botão de edição adjacente
  const headers = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,span,div'))
    .filter(e => (e.textContent||'').trim() === 'Instruções' && e.offsetParent !== null);
  let editBtn = null;
  for (const h of headers) {
    const container = h.closest('section, div, article');
    if (container) { editBtn = container.querySelector('button, [role=button]'); if (editBtn) break; }
  }
  editBtn.click();

  // 3) Aguarda textarea aparecer
  await new Promise(r => setTimeout(r, 900));
  const ta = Array.from(document.querySelectorAll('textarea'))
    .filter(t => t.offsetParent !== null).pop();

  // 4) Fetch do conteúdo via GitHub API (não raw — sempre fresh, sem cache CDN)
  const resp = await fetch('https://api.github.com/repos/USER/REPO/contents/FILE.md?ref=main');
  const json = await resp.json();
  const decoded = decodeURIComponent(escape(atob(json.content.replace(/\n/g,''))));

  // 5) Extrai entre markers (se for o caso)
  const sm = '**[INÍCIO DO CONTEÚDO PARA O CLAUDE]**';
  const em = '**[FIM DO CONTEÚDO PARA O CLAUDE]**';
  const content = decoded.substring(decoded.indexOf(sm), decoded.indexOf(em) + em.length).trim();

  // 6) Seta valor via setter React-aware (CRÍTICO — assignment direto não atualiza React state)
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, content);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.dispatchEvent(new Event('change', { bubbles: true }));

  // 7) Click Salvar
  await new Promise(r => setTimeout(r, 600));
  const saveBtn = Array.from(document.querySelectorAll('button'))
    .find(b => /salvar/i.test(b.textContent||'') && b.offsetParent !== null && !b.disabled);
  if (!saveBtn) return { error: 'save button disabled — content might be same' };
  saveBtn.click();
  return { ok: true, length: content.length };
})()
```

**Aprendizados-chave:**
- `raw.githubusercontent.com` tem cache CDN ~5min — use `api.github.com/repos/.../contents/...` quando precisar de conteúdo fresh logo após commit
- Setter direto (`ta.value = x`) não atualiza React state — use o setter do prototype
- Botão Salvar fica disabled se conteúdo é idêntico ao atual — verificar `disabled`

## 3. Apps Script Editor — Automação UI via Chrome MCP

**Editor tem tier "click"** (IDE) no computer-use, mas o claude.ai/script.google.com são web apps normais — clicks funcionam, digitação não bloqueia (mas evitar usar `type` no editor).

**Selecionar função no dropdown:**

```javascript
// 1) Click no combobox via find() + ref
// 2) Scroll dentro da lista até achar item desejado (scroll de 8-30 ticks)
// 3) Click na coordinate do item visível

// Para evitar perder o scroll quando o dropdown re-renderiza:
// - Após abrir, scroll IMEDIATAMENTE
// - Depois click no item (não aguarda demais)
```

**Popup OAuth abre em janela popup separada — Chrome MCP NÃO vê.**
Workaround: usar o **link "Clique aqui para conceder permissões"** que aparece no log de execução — esse abre em `_blank` (nova aba) que aparece no MCP tab group.

```javascript
// No Apps Script Editor após erro de autorização:
// 1. Find link "Clique aqui para conceder permissões"
// 2. Click — abre nova aba com URL accounts.google.com/signin/oauth/warning
// 3. Click em "Acessar Projeto (não seguro)" → aba auto-fecha após approve
// 4. Voltar e re-executar a função (auth já concedida)
```

**Auto-fechamento de aba OAuth:** ela fecha sozinha após approve. Chrome MCP `tabs_context` vai mostrar a aba some — isso é sinal de sucesso, não erro.

## 4. Padrão de versão + deploy estável

Manter o mesmo **deployment ID** entre versões:

```bash
clasp push --force
clasp deploy -i AKfycbz_EE5M_grg... -d "V7.x descrição"
```

→ URL pública não muda (`/macros/s/AKfycbz_EE5M.../exec`), só o número da versão interna. Cliente não precisa reconfigurar nada.

## 5. Cascata automática em mudança de estado

**Pattern:** após qualquer update significativo, executar cascade-side-effects:

```javascript
function agentUpdate(data) {
  // ... lógica de update ...
  
  var cascadeInfo = null;
  try {
    if (changed.status && String(changed.status.para).trim() === 'Fechada') {
      cascadeInfo = cascadeOnProposalClose(row, sheet);
      // → adiciona observação, manda email, sugere próximos passos
    }
  } catch (e) { cascadeInfo = { error: 'cascade falhou: ' + e.message }; }
  
  return respond({ ok: true, changed: changed, cascade: cascadeInfo });
}
```

**Vantagem:** efeitos colaterais ficam transparentes mas opcionais (try/catch externo evita que cascade quebre o update principal).

## 6. Detecção CROSS-funcional (inteligência emergente)

Padrão para detectar oportunidades cruzando múltiplas planilhas:

```javascript
// Exemplo: tarefa Engenharia "Concluído" hoje + parcela Financeiro "Pendente" 
// na mesma proposta → alerta "Concluir libera parcela R$X"

d.producao.forEach(function(t) {
  if (t.status === 'Concluído' && t.dataConclusao) {
    var dataConcl = _parseDataBR(t.dataConclusao);
    if (dataConcl && _centralDiasEntre(dataConcl, hoje) <= 1) {
      var parcelaLib = d.financeiro.find(function(f) {
        return f.numeroProposta === t.numeroProposta && f.status === 'Pendente';
      });
      if (parcelaLib) {
        alertas.push({
          area: 'Cross',
          tipo: 'Concluir libera parcela',
          texto: '...',
          relacionado: { numeroProposta: t.numeroProposta }
        });
      }
    }
  }
});
```

**Key insight:** o valor não está nos dados isolados de cada área, está nas CONEXÕES entre elas. `numeroProposta` é a chave universal que amarra Vendas → Financeiro → Engenharia → Operação.

## 7. Privacy lock para abas administrativas

Para esconder funcionalidade sensível em produção sem remover:

```javascript
// HTML: button com display:none por default
<button id="tabBtnCentral" style="display:none">🎯 Central</button>

// JS: desbloqueio via URL param + localStorage + atalho de teclado
const unlocked = localStorage.getItem('crm_central_unlocked') === '1';
// URL ?central=1 → seta flag; ?central=0 → remove
// Ctrl+Shift+G → toggle
```

Combina 3 vetores de desbloqueio (URL, teclado, console) — fácil pra você, invisível pra outros.
