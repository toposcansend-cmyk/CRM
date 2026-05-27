# 📜 Changelog das Memórias — Toposcan/Claude

> Sempre que algum Claude (Guilherme ou Marcelo) atualizar memórias localmente, **registrar aqui**.
> O outro sócio, ao rodar `verificar-atualizacoes.ps1` no PC dele, vê o que mudou e propõe atualizar.

---

## Como funciona

1. **Guilherme** atualiza memória em `~/.claude/projects/.../memory/*.md`
2. **Claude do Guilherme** copia automaticamente pra `claude-setup/memorias/` e commita
3. **Claude do Guilherme** adiciona entrada NESTE arquivo
4. **Marcelo** abre o Claude Code no PC dele
5. Claude do Marcelo lê este changelog (CLAUDE.md instrui a fazer isso)
6. Se houver mudanças mais recentes que a última sync local, propõe atualizar
7. Marcelo confirma → `git pull && instalar-memorias.ps1` → memórias sincronizadas

---

## Entradas

### 2026-05-26 (noite tardia) — Lição de evolução paralela (Guilherme + sessão paralela)

**Resumo:** Detectado em tempo real que múltiplas instâncias de Claude Code estavam evoluindo o repo simultaneamente. Enquanto eu (sessão principal Guilherme) trabalhava no `verificar-atualizacoes.ps1` + setup do Marcelo, **outra sessão** entregou paralelamente:
- `mcp-server/src/index.ts` v1.1.0 com observability (logs estruturados JSON, telemetria por tool_call)
- `mcp-server/wrangler.toml` com cron `0 */6 * * *` (auto health check 4×/dia) + `[observability] enabled = true`
- Novos endpoints `/health` (paralelo 3 tools críticas, 503 se falha) e `/metrics`
- `error_patterns.md` ganhou E022-E026 (Sheets schema + PowerShell BOM)
- `crm.html` ganhou gráficos + modal de detalhamento Fluxo de Caixa 14d

**Colisão real:** tentei usar E022 — já existia. Renumerei pra E027.

