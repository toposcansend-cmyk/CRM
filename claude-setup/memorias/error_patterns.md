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

## E028 — ReCap Pro 2026 crasha silenciosamente com coordenadas WGS84 absolutas grandes

**Sintoma:** Importar .e57/.las/.laz de aerolevantamento (drone) com coordenadas geográficas absolutas (lat -25, lng -50, alt 850-950m). Barra de indexação ReCap salta direto do 0% pro 100% em poucos segundos. RCS final tem ~1 MB independente do source (8 GB de origem → 1 MB de RCS). Viewport abre vazia. Sem erro visível na UI.

**Causa raiz:** Parser do ReCap não suporta bounding-box em escala global (centenas de quilômetros). Crash silencioso durante indexação. Logs em `%LOCALAPPDATA%\Autodesk\CER\<hash>\cer.log` confirmam exception. Driver NVIDIA antigo contribui mas não é a causa única. **Mesmo problema no GUI E no decap.exe CLI.**

**Solução:** Exportar o point cloud direto do **Metashape via Python CLI** com Local Coordinates:
```python
chunk.exportPointCloud(
    output_path,
    format=Metashape.PointCloudFormat.PointCloudFormatLAS,
    crs=Metashape.CoordinateSystem()  # vazio = Local Coords, origem em 0,0,0
)
```
- `crs=None` retorna `invalid value type` em Metashape 2.1.3
- Comando: `metashape.exe -r script.py projeto.psx saida.las "LAS"`
- Importar o LAS resultante no ReCap GUI → funciona normalmente

**Comprovado em 5 projetos (27/05/2026):** Memorial Tropeirismo, São Sebastião, São José, São João Paulo II, Polacos. RCS final proporcional aos pontos (530 MB a 4.47 GB).

**Detalhe completo em:** [[technical-patterns-metashape-recap-pipeline]]

**Detectado em:** 27/05/2026 (após 5 tentativas falhas via e57/las/decap CLI)

---

## E029 — MCP `set_cash_balance` exige campo `valor`, não `saldo`

**Sintoma:** Chamar a tool `crm_set_cash_balance` com `{saldo: 12594.46}` (conforme o JSONSchema publicado) retorna `{ok:false, error:"Faltou: valor"}`. O saldo NÃO é gravado.

**Causa raiz:** O schema da tool declara o parâmetro como `saldo` (required), mas o backend GAS/webhook espera `valor`. Discrepância schema-publicado × API-real (mesmo gênero de E018 e E023). Pista do nome correto: `get_cash_balance` retorna a chave `valor`.

**Solução (✅ RESOLVIDO 01/06/2026 — deploy @33):** Backend `setCashBalanceAction` agora aceita **`valor` OU `saldo`**:
```javascript
var rawValor = (body.valor !== undefined && body.valor !== null) ? body.valor : body.saldo;
```
A tool MCP continua mandando `saldo` (schema inalterado) e agora funciona. Verificado end-to-end: GAS direto (ambas as chaves) + tool `crm_set_cash_balance` real (IA→Worker→GAS) → `{ok:true}`. Não precisou mexer no MCP server.

**Detectado em:** 29/05/2026 (reconciliação de caixa — 3 saídas pagas a parceiros Alexandre/Ana/Amilton não baixaram o saldo manual; saldo é manual, `mark_paid` não o toca). **Corrigido em:** 01/06/2026 (Vanessa não conseguiu gravar saldo via MCP; ver também E031).

---

## E031 — Auto-saldo: marcar recebido/pago ajusta o caixa no BACKEND (V7.14)

**Sintoma:** Pede pra uma IA gerente (ex: Vanessa) "lançar as entradas que caíram" e o **SALDO ATUAL EM CAIXA não muda**, mesmo as parcelas ficando `Pago`. Parece que o caixa "não atualizou".

**Causa raiz:** A auto-atualização do caixa ao dar baixa numa parcela vive **só no frontend** (`crm.html` → `fcAjustarSaldoApos`, calcula `saldo += delta` e chama `setCashBalance` com `valor`). O backend `markPaid` (Code.js ~916) **NÃO** toca `CAIXA_BALANCE` — só grava `dataPagamento`/status. Logo, quando a baixa vem pela **IA/MCP** (`crm_mark_paid`) ou por `addPaymentPlan`, o caixa fica parado. Só a baixa feita **clicando no card do Fluxo de Caixa na web** mexe no saldo.

