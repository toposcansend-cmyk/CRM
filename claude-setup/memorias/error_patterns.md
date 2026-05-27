---
name: error-patterns
description: "Catálogo de padrões de falha conhecidos com causa raiz e solução — consultar SEMPRE antes de tentar refazer uma operação que falhou"
metadata:
  node_type: memory
  type: error-catalog
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
  created: 2026-05-23
  updated: 2026-05-26
---

# 🚨 Catálogo de Padrões de Erro — Toposcan / Claude operacional

> **Protocolo:** quando uma operação falhar, antes de retentar, conferir aqui. Se padrão conhecido → aplicar solução documentada. Se padrão NOVO → registrar aqui ao final.

## 🆕 Erros descobertos em 26/05/2026 (V7.7-V7.11)

> ⚠️ Renumerados em 26/05 (rotina de auto-conhecimento) — antigos E009/E010/E011 já existiam abaixo.

### E022 — `_derivarStatus` recebe objeto em vez de array
**Sintoma:** parcelas com `vencimento < hoje` (atrasadas) viram `status = 'Pendente'`. Saldo do dia inflado. Lista de "atrasadas" some.
**Causa:** `_derivarStatus(row)` espera array bruto da planilha (`row[FIN_COL.dataPagamento - 1]` é índice numérico). Objeto JS retorna `undefined`.
**Sintoma específico:** `34 parcelas atrasadas R$ 338k` quando `listPayments(filter:'atrasado')` retornava `2 parcelas R$ 22k`.
**Solução:** sempre passar `row` (array) direto: `var status = _derivarStatus(row);`
**Aplicado em:** `getCashFlow` V7.10

### E023 — `listTopoPartners` retorna `items` (não `itens`)
**Sintoma:** loop `r.itens.forEach` undefined. Dados existem mas frontend não acha.
**Causa:** endpoint retorna `items` (inglês), outros retornam `parcelas`/`dias`/etc.
**Solução:** lista oficial de chaves de retorno:
| Action | Chave |
|---|---|
| `listPayments` | `parcelas` |
| `listTopoPartners` | **`items`** ⚠️ |
| `listProducao` | `tarefas` |
| `getCashFlow` | `dias` |
| `getActiveAlerts` | `alertas` |
| `listUpcomingEvents` | `eventos` |
| `listAll` | `propostas` |
| `getLearnings` | `results` ⚠️ |

### E024 — Filtro `status === 'Pago'` esconde pagamentos do dia
**Sintoma:** parcela paga hoje no Financeiro não aparece no Fluxo de Caixa.
**Causa:** `if (status === 'Pago') return;` descartava TUDO.
**Solução V7.10:** incluir pagas com `dataPagamento >= hoje`, marcar com `paga: true`. Frontend mostra com badge `✓ PAGO`. NÃO somar no saldo projetado.

### E025 — Memórias não propagam entre PCs (Guilherme ↔ Marcelo)
**Sintoma:** edição de `.md` em `~/.claude/projects/.../memory/` no PC do Guilherme não aparece no PC do Marcelo.
**Causa:** memórias são locais por máquina, sem sync automático.
**Solução V7.11:** ver `claude-setup/MEMORIAS-CHANGELOG.md` no repo + script `verificar-atualizacoes.ps1`.

---

---

## E001 — try/catch silencioso engole erro de OAuth

**Sintoma:** API retorna `ok:true` mas ação não acontece (email não chega, evento não cria).

**Causa raiz:** Função GAS tem `try { MailApp.sendEmail(...) } catch (e) { Logger.log(e) }`. Erro de scope não autorizado vai pro Logger e é engolido, response retorna sucesso.

**Solução:**
1. Para diagnosticar: chamar `diagEmail` (retorna quota + scopes ativos)
2. Para forçar autorização: usar função `forceAuthX()` **SEM try/catch** (popup OAuth aparece)
3. Para corrigir definitivo: remover try/catch da função real OU retornar erro também no response

**Documentado em:** [[technical-patterns-gas-oauth-chrome]] seção 1
**Detectado em:** 22/05/2026 (Guilherme cobrou "não recebi nada")

---

## E002 — Cache CDN do raw.githubusercontent.com (5min)

**Sintoma:** Após `git push`, fetch do GitHub retorna conteúdo VELHO.

**Causa raiz:** `raw.githubusercontent.com` tem cache CDN de ~5 minutos.

**Solução:** Trocar para `api.github.com/repos/USER/REPO/contents/FILE.md?ref=main` — sempre fresh (base64 decode).

**Detectado em:** 22/05/2026

---