**Arquivos novos:**
- `pattern_parallel_evolution.md` — receita de como detectar colisões, conviver com múltiplas instâncias, renumerar EXXX, integrar trabalho alheio sem reverter. **Meta-conteúdo:** documenta a própria colisão que sofri criando o documento.
- Error pattern **E027** — edição paralela: sintoma (system-reminder de file modified), solução (git pull antes de commit, edit minimalista, accept other session's work)

**Arquivos atualizados:**
- `MEMORY.md` — link novo pra pattern_parallel_evolution + total agora E001-E027 (26 padrões, E012 pulado)
- `error_patterns.md` — +E027 e nova estatística

**Implicação filosófica:** o Toposcan virou um **sistema multi-agente colaborativo de verdade** — 2 Claude Codes + 4 IAs gerentes + edições manuais commitando em `main` via Git como event bus. Toda futura sessão tem que rodar `git pull` antes de qualquer commit, e checar `git log -10` antes de editar arquivos sensíveis (memórias, MEMORY.md, error_patterns).

---

### 2026-05-26 (madrugada) — V7.12-MCP: servidor MCP custom + 4 IAs executam ações reais (Guilherme)

**Resumo:** Construído + deployed MCP server em Cloudflare Workers wrappeando o webhook V7.12. 35 ferramentas `crm_*`. Conectado como "Toposcan CRM" na claude.ai (account-level → propagou nos 4 Projects). Beatriz executou `crm_get_cross_kpis` ao vivo — saúde 100, R$127.533, 13 projetos. Lacuna fundamental (claude.ai não tem fetch HTTP arbitrário) **resolvida**.

**Arquivos novos:**
- `project_mcp_toposcan_crm.md` — stack do servidor, deploy workflow, 35 tools listadas
- `technical_patterns_mcp_server.md` — referência completa pra construir/deploy MCP em Workers (TypeScript+Hono+JSON-RPC, secret management, OAuth, subdomain)
- `feedback_no_busywork.md` — regra nova: não inventar trabalho. Sinal "Para que é útil?" do Guilherme = corte imediato. Capturado no contexto: tentei spawnar refactor cosmético depois da entrega real.

**Arquivos atualizados:**
- `MEMORY.md` — adicionado link MCP server + technical_patterns_mcp_server + feedback_no_busywork; error_patterns agora 21 padrões
- `error_patterns.md` — +5 padrões (E017-E021):
  - E017: PowerShell pipe injeta newline em wrangler secret put → usar CF API direta
  - E018: Cloudflare subdomain API field é "subdomain" (não "name") — erro 10033
  - E019: Workers Free precisa subdomain criado antes do 1º deploy
  - E020: claude.ai Projects não têm fetch HTTP — precisam MCP layer
  - E021: claude.ai Plugins só rodam no Desktop app; conectores MCP rodam no web
- `reference_crm_api.md` — adicionada seção "Camada MCP" no topo apontando pra novo servidor
- `project_crm_toposcan.md` — adicionada seção "Camada MCP" no Backend; nota das 35 tools `crm_*`

**Infra concreta criada hoje:**
- Servidor MCP em `https://toposcan-crm-mcp.toposcan.workers.dev/mcp`
- Conta Cloudflare nova (toposcan.send@gmail.com), subdomínio `toposcan`, plano Workers Free
- Conector "Toposcan CRM" no claude.ai (account-level, ativo em Rafaela/Beatriz/Vanessa/Fernanda)
- 35 tools mapeadas pra ~36 actions do webhook
- Custo total: R$ 0

**Lessons learned aprofundadas (no error_patterns):**
- Cloudflare Workers `wrangler login` tem timeout 2 min — automatize via API token se loop precisar de espera longa
- Wrangler stdin pipes corrompem secrets — sempre PUT direto via API com `{"name","text","type":"secret_text"}`
- Conectores MCP custom no claude.ai são account-level, não per-project — propagam grátis pros 5 Projects
- `element.click()` via JS bypassa o problema de `ref click` só disparar tooltip em alguns elementos da claude.ai

---

### 2026-05-26 (noite) — Reform claude.ai: perfil project-aware + sync arquivos nos 4 Projects (Guilherme)

**Resumo:** Identificada origem do override "Rafaela" (perfil de conta sobrescreve Project Instructions). Reescrito perfil de conta com regra de exceção project-aware. Reforçada identidade no topo de cada Project. Sincronizados arquivos (PROMPT-CLAUDE-X.md + 3 shared utility files) nos 4 Projects.

**Mudanças concretas:**
- `claude-setup/account-instructions-v2.md` — novo perfil de conta (9162 chars) com regra de identidade project-aware + Marcelo + 4 IAs + Sofia + Claude Code + autonomia total
- `claude-setup/backups/account-instructions-2026-05-26-pre-V7.12-reform.md` — backup do perfil anterior (local, não versionado)
- `claude-setup/shared-files/{briefing_template,regras_gestao,webhook_api}.md` — extraídos do Project Rafaela e versionados pra sync
- 4 prompts PROMPT-CLAUDE-{COMERCIAL,ENGENHARIA,FINANCEIRO,OPERACAO}.md — adicionado bloco "SUA IDENTIDADE NESTE PROJECT: {Nome}" logo após [INÍCIO]
- 4 Projects na claude.ai UI receberam:
  - Identidade reforçada no Instructions
  - Upload de PROMPT-CLAUDE-X.md como arquivo + 3 shared
- `error_patterns.md` — +4 padrões (E013-E016): conta sobrescreve Project, file_upload restrito, click via ref falha, settings sem auto-save

**Padrões aprendidos (E013-E016) — registrados no error_patterns:**
- E013: Account instructions sobrescrevem Project — fix em ambos os níveis
- E014: file_upload do Chrome MCP rejeita paths locais — DataTransfer + File API funciona via JS
- E015: click via ref instável — usar element.click() via JS direto
- E016: settings auto-save precisa sequência completa de eventos (focus/select/set/input/InputEvent/change/blur/focusout)

---

### 2026-05-26 — V7.12 + nomeação das IAs gerentes (Guilherme)

**Resumo:** Deploy V7.12 Aprendizados (aba `Aprendizados` + 5 actions = memória institucional ilimitada da Rafaela), e nomeação dos 4 gerentes Claude: Rafaela (Comercial) · Beatriz (Engenharia) · Vanessa (Financeiro) · Fernanda (Operação). Vendedora humana Rafaela limpada de todas as referências (desligada).

**Memórias atualizadas:**
- `MEMORY.md` — nova seção "4 Gerentes Claude" indexando os 4 nomes
- `project_crm_toposcan.md` — V7.7 → V7.12, tabela de gerentes com nomes, login sem Rafaela
- `reference_crm_api.md` — V7.12 + tabela completa das 5 actions de Aprendizados (chave de retorno `results`)
- `error_patterns.md` — adicionado `getLearnings → results` na lista E010
- `user_guilherme.md` — Rafaela vendedora removida do time
- `project_crm_manual_operacional.md` — tabela de vendedores atualizada (3 humanos + nota Rafaela-IA)
- `project_crm_discrepancias.md` — §4 "Rafaela ausente do Auth" marcada como resolvida (desligamento)
- `learning_user_identification.md` — pistas de identificação atualizadas (Rafaela = IA, não humana)
- `feedback_crm_gestao.md` — regra 5 e bloco de pistas Guilherme/Marcelo atualizados
- `project_rafaela_gerente_comercial.md` — NOVO
- `project_beatriz_gerente_engenharia.md` — NOVO
- `project_vanessa_gerente_financeiro.md` — NOVO
- `project_fernanda_gerente_operacao.md` — NOVO

**Prompts dos Projects atualizados (mesmo commit):**
- `PROMPT-CLAUDE-COMERCIAL.md` — identidade Rafaela-IA + V7.12 + 4 colegas
- `PROMPT-CLAUDE-ENGENHARIA.md` — identidade Beatriz + V7.12 + 4 colegas
- `PROMPT-CLAUDE-FINANCEIRO.md` — identidade Vanessa + V7.8 Fluxo de Caixa + V7.12 + 4 colegas
- `PROMPT-CLAUDE-OPERACAO.md` — identidade Fernanda + V7.12 + 4 colegas

⚠️ Para refletir nos Projects do claude.ai (UI), ainda é necessário reaplicar via Chrome MCP — ver `BRIEFING-CLAUDE-MOBILE.md`.

---

### 2026-05-26 — V7.10/V7.11 (Guilherme)

**Resumo:** Fluxo de Caixa completo (V7.10/V7.11) + bug fixes + drag-and-drop sem confirmação + feedback visual ao marcar pago

**Memórias atualizadas:**
- `error_patterns.md` — +4 padrões novos (E009-E012)
- `reference_crm_api.md` — V7.10 + novos endpoints `getCashFlow`, `getCashBalance`, `setCashBalance`
- `project_crm_toposcan.md` — V7.11 estado atual
- `learning_user_identification.md` — preferências do Guilherme refinadas (drag sem confirm, feedback visual, sync entre máquinas)

**Funcionalidades novas no CRM:**
- Aba 💸 **Fluxo de Caixa** com timeline quinzenal (14 dias)
- Drag-and-drop de cards entre colunas reprograma data (sem confirmação)
- Cards de entrada/saída pagas hoje aparecem com badge ✓ PAGO
- Animação flash ao marcar pago
- Saldo bancário persistido (PropertiesService GAS)
- Cache stale-while-revalidate (carga 10x mais rápida)
- Prefetch automático ao logar

**Custos cadastrados:**
- 7 custos fixos mensais (R$ 19.900) + Milena R$ 800 = R$ 20.700/mês
- 3 pagamentos pra hoje (Amilton/Alexandre/Ana R3 — R$ 3.000)

**Bug fixes críticos:**
- E009: `_derivarStatus` recebia objeto em vez de array — 34 parcelas históricas viraram "atrasadas" fake
- E010: `lr.itens` → `lr.items` no `listTopoPartners`
- E011: pagas hoje agora aparecem com badge

**Ação pro Marcelo:** rodar `cd C:\Users\<user>\work\CRM && git pull && cd claude-setup && .\instalar-memorias.ps1`

---

### Como adicionar nova entrada (template)

```markdown
### YYYY-MM-DD — Versão/feature (Quem)

**Resumo:** 1-2 linhas

**Memórias atualizadas:**
- arquivo1.md — o que mudou
- arquivo2.md — o que mudou

**Funcionalidades novas:** (opcional)
- ...

**Bug fixes:** (opcional)
- ...

**Ação necessária:** o que o outro sócio deve fazer
```