**Solução (✅ IMPLEMENTADO V7.14 — 01/06/2026, deploy @34):** Ajuste movido pro **backend** (fonte única da verdade): `markPaid` SOMA a entrada (idempotente — lê o status ANTES, só soma na transição p/ Pago) e `updateTopoPartner` SUBTRAI a saída pelo delta de `valorPago`. Agora vale em **qualquer canal** (site OU IAs). Pra não contar 2×, o frontend (`fcAjustarSaldoApos` em crm.html) parou de persistir via `setCashBalance` — só faz update otimista de tela; o `fcRefresh` reconcilia com o backend. Helper: `_ajustaCaixa(delta, obs)`. O campo manual (`setCashBalanceAction`) segue pros imprevistos. Testado E2E: entrada +0,01 via tool MCP `crm_mark_paid`, idempotência (2ª marcação não soma), saída −0,01 via `crm_update_topo_partner`. Gerentes avisados: aprendizado **APR-0060**.

**Detectado e implementado em:** 01/06/2026 — Guilherme: "entrou dinheiro mas o caixa não atualizou" → "deve sempre calcular em cima do último valor conforme marca recebido/pago, + campo manual pros imprevistos". Relacionado: E029.

---

## E030 — Nuvem registrada SEM pontos de controle fica em coords locais (não georreferencia em UTM)

**Sintoma:** Nuvem RTC360/Faro registrada no Cyclone REGISTER 360 cai a centenas de km de outra fonte georreferenciada (ex.: LIDAR em UTM) quando unificadas; ou o RCP exportado tem `CoordinateSystem=""` e coords pequenas (origem ~0). No CGH Cachoeira do Lageado: FS01/FS02 ficaram **436km** fora do LIDAR UTM 22S.

**Causa raiz:** O registro foi feito só com **VIS + cloud-to-cloud** = posição **relativa** entre cenas, em coords **locais**. O GPS embarcado do RTC360 tem precisão de só **±10m** — insuficiente pra topografia. Sem **pontos de controle** picados em alvos B&W via Cyclone FIELD 360 (CSV/TXT → target fitting → transformação), não existe amarração ao sistema de mundo. **Não é bug do software — é método de campo sem controle.**

**Solução:**
1. **Certo (prevenir):** georreferenciar com **control points** no FIELD 360 / painel Georeferencing do REGISTER 360 — aplicado **por último** (depois de georref os setups travam e o bundle não recalcula).
2. **Remediar sem controle:** alinhar manualmente por **ponto comum** identificável nas duas nuvens (ReCap GUI / UCS-on-control), ou **subtrair o offset UTM** do dado georreferenciado (junta visual, perde georref).

**Detalhe completo:** [[technical-patterns-register360-scene-registration]] §7. Caso: [[project-cgh-cachoeira-lageado]].

**Detectado em:** 25/05/2026 (CGH Cachoeira) — consolidado como padrão no estudo de registro 360 em 30/05/2026.

---

## E032 — Array tratado como objeto `{rows}` → comercial do Central zerado silenciosamente

**Sintoma:** `getCrossKPIs` e `getActiveAlerts` retornavam **0** em tudo que é comercial (pipeline, fechadas, deals travados) e **nenhum alerta comercial** disparava — sem erro, sem log. Só apareceu quando fui calcular "fechamento do trimestre" e vi `pipelineAtivo: 0` com 37+ propostas na base.

**Causa raiz:** `_centralColetarTudo()` fazia `var crmData = readAllData(); var propostas = (crmData && crmData.rows) ? crmData.rows : [];`. Mas `readAllData()` retorna um **ARRAY**, não `{rows:[...]}`. Logo `crmData.rows === undefined` → `propostas = []` SEMPRE. O `forEach` rodava sobre vazio = zero, sem estourar.

**Agravante:** mesmo populando, os KPIs liam `p.valorTotal`/`p.percentual`, mas o objeto da proposta tem `p.valor`/`p.probabilidade` (e **não há** coluna "atualizadoEm" na planilha — col 1-16 são vendedor…observacao).

**Solução (deploy @39):**
1. `var propostas = (readAllData() || []).map(...)` — usar o array direto.
2. Normalizar aliases: `p.valorTotal = Number(p.valor)`, `p.percentual = Number(p.probabilidade)`.
3. `p.atualizadoEm` = último follow-up parseado (`_parseDataBR(...).toISOString()`) como proxy de "última atividade" p/ deal-travado.