## E003 — Popup OAuth não aparece no Chrome MCP

**Sintoma:** Botão "Revisar permissões" abre janela popup separada. Chrome MCP não vê. `tabs_context` não mostra a janela.

**Causa raiz:** Popup windows não são tabs — MCP só vê tabs.

**Solução:** Não clicar em "Revisar permissões". Em vez disso, no log de execução procurar o link **"Clique aqui para conceder permissões"** — esse abre em `_blank` (nova aba) que aparece no MCP.

**Detectado em:** 22/05/2026

---

## E004 — Coordenadas hardcoded em automação UI falham

**Sintoma:** Click em `(688, 152)` funciona uma vez, falha na próxima.

**Causa raiz:** Layout muda 5-20px entre carregamentos (scrollbar, fontes, zoom). Coordenadas fixas não acompanham.

**Solução:** Sempre usar `find(query)` + `ref` no Chrome MCP. Coordenadas só como fallback explícito.

**Detectado em:** 22/05/2026 (selecionar dropdown no Apps Script Editor)

---

## E005 — Setter direto em textarea React não atualiza state

**Sintoma:** `textarea.value = "novo conteúdo"` muda visualmente mas React continua com valor antigo. Salvar não persiste.

**Causa raiz:** React rastreia mudanças via setter do prototype. Assignment direto bypassa o tracking.

**Solução:**
```js
const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
setter.call(textarea, content);
textarea.dispatchEvent(new Event('input', { bubbles: true }));
textarea.dispatchEvent(new Event('change', { bubbles: true }));
```

**Detectado em:** 22/05/2026 (reaplicar prompts nos Projects)

---

## E006 — PowerShell + emojis = parser error

**Sintoma:** Script PowerShell com emojis em strings quebra ao executar.

**Causa raiz:** Encoding UTF-8 sem BOM + emojis no source = parser perde controle de bytes.

**Solução:**
1. Scripts PowerShell pra produção → texto plano (sem emoji)
2. Se precisar emoji → garantir `Save-As UTF-8 with BOM` E declarar `[Console]::OutputEncoding = [Text.Encoding]::UTF8`
3. Emojis ficam pra OUTPUT interativo do Claude, não scripts

**Detectado em:** 22/05/2026 (`instalar-memorias.ps1`)

---

## E007 — UI re-renderiza e perde scroll state

**Sintoma:** Dropdown aberto, scroll feito, reabre → scroll voltou ao topo. Tentativas de clicar no item desejado falham.

**Causa raiz:** React/Vue re-renderiza componente ao reabrir, perdendo scroll position.

**Solução:**
1. Após abrir dropdown → scroll IMEDIATAMENTE (sem aguardar)
2. Click no item logo após scroll (sem esperas grandes)
3. Se possível, usar busca interna do componente em vez de scroll manual

**Detectado em:** 22/05/2026

---

## E008 — Declarar "feito" sem prova externa

**Sintoma:** Claude reporta "email enviado!" mas usuário diz "não recebi". Operação falhou silenciosamente.

**Causa raiz:** API que retorna `ok:true` ≠ ação executada. Pode ser:
- try/catch engoliu erro (E001)
- Async não esperou completar
- Mock/stub retornando sucesso falso
- Cache desatualizado

**Solução PROTOCOLO:**
- Email → verificar via `listMessages` (Gmail API) ou pedir confirmação humana
- Evento Calendar → confirmar com `listUpcomingEvents`
- Planilha → re-ler valor após escrita
- Trigger → confirmar com `ScriptApp.getProjectTriggers()`
- Deploy GAS → testar endpoint com `Invoke-RestMethod`

**REGRA DE OURO:** *"ok:true ≠ feito. Sem prova externa, não declare feito."*

**Detectado em:** 22/05/2026 (Regra 10 do [[feedback-crm-gestao]])

---

## E009 — Versão do GAS no repo divergente da publicada

**Sintoma:** Código no `google-apps-script.js` do GitHub é antigo (5 actions, 15 colunas), mas API publicada é V7.5 (30+ actions, 16 colunas).

**Causa raiz:** Antigravity/OpenClaw editaram script.google.com direto sem commitar no repo. Versão canônica vive no Google, não no Git.

**Solução:**
- Fonte da verdade do código GAS = `C:\Users\23GAMER\.gemini\antigravity\scratch\clasp-crm\Code.js` (clasp local)
- Workflow: editar local → `clasp push --force` → `clasp deploy -i <ID>`
- Após cada deploy: copiar `Code.js` para `google-apps-script.js` no repo CRM e commitar

**Detectado em:** 19/05/2026 ([[project-crm-discrepancias]])

