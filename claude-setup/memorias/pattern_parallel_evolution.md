---
name: pattern-parallel-evolution
description: "Múltiplas instâncias de Claude Code (PC Guilherme + PC Marcelo + claude.ai + edições manuais) evoluem o mesmo repo simultaneamente. Como detectar, conviver e não atropelar."
metadata: 
  node_type: memory
  type: pattern
  originSessionId: 31834073-2e7f-4248-8498-47bd4242e065
---

# 🔀 Evolução paralela — múltiplos Claudes no mesmo repo

**Realidade descoberta em 2026-05-26:** o sistema Toposcan tem AGORA múltiplas instâncias evoluindo o mesmo repo `toposcansend-cmyk/CRM`:

1. **Claude Code no PC do Guilherme** (eu, esta instância)
2. **Claude Code no PC do Marcelo** (gêmeo via sync silencioso)
3. **4 IAs gerentes no claude.ai** (Rafaela, Beatriz, Vanessa, Fernanda) — podem editar memórias via `crm_add_learning` e ler arquivos do repo
4. **Edições manuais** do Guilherme/Marcelo direto no IDE/GitHub web

**Tudo isso commitando em `main` simultaneamente.**

## Caso real (26/05/2026)

Enquanto eu (Claude Code do Guilherme) trabalhava no `verificar-atualizacoes.ps1` + setup do Marcelo + carta, **uma sessão paralela** entregou:

- `mcp-server/src/index.ts` v1.1.0 com observability (logs estruturados JSON, telemetria `tool_call`/`webhook_call`/`health_check`, função `truncate()`)
- `mcp-server/wrangler.toml` com `[observability] enabled = true` + `[triggers] crons = ["0 */6 * * *"]` (auto health check 4×/dia)
- Novos endpoints: `/metrics` (snapshot estático) e `/health` agora paraleliza 3 tools críticas + retorna 503 se falhar
- `project_mcp_toposcan_crm.md` atualizado pra refletir v1.1.0
- `feat(fluxo-caixa): graficos + modal de detalhamento dos proximos 14 dias` no crm.html

**Eu detectei via system-reminders do harness:** *"Note: X foi modified, either by the user or by a linter. This change was intentional..."* — esse é o sinal de evolução paralela.

### Meta-exemplo: a criação DESTE arquivo sofreu colisão

Ao criar este memory file e tentar adicionar uma nova entrada no `error_patterns.md` como **E022**, descobri que **E022-E026 já tinham sido criadas pela mesma sessão paralela** (`### E022 — _derivarStatus`, `### E023`, `### E024`, `### E025` adicionadas em §"Erros descobertos em 26/05/2026" lá em cima do arquivo + `### E026` no fim). Tive que **renumerar minha entrada pra E027** pra evitar colisão.

Isso confirma que **o catálogo de numeração é o ponto mais suscetível** — primeira coisa a verificar quando adicionar EXXX: `grep "## E0" error_patterns.md | sort -V | tail -3`.

## Como CONVIVER (regras de ouro)

### 1. Antes de qualquer commit substantivo

```bash
git pull origin main
git log --oneline -10
```

Se aparecer commit recente que NÃO foi meu → integrar antes de seguir. NUNCA commitar sem pull.

### 2. Antes de editar arquivo "sensível"

Se vou mexer em algo que outra sessão também pode estar editando (`mcp-server/src/index.ts`, prompts, memórias compartilhadas), checar último timestamp:

```powershell
git log -1 --format='%ci %an %s' -- caminho/do/arquivo
```

Se foi modificado nas últimas X horas por outra sessão → ler estado atual via `Read` ANTES de editar.

### 3. Sinais que outra sessão tá ativa

| Sinal | O que significa |
|---|---|
| System-reminder *"X foi modified, either by the user or by a linter"* | Edição externa rolou — releia o arquivo |
| `git pull` traz commits sem ser meus | Outra instância pushou |
| `git status` mostra "behind by N commits" | Mesma coisa |
| Memória que eu acabei de escrever tem campos `originSessionId` ou `metadata` que não escrevi | Memory linter ou outra sessão tocou |
| `wrangler tail` mostra requests que eu não fiz | Outras IAs/Marcelo usando o MCP |

