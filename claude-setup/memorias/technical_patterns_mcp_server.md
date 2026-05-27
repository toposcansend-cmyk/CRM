---
name: technical-patterns-mcp-server
description: "Padrões de construção/deploy de MCP server custom em Cloudflare Workers — JSON-RPC 2.0, Hono, deploy via wrangler, secret management via API"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 31834073-2e7f-4248-8498-47bd4242e065
---

# 🛠️ Padrões — MCP server custom em Cloudflare Workers

Referência consolidada após construir o MCP do Toposcan CRM (35 tools, deploy em 26/05/2026).

## Quando usar

claude.ai Projects **não têm tool nativa pra HTTP POST arbitrário**. Têm Gmail/Calendar/Drive/Web search/Habilidades. Pra integrar uma API custom (webhook GAS, REST próprio, etc), a IA precisa do conector MCP. O servidor MCP é o **adapter HTTP→tools nomeadas** que a IA enxerga.

## Stack recomendada

| Componente | Escolha |
|---|---|
| Runtime | **Cloudflare Workers** (gratuito 100k req/dia, edge, sem cold start, deploy ~5s) |
| Framework | **Hono 4.x** (lightweight, compatível com Workers, ergonomia tipo Express) |
| Linguagem | **TypeScript** (SDK do MCP é TS-first; Workers types via `@cloudflare/workers-types`) |
| Protocolo | JSON-RPC 2.0 sobre Streamable HTTP — stateless (cada request é independente) |
| Deploy CLI | `wrangler` (Cloudflare oficial) |

## Estrutura mínima

```
mcp-server/
├── src/index.ts         (servidor completo)
├── wrangler.toml        (config Workers)
├── package.json         (deps: hono, wrangler, @cloudflare/workers-types)
└── tsconfig.json        (ES2022 + Workers types)
```

## Protocolo MCP — métodos essenciais

Implementar em `POST /mcp` body=JSON-RPC:

- **`initialize`** → retorna `{ protocolVersion, capabilities: { tools: {} }, serverInfo: {...} }`
- **`tools/list`** → retorna `{ tools: [{ name, description, inputSchema }, ...] }`
- **`tools/call`** → recebe `{ name, arguments }`, retorna `{ content: [{type:"text",text:"..."}], structuredContent: {...} }`
- **`notifications/initialized`** → no-op, retorna null result
- **`resources/list`** / **`prompts/list`** → retornar listas vazias se não usadas

## Pattern: definição de tool

```typescript
type ToolDef = {
  name: string;           // ex: 'crm_list_all'
  description: string;    // 1-2 frases, ação + quando usar
  inputSchema: object;    // JSON Schema dos parâmetros
  action: string;         // mapeia pra action interna do backend
};
```

**Naming:** prefixo do domínio (`crm_`, `nexum_`, etc) + snake_case + verbo de ação. Bom: `crm_list_payments`. Ruim: `listP`.

**Descrição:** mencione QUANDO usar a tool, não só o QUE faz. Ex: *"Lista parcelas. Filtros: filter (pago/pendente/atrasado). USE NO 1º TURNO de conversa financeira pra carregar contexto."*

## Pattern: wrapper de upstream

```typescript
async function callWebhook(url, secret, action, params = {}) {
  const payload = { action, secret, ...params };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    redirect: 'follow',     // crítico pra Apps Script (302 redirect)
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return JSON.parse(await resp.text());
}
```

**Pega:** Apps Script web app retorna **302 redirect** pra `googleusercontent.com`. `redirect: 'follow'` (default no fetch) resolve.

## Pattern: structuredContent + text

Retorne AMBOS em `tools/call`:
```typescript
return {
  content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  structuredContent: result,  // parsed object — claude.ai usa isso
};
```

`content[0].text` é o que aparece no chat. `structuredContent` é o objeto parseado que o modelo processa.

## Deploy — fluxo completo