**Lição geral:** falha **silenciosa** (array como objeto → `[]` em vez de erro) só se pega **verificando o NÚMERO real**, não `ok:true`. Pipeline R$ 0 com base cheia = red flag. Ver [[reference-crm-api]]. Aprendizado: **APR-0062**.

**Detectado em:** 02/06/2026 (ao construir hero por usuário + fechamento do trimestre).

---

## E033 — wrangler OAuth token autorizado SEM marcar a conta → 10000 em tudo account-scoped

**Sintoma:** `wrangler deploy` falha com `Authentication error [code: 10000]` / "Failed to retrieve account IDs". O mesmo token como `CLOUDFLARE_API_TOKEN` → `GET /accounts` volta `result:[]` (vazio, success:true) e qualquer `/accounts/{id}/workers/...` dá 10000. **Refresh do token via refresh_token NÃO resolve** (mantém o mesmo grant). O token TEM `workers_scripts:write` no escopo — não é falta de permissão de Workers.

**Causa raiz:** Na tela de consentimento do `wrangler login` ("Wrangler wants to access your account") existe uma seção **"Select account(s)"** com a conta **DESMARCADA** por padrão (e "Grant access to all accounts" OFF). Se aprovar SEM marcar a conta, o token nasce sem vínculo de conta → não enxerga conta nenhuma → 10000 em toda chamada account-scoped. Erro silencioso clássico: o login "deu certo", o token existe, mas é inútil pra deploy.

**Solução:** `cd work/CRM/mcp-server && npx wrangler login` → na tela de consentimento **MARCAR o checkbox da conta** ("Toposcan.send@gmail.com's Account") OU ligar "Grant access to all accounts" → "Review permissions" → "Allow". Depois `CLOUDFLARE_ACCOUNT_ID=9857af7323ac99bc3bda79b163b2f2ae npx wrangler deploy`.
- **Account ID:** `9857af7323ac99bc3bda79b163b2f2ae` (toposcan.send@gmail.com).
- **Automação headless do login NÃO funciona:** a página `/login` do dash trava no spinner em aba background (SPA throttled pelo Chrome; precisa de foreground) e corre contra o timeout (~2 min) do callback do `wrangler login` em `localhost:8976`.
- Alternativa durável: API Token (dash → My Profile → API Tokens → template "Edit Cloudflare Workers"), usado via `CLOUDFLARE_API_TOKEN`.

**Detectado em:** 02/06/2026 (deploy da tool `crm_add_topo_partner_parcelado` no MCP — token OAuth do wrangler não autenticava).

---

## E034 — `crm_update` rejeita `percentual`; o campo certo é `probabilidade`

**Sintoma:** `crm_update` com `updates:{percentual:100}` (nome que a DESCRIÇÃO da tool MCP sugere — *"status, percentual, valor, observacoes"*) retorna `{ok:false, error:"Campo inválido: percentual"}` e **rejeita o update inteiro** (nenhum campo grava).

**Causa raiz:** schema/descrição da tool MCP desalinhado do backend GAS (mesmo gênero de E029/E023/E018). Campos VÁLIDOS do `update` (vindos do próprio erro): `vendedor, numeroProposta, cliente, contato, telefoneEmail, email, servico, proximoFollowup, ultimoFollowup, dataFollowup, localizacao, dataProposta, fechamentoPrevisto, dataFechamento, valor, probabilidade, status, observacao`. Pegadinhas: `probabilidade` (NÃO `percentual`), `observacao` singular (NÃO `observacoes`), `dataFechamento`/`fechamentoPrevisto` (NÃO `previsaoFechamento`).

**Solução:** usar `probabilidade:"100%"` (string com %), `observacao` (singular), `dataFechamento` (real) / `fechamentoPrevisto` (forecast). **Lado bom:** a validação é estrita e fail-closed — rejeita no 1º campo inválido, então **nada grava pela metade** e a cascata de "Fechada" NÃO dispara num update barrado (seguro corrigir e reenviar).

**Detectado em:** 03/06/2026 (fechamento Tenenge Topografia `05202669.3` — 1ª tentativa barrada por `percentual`).

---

## E035 — Cascata de "Fechada" envia e-mail com valor R$0 / campos trocados

**Sintoma:** ao mudar status p/ `Fechada` via `crm_update`, a resposta traz `cascade:{emailEnviado:true, valor:0, numeroProposta:"Guilherme"}` — `valor` zerado e o NOME DO VENDEDOR caindo no campo `numeroProposta`. O e-mail automático *"🎉 Fechou!"* pros sócios sai com **R$ 0** em vez do valor real.