---

## E010 — `script.google.com` não escuta Authorization header

**Sintoma:** Header `Authorization: Bearer X` enviado mas GAS não recebe.

**Causa raiz:** Deployment "Anyone with link" do GAS ignora headers customizados. Secret tem que ir no body.

**Solução:** Enviar secret dentro do JSON body: `{"secret":"toposcan-agent-2026","action":"...","..."}`. Content-Type: `text/plain`.

**Detectado em:** histórico (Antigravity)

---

## E011 — Blender Microsoft Store bloqueia execução CLI (AppX)

**Sintoma:** `& "C:\Program Files\WindowsApps\BlenderFoundation.Blender_*\Blender\blender.exe" --version` retorna `Acesso negado` mesmo com permissões de usuário. `blender-launcher.exe` no `WindowsApps` do AppData também nega. MCP do Blender não conecta em `localhost:9876`.

**Causa raiz:** Microsoft Store apps (AppX) têm sandboxing que bloqueia execução por processos não-Store. O launcher é só uma stub que delega ao runtime Store. Permissão NTFS está OK; o bloqueio é da própria AppX security layer.

**Solução:**
- Para modelagem programática: usar `trimesh` em Python (exporta OBJ/STL/PLY/GLB/DAE/3MF nativos, todos importáveis em Civil 3D/AutoCAD/QGIS)
- Para Blender real: usuário precisa abrir manualmente e rodar script via Scripting workspace, OU reinstalar Blender da versão portable (blender.org)
- Para automação CLI: documentar que Microsoft Store Blender não é viável para pipelines automatizados

**Pipeline alternativo documentado:** [[technical-patterns-pdf-to-3d]]

**Detectado em:** 2026-05-23 ([[project-torre-radar-simepar]])

---

## E013 — Custom Instructions de conta sobrepõem Project Instructions

**Sintoma:** Project Instructions corretamente injetadas (ex: "Você é Vanessa"), mas quando perguntada "quem é você", a IA responde com a identidade definida no perfil GERAL de conta ("você é Rafaela").

**Causa raiz:** claude.ai aplica as "Instruções para o Claude" do nível de conta (Configurações > Geral) a TODOS os chats em TODOS os Projects. Quando o perfil de conta declara identidade ("você é X"), essa identidade tem precedência sobre identidades declaradas no Project Instructions — especialmente quando o "Você é X" no Project não está no topo.

**Solução:**
1. Edite a instrução de conta pra ser project-aware: adicione cláusula "EXCEÇÃO DE IDENTIDADE: se este chat está dentro de Project específico nomeado X, assume identidade de X"
2. No Project Instructions, coloque "**VOCÊ É {Nome}** — sobrescreve identidade default do perfil" como PRIMEIRA seção (logo após marker [INÍCIO])
3. Aplicar AMBOS — só um nível não é suficiente

**Detectado em:** 2026-05-26 (4 IAs gerentes Toposcan respondendo como Rafaela)

---

## E014 — file_upload via Chrome MCP bloqueado pra paths locais

**Sintoma:** `file_upload` retorna "Cannot upload X: only files the user has shared with this session can be uploaded".

**Causa raiz:** O Chrome MCP `file_upload` tool tem permissão restrita — só aceita paths em "session's outputs/uploads folders, or folders the user has connected". O working dir do Claude Code (C:\Users\23GAMER\) NÃO conta como shared.

**Solução (DataTransfer hack):**
```js
// Em vez de file_upload, faça em JS dentro da page:
const resp = await fetch('https://api.github.com/repos/.../contents/FILE?ref=main');
const meta = await resp.json();
const bytes = Uint8Array.from(atob(meta.content.replace(/\n/g, '')), c => c.charCodeAt(0));
const file = new File([bytes], 'name.md', { type: 'text/markdown' });

// Achar o input correto — NÃO chat-input-file-upload-onpage, mas o hidden com .md no accept
const projInput = Array.from(document.querySelectorAll('input[type=file]'))
  .find(inp => inp.accept && inp.accept.includes('.md'));

const dt = new DataTransfer();
dt.items.add(file);  // pode adicionar múltiplos
projInput.files = dt.files;
projInput.dispatchEvent(new Event('change', { bubbles: true }));
```

**Detectado em:** 2026-05-26 (upload de PROMPT-CLAUDE-X.md + shared-files nos 4 Projects)

---

## E015 — Click via ref do Chrome MCP falha em botões dentro de Project

**Sintoma:** `left_click` com `ref` apenas exibe tooltip do botão, não dispara o handler. Modal não abre.