### 1. Auth Cloudflare (uma vez)

```powershell
npx wrangler login
```

Abre browser, OAuth do Cloudflare. **Timeout 2 min** — se o user não clicar Allow rápido, expira. Em browser separado do Chrome MCP (são sessions diferentes).

**Alternativa pra script:** API Token via `$env:CLOUDFLARE_API_TOKEN`. Criado em `dash.cloudflare.com/profile/api-tokens` com template "Edit Cloudflare Workers".

### 2. Subdomain Workers (uma vez)

Antes do 1º deploy, **abrir** `dash.cloudflare.com/{ACCOUNT_ID}/workers/workers-and-pages` UMA VEZ no browser logado. Cria subdomínio auto.

OU via API direto (campo é **`subdomain`**, NÃO `name` — erro 10033 silencioso):
```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/subdomain" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"seu-nome"}'
```

### 3. Secret management (⚠️ pitfall)

**Não use stdin pipe no PowerShell** — injeta newline (`\r\n` ou `\n`):
```powershell
# ❌ ERRADO — injeta newline no secret
'valor' | npx wrangler secret put SECRET_NAME

# ❌ Mesmo com WriteAllText (sem BOM) pipe ainda corrompe
Get-Content arquivo | npx wrangler secret put SECRET_NAME
```

**Correto: Cloudflare API direta** (controle total sobre o valor):
```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/scripts/$SCRIPT/secrets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"SECRET_NAME","text":"valor-limpo","type":"secret_text"}'
```

### 4. Deploy

```powershell
npx wrangler deploy
```

Output mostra URL final: `https://NOME-DO-WORKER.SEU_SUBDOMAIN.workers.dev`. SSL cert propaga em **~60-90s** após primeiro deploy. Erro `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` = ainda propagando.

### 5. Conectar na claude.ai

`claude.ai → Personalizar → Conectores → "+" (botão direito do header) → "Adicionar conector personalizado"`.

Preenche:
- **Nome:** algo identificável (ex: "Toposcan CRM")
- **URL do servidor MCP remoto:** `https://...workers.dev/mcp` (com `/mcp` no fim!)
- OAuth ID/Secret: deixa vazio (público sem auth)

**Account-level:** uma vez criado, **propaga automaticamente pros 4 Projects** (não precisa adicionar em cada). Toggle ON é default.

## Auth do token wrangler OAuth (caso precise)

```
C:\Users\23GAMER\AppData\Roaming\xdg.config\.wrangler\config\default.toml
```

Contém `oauth_token` que dá acesso à Cloudflare API do user. Útil pra chamadas API que o wrangler CLI não cobre (ex: criar subdomain via campo correto).

## Smoke test pós-deploy

```javascript
// Via Chrome MCP (TLS funciona)
const r = await fetch('https://...workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'crm_get_cross_kpis', arguments: {} }
  })
});
const j = await r.json();
console.log(j.result.structuredContent);  // valores reais do backend
```

PowerShell `Invoke-RestMethod` 5.1 dá erro TLS (sem 1.2). Use Node fetch ou Chrome MCP.

## Caveats

- Workers timeout: **30s soft, 6min hard**. Calls longas (GAS pode tomar 20-40s) podem cair.
- Apps Script tem 6 min/request limit. Combinado, sweet spot é <20s.
- Stateless (sem sessões). Tudo via JSON-RPC stateless. Sessões com state precisam Durable Objects (não fizemos).
- CORS: liberado pra qualquer origin via `cors()` middleware do Hono. Restringir se precisar.
- Logs: `npx wrangler tail` mostra stdout do Worker em tempo real (útil pra debug auth).

## Referências cruzadas

- `[[project-mcp-toposcan-crm]]` — instância concreta do padrão
- `[[reference-crm-api]]` — webhook upstream que o MCP wrappea
- `[[error-patterns]]` E017-E019 — pitfalls Cloudflare específicos