**Causa raiz:** o builder do payload da cascata (backend, pós-update) lê campos errados/desatualizados da linha — provável leitura antes do write consolidar, ou mapeamento de índice trocado (mesmo gênero de E032: aliases `valor`/`valorTotal`, `numeroProposta`/`vendedor`). **Cosmético:** a PLANILHA grava certo (verificado: valor R$108.000 na linha + parcela + fluxo OK). Só o e-mail sai torto.

**Solução:** não bloqueia — ao fechar, avisar o sócio que o valor no e-mail automático pode vir R$0 e que a fonte da verdade é a planilha/Financeiro. Fix de verdade: corrigir o builder em `Code.js` (montar a partir do objeto JÁ gravado, com aliases `valor||valorTotal` e vendedor no campo certo). **Candidato a corrigir junto com E032.**

**Detectado em:** 03/06/2026 (fechamento Tenenge Topografia — `cascade.valor:0`).

---

## E036 — Deploy do CRM: app vivo é `index.html` (raiz); `/CRM/crm.html` dá 404

**Sintoma:** após `git push` do `crm.html` + deploy Pages OK, `curl https://toposcansend-cmyk.github.io/CRM/crm.html` retorna **404** (9.379 bytes = página de erro do GitHub Pages). Dá impressão de que o deploy não pegou.

**Causa raiz:** o Pages publica o app na **raiz como `index.html`** (≈541 KB), não em `/crm.html`. O `index.html` LOCAL do repo (186 KB, antigo 19/05) NÃO é o que vai pro ar — o conteúdo do `crm.html` é servido como `index.html`. Logo o app vivo é `https://toposcansend-cmyk.github.io/CRM/` (= index.html) e `/crm.html` não existe no site publicado.

**Solução (verificar deploy):** conferir SEMPRE a **raiz**, nunca `/crm.html`:
```bash
curl -sI "https://toposcansend-cmyk.github.io/CRM/"            # 200 + Content-Length ~541KB + Last-Modified recente
curl -s  "https://toposcansend-cmyk.github.io/CRM/" | grep -c "MEU_MARCADOR_DE_CODIGO"
```
⚠️ **Service Worker (`sw.js`):** o navegador do usuário pode servir o bundle ANTIGO do cache mesmo com o servidor já atualizado → pedir 1 hard-refresh (ou `forcarAtualizar()`, que limpa caches + desregistra o SW).

**Detectado em:** 03/06/2026 (deploy do fix de cache-invalidation do hero — verifiquei `/crm.html` e tomei 404 antes de checar a raiz).

---

## E037 — "Fechado do mês" diverge entre hero e Evolução (2 backends, 2 convenções de data)

**Sintoma:** o hero ("Fechado em Junho") mostra **1 · R$108k** e a aba Evolução mostra **2 · R$109k** pro MESMO mês. Números de fechamento não batem entre telas.

**Causa raiz (dupla):**
1. **Dois backends:** o frontend (lista/Evolução) lê do **Cloud Bridge legado** `AKfycbwh…?action=getdata` (`puxarDadosDaNuvem`, crm.html ~5740); o hero/KPIs lê do **canônico** `AKfycbz…` (`getCrossKPIs`). Ambos leem a MESMA planilha, mas computam diferente.
2. **Convenções de data diferentes:** `getCrossKPIs` conta Fechada por **`dataFechamento` ∈ mês** (Code.js ~1920); `evoParseDate` (crm.html ~4964) datava por **`fechamentoPrevisto || dataProposta`** (nunca olhava `dataFechamento`). Deal Fechada SEM `dataFechamento` → hero ignora, Evolução pega pela proposta. **7 de 46 Fechadas estavam sem `dataFechamento`** (fechadas pela via de vendas legada, que não carimba a data).

**Solução (03/06/2026):**
- Frontend `evoParseDate` prioriza `dataFechamento` (`dataFechamento || fechamentoPrevisto || dataProposta`) — deploy `0a1c943`.
- Backend `getCrossKPIs` ganha o MESMO fallback de data — clasp deploy **@43** (deployment estável `AKfycbz…`).
- Backfill da `dataFechamento` faltante (Ruan Pablo `062026105.0` → 03/06). Os outros 6 sem-data passam a contar pelo fallback → **trimestre subiu 16→19 (+R$8,3k que estava invisível)**.
- ⚠️ **Pendência (causa na origem):** a via de fechamento legada (`syncToSheet` → `AKfycbwh`) NÃO carimba `dataFechamento` ao marcar Fechada. Enquanto não corrigir lá, vão reaparecer Fechadas sem data.