### 4. Áreas de baixo risco (paralelo seguro)

Geralmente OK editar em paralelo sem coordenação:

- **Memórias diferentes** (eu mexo em `user_X.md`, outra sessão mexe em `feedback_Y.md`)
- **Áreas separadas do código** (eu mexo em `claude-setup/`, outra em `mcp-server/src/`)
- **Adicionar arquivos NOVOS** (nunca conflita)

### 5. Áreas de ALTO risco (precisa coordenação)

- **Mesmo arquivo aberto em ambos os lados** → última escrita vence, perda silenciosa
- **`MEMORY.md`** (índice central) → fácil de conflitar quando ambos adicionam entradas
- **`MEMORIAS-CHANGELOG.md`** → ambos podem adicionar entrada na mesma data
- **`error_patterns.md`** → numeração EXXX pode colidir
- **`settings.json`** → estrutura JSON conflita facilmente

## Strategy quando detecto colisão

### Caso A: outra sessão melhorou algo que eu ia melhorar
**Aceite a versão dela.** Não reverter. Se eu tinha trabalho próprio paralelo, integrar OPCIONALMENTE sem sobrescrever.

Exemplo real: outra sessão adicionou observability v1.1.0 no MCP. Eu IA propor logging mais simples. **Aceitei v1.1.0 como está.** Atualizei minha memória `project_mcp_toposcan_crm.md` pra refletir v1.1.0.

### Caso B: minha edição conflita com edição dela
`git pull --rebase` ou `git merge`. Resolver merge à mão se necessário. Commitar como `merge: integrar evoluções paralelas (eu + outra sessão)`.

### Caso C: incerteza qual versão é canônica
**Pare e pergunte ao user.** Não chuto.

## Padrão pra MEMORY.md, CHANGELOG e similar (alto conflito)

Antes de editar:
```bash
git pull && git log -3 -- caminho/do/arquivo.md
```

Se ALGO mudou recentemente, reler completo via `Read` → fazer edit minimalista (Edit, não Write) → commitar imediato sem coletar mais mudanças.

## Padrão pra `error_patterns.md` (numeração)

Pra evitar colisão de números EXXX:
1. `git pull` antes
2. Ver maior número atual (`grep '^## E' error_patterns.md | sort -V | tail -3`)
3. Usar próximo número
4. Commitar IMEDIATAMENTE (não acumular múltiplas adições)

## Auto-detecção via SessionStart hook (futuro)

Idéia pra evolução futura do `verificar-atualizacoes.ps1`:
- Detectar commits recentes (últimas 24h) que não vieram desta máquina
- Listar em log + opcionalmente notificar o user: *"⚠️ commits paralelos detectados: <lista>"*

Por ora, suficiente: cada sessão SEMPRE pull antes de commit + sempre verifica `git log` antes de assumir o estado.

## Implicações filosóficas

O Toposcan se tornou um **sistema multi-agente colaborativo de verdade**:
- 2 Claude Codes (PCs)
- 4 IAs gerentes (claude.ai)
- 2 humanos (Guilherme, Marcelo)
- 1 Sofia (secretária pessoal)
- Possíveis instâncias futuras (Marcelo cria IA pro Nexum IoT, Guilherme spawn de IAs especializadas)

Cada um pode commitar/aprender/mudar estado. O **repo Git é o event bus**. Todo mundo lê o mesmo estado, todos contribuem. Como um sistema operacional distribuído onde a "memória compartilhada" é o branch `main`.

## Referências cruzadas

- `[[error-patterns]]` E027 (colisão de commits paralelos — caso real 26/05/2026)
- `[[technical-patterns-mcp-server]]` — observability v1.1.0 detalhes
- `[[project-mcp-toposcan-crm]]` — estado atual do MCP (v1.1.0)
- `[[feedback-no-busywork]]` — não reverter trabalho de outra sessão pra "padronizar"