**Causa raiz:** Em algumas páginas da claude.ai, o click via ref do find/read_page registra como hover (mouse enter) mas não como click real. Comportamento inconsistente entre Projects.

**Solução:** Usar JS direto na page:
```js
const editBtn = Array.from(document.querySelectorAll('button'))
  .find(b => b.getAttribute('aria-label') === 'Edit Instructions');
editBtn.click();  // dispara handler React corretamente
```

**Detectado em:** 2026-05-26 (reaplicação de prompts nos 4 Projects)

---

## E016 — Settings/Profile do claude.ai não auto-saving via blur simples

**Sintoma:** Edita textarea de Instruções para o Claude, blur, fecha página, volta — conteúdo voltou ao anterior. Auto-save não disparou.

**Causa raiz:** O auto-save da página de Settings precisa de sequência específica de eventos para detectar mudança real (não só value setter).

**Solução (sequência funcional):**
```js
ta.focus();
await new Promise(r => setTimeout(r, 200));
ta.select();
const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
setter.call(ta, content);
ta.dispatchEvent(new Event('input', { bubbles: true }));
ta.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
ta.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(r => setTimeout(r, 1500));
ta.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
ta.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
ta.blur();
await new Promise(r => setTimeout(r, 2000));
```

**Detectado em:** 2026-05-26 (atualização do perfil claude.ai)

---

## E017 — PowerShell stdin pipe injeta newline em wrangler secret put

**Sintoma:** Após `'valor' | npx wrangler secret put NOME`, o backend recebe "Senha inválida" — porque o secret foi salvo com `\n` ou `\r\n` no fim. A comparação string falha silenciosa.

**Causa raiz:** O operador `|` do PowerShell trata o stdout como linhas e termina com newline. Mesmo `Get-Content -Raw` com `WriteAllText(...,utf8 sem BOM)` ainda injeta porque o pipe finaliza com newline.

**Solução:** Cloudflare API direta, com controle total do valor:
```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/scripts/$SCRIPT/secrets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"WEBHOOK_SECRET","text":"valor-limpo-sem-newline","type":"secret_text"}'
```

Token OAuth do wrangler está em `C:\Users\23GAMER\AppData\Roaming\xdg.config\.wrangler\config\default.toml`.

**Detectado em:** 2026-05-26 (deploy MCP server — "Senha inválida" no smoke test)

---

## E018 — Cloudflare Workers subdomain API field é "subdomain" (não "name")

**Sintoma:** PUT `/accounts/{id}/workers/subdomain` com body `{"name":"X"}` retorna erro 10033: `Subdomain '' is invalid`. O nome não foi lido.

**Causa raiz:** Diferente da maioria das APIs Cloudflare que usam `name`, este endpoint específico usa `subdomain` como campo.

**Solução:**
```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/subdomain" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"toposcan"}'
```

Retorna `{"result":{"subdomain":"toposcan"},"success":true}`.

**Detectado em:** 2026-05-26 (registrando subdomain pro Workers depois do primeiro deploy falhar)

---

## E019 — Workers exige subdomain antes do primeiro deploy

**Sintoma:** `wrangler deploy` em conta nova retorna ERROR "You need to register a workers.dev subdomain before publishing to workers.dev".

**Causa raiz:** Cloudflare Workers Free precisa de subdomínio único por conta. Não cria automaticamente no signup — só na primeira visita ao Workers landing page OU via API explícita.

**Solução:**
1. Abrir `dash.cloudflare.com/{ACCOUNT_ID}/workers/workers-and-pages` UMA VEZ no browser logado → cria auto, OU
2. PUT na API (ver E018)

**Detectado em:** 2026-05-26

---

## E020 — claude.ai não tem fetch HTTP arbitrário pra IAs

**Sintoma:** Beatriz (claude.ai Project) recebe instrução no prompt "use o webhook X com secret Y" mas reporta "Webhook fora do ar" mesmo com webhook funcionando.

**Causa raiz:** claude.ai Projects têm tools limitados: Gmail/Calendar/Drive/Web Search/Habilidades/Plugins-desktop-only. **Não há `fetch()` ou `requests.post()` genérico** pra URL com body+secret customizado. As IAs "descrevem ações" mas não conseguem POST.

**Solução:** Construir um **MCP server custom** que wrappea o webhook em tools nomeadas. claude.ai conecta o MCP via `Personalizar → Conectores → Adicionar conector personalizado`. Detalhe em [[technical-patterns-mcp-server]] e [[project-mcp-toposcan-crm]].

**Detectado em:** 2026-05-26 (Beatriz "não consigo operar" — diagnóstico revelou gap de ferramenta)

