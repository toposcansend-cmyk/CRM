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

### E009 — `_derivarStatus` recebe objeto em vez de array
**Sintoma:** parcelas com `vencimento < hoje` (atrasadas) viram `status = 'Pendente'`. Saldo do dia inflado. Lista de "atrasadas" some.
**Causa:** `_derivarStatus(row)` espera array bruto da planilha (`row[FIN_COL.dataPagamento - 1]` é índice numérico). Objeto JS retorna `undefined`.
**Sintoma específico:** `34 parcelas atrasadas R$ 338k` quando `listPayments(filter:'atrasado')` retornava `2 parcelas R$ 22k`.
**Solução:** sempre passar `row` (array) direto: `var status = _derivarStatus(row);`
**Aplicado em:** `getCashFlow` V7.10

### E010 — `listTopoPartners` retorna `items` (não `itens`)
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

### E011 — Filtro `status === 'Pago'` esconde pagamentos do dia
**Sintoma:** parcela paga hoje no Financeiro não aparece no Fluxo de Caixa.
**Causa:** `if (status === 'Pago') return;` descartava TUDO.
**Solução V7.10:** incluir pagas com `dataPagamento >= hoje`, marcar com `paga: true`. Frontend mostra com badge `✓ PAGO`. NÃO somar no saldo projetado.

### E012 — Memórias não propagam entre PCs (Guilherme ↔ Marcelo)
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

- **Total catalogado:** 11 padrões
- **Última atualização:** 2026-05-23
- **Padrões mais comuns:** OAuth/auth (3), UI automation (3), state management (2), Windows sandboxing (1)

> ⚠️ Quando errar pela mesma razão duas vezes, ATUALIZE este arquivo IMEDIATAMENTE.