**Lição geral:** dois backends + duas convenções de data = divergência silenciosa. A data de FATURAMENTO tem que ser o **fechamento real**, não a previsão/proposta.

**Detectado em:** 03/06/2026 (Guilherme: "por que 109k/2 na Evolução e 108k/1 no dashboard?").

---

## E038 — Mobile: `table { display:none !important }` global esconde TODA tabela; override sem `!important` perde

**Sintoma:** no celular, tocar num período da aba **Evolução** "não fazia nada" / tela "truncada" — o painel de detalhe renderizava o cabeçalho ("06/2026 — 26 propostas (4 fechadas)") mas a **lista de propostas sumia**. `getComputedStyle(table).display === 'none'`, `clientWidth: 0`.

**Causa raiz (cascata CSS):** no `@media (max-width:768px)` existe `table { display:none !important }` (crm.html ~1813) — criada pra trocar a tabela principal por `.proposta-card` no mobile, mas pega **todas** as tabelas. O override que devia reexibir a de detalhe (`.evo-detail-table { display:block; overflow-x:auto }`, ~2965) **não tinha `!important`** → `!important` vence especificidade, então a tabela continuava `none`. A lista existia no DOM, só invisível.

**Solução (11/06/2026):** `.evo-detail-table { display:block !important; overflow-x:auto; -webkit-overflow-scrolling:touch }` — deploy `e3d3d14`. Verificado no preview mobile 375px: 26 linhas visíveis, rola horizontal (654px em 331px).

**Lição geral:** quando o mobile usa "esconder tabela → mostrar cards" com `!important` blanket, QUALQUER tabela que precise aparecer no mobile precisa de `!important` no override. ⚠️ **Provável colateral não auditado:** outras tabelas de detalhe/KPI podem estar invisíveis no mobile pela mesma regra — auditar se reclamarem.

**Bônus da mesma sessão:** o número "🏆 Fechado em [mês]" do hero não tinha `onclick` (era só display) → ninguém via QUAIS deals fechou. Virou clicável → modal `fechadasModal` (cards via `.fechadas-card`, classe própria porque `.proposta-card` só tem estilo dentro do `@media` mobile). Usa `evoParseDate` (`dataFechamento` first, ver [[error-patterns]] E037) pra casar com o hero. `.stats` (Total/Fechadas/etc) está `display:none` GLOBAL — só o hero aparece, então o tile do hero era o único alvo de clique possível.

**Detectado em:** 11/06/2026 (Guilherme, no celular: "clico no número no home não acontece nada, e no Evolução também, está meio truncado").

**Follow-up (mesma noite) — "duplicata" que NÃO era duplicata:** Guilherme viu 2 cards iguais no modal ("Jonathan-China · Fotos de Drone · R$2.500 · Marcelo") e pediu "corrija, tá duplicado". `crm_find cliente=Jonathan` mostrou que são **2 jobs reais distintos**: `05202699.0` (drone Campinas-SP) × `062026108.0` (6 igrejas Cotia-SP, parceiro Alexandre Scussel R$800) — e a observação do 2º já dizia "Trabalho NOVO, distinto da prop 05202699.0". Apagar teria sumido com R$2.500 reais + custo de parceiro vinculado. **Lição:** "parece duplicado" no UI ≠ duplicado no dado. Antes de exclusão irreversível em prod, SEMPRE `crm_find` e ler observação/numeroProposta/localização. O fix certo foi de APRESENTAÇÃO: o card passou a mostrar `📍 localização` + `Nº numeroProposta` (a chave única desambigua jobs iguais nos campos visíveis) — deploy `dcb29ec`. Não existe tool MCP de delete de proposta de Vendas, o que reforça: exclusão é manual e deliberada, nunca o reflexo. No mesmo deploy o tile "🏆 Fechado em [mês]" foi pro dashboard do **Marcelo** (full-width `grid-column:1/-1`, clicável → mesmo modal).

---

## E039 — `proximoFollowup` nunca foi auto-linkado; prompt da Camila com regra ERRADA (+5 ≠ padrão +7)

**Sintoma:** Guilherme (14/06) apontou que a Camila subiu a proposta Galeria Ramal `062026202.0` com `proximoFollowup = 16/06` (= dataProposta 11/06 **+5**), enquanto o padrão da casa é **+7 dias corridos** ("já linka com a própria data").