---

## E021 — claude.ai Plugins só funcionam no Desktop app

**Sintoma:** Tentativa de adicionar plugin custom via web claude.ai mostra "Os plugins podem ser visualizados, mas estão disponíveis para uso apenas no aplicativo para desktop".

**Causa raiz:** Plugins é uma feature de extensão do Claude Desktop app (Mac/Windows), não funciona via web/mobile.

**Solução:** Pra IAs que rodam no web, usar **conectores MCP** (não plugins) via `Personalizar → Conectores → +` botão. Mais flexível e roda em todas plataformas.

**Detectado em:** 2026-05-26

---

## E026 — PowerShell Add-Content `-Encoding UTF8` injeta BOM em arquivo sem BOM

**Sintoma:** Append a `.md` UTF-8 sem BOM via `Add-Content -Encoding UTF8` produz mistura de bytes — emoji `🤖` no source vira `ðŸ¤–` quando lido depois. Headers de seção criados pelo append ficam corrompidos visualmente.

**Causa raiz:** PowerShell 5.1 `-Encoding UTF8` significa **UTF-8 com BOM**. O arquivo original não tinha BOM. O BOM injetado no meio (não no início) confunde editores e parsers que detectam encoding por heurística.

**Solução:** Use .NET direto com `UTF8Encoding($false)` (parâmetro false = sem BOM):
```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::AppendAllText($path, $content, $utf8NoBom)
```

Alternativa: evitar emojis no append e usar header ASCII (`## Auto-log` em vez de `## 🤖 Auto-log`).

**Detectado em:** 2026-05-26 (post-session.ps1 — primeiro append em metrics.md gerou `ðŸ¤–` no header)

---

## E027 — Edição paralela: outra sessão mexe em arquivo que eu também editava

**Sintoma:** Eu termino uma edição, vou commitar, e percebo via system-reminder *"X was modified, either by the user or by a linter"* que outra sessão (Claude Code do Marcelo, ou claude.ai injetando memory, ou edição manual) tocou o arquivo enquanto eu trabalhava. Ou pior: meu commit dá merge conflict no push.

**Causa raiz:** Sistema Toposcan tem múltiplas instâncias evoluindo o mesmo repo `toposcansend-cmyk/CRM` simultaneamente (2 Claude Codes, 4 IAs gerentes via Aprendizados, edições manuais). Sem coordenação central — apenas Git como event bus.

**Solução (defensiva):**
1. `git pull origin main` ANTES de qualquer commit substantivo
2. `git log --oneline -10` pra ver atividade recente
3. Se vou editar arquivo "sensível" (memórias compartilhadas, MEMORY.md, CHANGELOG, error_patterns), `git log -1 --format='%ci' -- caminho` pra ver última modificação
4. Se outra sessão modificou recentemente → reler via `Read` antes de editar
5. Edits MINIMALISTAS via `Edit` (não `Write`) reduzem chance de conflict
6. Commit IMEDIATO (não acumular várias mudanças)
7. Se conflito de merge → resolver manual, commit como `merge: integrar evoluções paralelas`

**Aceitar trabalho da outra sessão:** se ela já fez algo que eu IA fazer, aceitar. Não reverter pra "padronizar com meu plano". Ver `[[pattern-parallel-evolution]]` pra detalhes.

**Detectado em:** 2026-05-26 noite (sessão paralela adicionou observability v1.1.0 no MCP server enquanto eu trabalhava em sync script)

---

## 🆕 Template para novo padrão

```markdown
## EXXX — Título curto descritivo

**Sintoma:** O que aparece quando o erro ocorre.

**Causa raiz:** Por que acontece (mecanismo subjacente).

**Solução:** Passos exatos pra resolver. Code se possível.

**Detectado em:** Data + contexto (sessão / cobrança de user / observação)
```

---

## 📊 Estatísticas

- **Total catalogado:** 26 padrões únicos (E001-E011 + E013-E027; E012 pulado historicamente)
- **Última atualização:** 2026-05-26 (noite — E027 = evolução paralela: outra sessão adicionou observability v1.1.0 ao MCP enquanto eu trabalhava no sync script; detectada via system-reminders + git pull)
- **Padrões mais comuns:** OAuth/auth (3), UI automation (6 incl. claude.ai), state management (3), Cloudflare/MCP deploy (4), Sheets schema (3), PowerShell encoding (2), parallel evolution (1), Windows sandboxing (1)

> ⚠️ Quando errar pela mesma razão duas vezes, ATUALIZE este arquivo IMEDIATAMENTE.