**Causa raiz (2 camadas):** (1) **Nunca houve auto-compute** de `+7` no backend (`Code.js`) nem no frontend (`crm.html` só lê/escreve o campo verbatim). O "já linka" era convenção, não código. (2) O prompt da Camila (`PROMPT-CLAUDE-PROPOSTAS.md`) codificava regra DIFERENTE e errada: Passo 9 dizia "agenda proximoFollowup **+3-5 dias úteis** **na observação**" — ela aplicou +5 e no campo. Prompt ≠ padrão real.

**Solução (V7.20 @57):** (a) `agentAddLead` auto-preenche `proximoFollowup = _addDiasBR(dataProposta, 7)` quando o campo vem vazio (helper `_addDiasBR`, soma dias CORRIDOS; não sobrescreve valor explícito). (b) Prompt da Camila corrigido (Passos 7/9 + Regra de ouro 18); +7 propagado pro prompt da Rafaela (Comercial Regra 18) e `shared-files/regras_gestao.md` §8. (c) Aprendizado `APR-0167` (categoria Regra). Registro corrigido p/ 18/06. **E2E verificado:** addLead(11/06)→18/06; sem data→hoje+7.

**Lição:** "o sistema já faz X automaticamente" dito pelo sócio ≠ o sistema faz. Grep o código antes de assumir auto-comportamento. E o prompt de uma IA é fonte de erro tão real quanto o código — auditar prompt junto.

## E040 — `linkAttachment` sem dedup → regerar empilha N anexos; o MAIS RECENTE pode ser o PIOR

**Sintoma:** Camila deixou **3 PDFs** da mesma proposta `062026202.0` no CRM. Regerou o documento 3× (15:19, 15:36, 16:06) e cada chamada de `generate_proposal anexar:true` empilhou um anexo novo.

**Causa raiz:** `linkAttachment` (`Code.js`) fazia `appendRow` incondicional — zero checagem de duplicado. `generate_proposal` chama `linkAttachment` toda vez. Nenhuma guarda, nenhuma limpeza.

**Armadilha (verify-before-delete):** a versão MAIS RECENTE (16:06, 121KB) era a PIOR — re-export degradado SEM capa, SEM figuras, SEM assinaturas. As 15:19/15:36 (426KB) tinham as imagens+assinaturas reais. 15:19 tinha pgto ERRADO (30/35/35); **15:36 era a boa** (50/50 + capa+figuras+assinaturas). Um "latest-wins" cego teria mantido a quebrada. Confirmei abrindo os 3 PDFs (get_file_metadata + download + Read visual) antes de apagar. Mantido 15:36; removidos 15:19 e 16:06 (soft-delete, Drive preservado).

**Solução (V7.20 @57):** dedup em `linkAttachment` por (numeroProposta+nomeArquivo+categoria): mesmo `driveFileId` ativo = IDEMPOTENTE (não duplica); arquivo novo c/ mesmo nome = SUBSTITUI (antigo→'excluido', latest-wins). Flag `allowDuplicate:true` escapa. Prompt da Camila: Passo 6 (conferir capa+figuras+assinaturas antes de anexar; 1 anexo ativo) + Regra 19 + 3 itens em "NUNCA FAZ". Aprendizado `APR-0168` (Fluxo). **E2E verificado:** mesmo arquivo→idempotente; arquivo novo→substitui; lista=1.

**Lição:** par do E038/Jonathan (lá "parecia duplicado e não era"; aqui "ERA duplicado mas o mais novo era lixo"). Regra única: **antes de exclusão irreversível em prod, INSPECIONAR o conteúdo real** — nº/observação pra desambiguar, e abrir o arquivo pra ver qual versão presta. Nunca confie no timestamp.

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

- **Total catalogado:** 29 padrões únicos (E001-E011 + E013-E030; E012 pulado historicamente)
- **Última atualização:** 2026-05-30 (E030 = registro sem control points fica em coords locais / não georref; E029 = MCP `set_cash_balance` exige `valor`; E028 = ReCap crash com WGS84 absoluto)
- **Padrões mais comuns:** OAuth/auth (3), UI automation (6 incl. claude.ai), state management (3), Cloudflare/MCP deploy (4), Sheets schema (3), PowerShell encoding (2), point cloud/registro/georref (2: E028, E030), parallel evolution (1), Windows sandboxing (1)

> ⚠️ Quando errar pela mesma razão duas vezes, ATUALIZE este arquivo IMEDIATAMENTE.
