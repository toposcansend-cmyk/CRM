# Garantia de Alimento do Cérebro — Plano de Implementação

> **For agentic workers:** implementar task-a-task, TDD. Steps em checkbox.

**Goal:** Instrumentar o write-path do cérebro: toda sessão/automação prova que adicionou nó ou aresta (ou é flagrada como `seca`), e um backstop pensante (02:08) cura secas sem fabricar lixo.

**Architecture:** Módulo puro `brain-ledger.ps1` (conta nós/arestas, classifica veredito, append no `brain-ledger.json`) testado com Pester 3.4. Os hooks burros (`boot-briefing`/`post-session`) chamam o módulo pra medir e sinalizar. A rotina Claude das 02:08 (SKILL.md reescrita) é o único lugar com julgamento — captura/costura/quiet-day.

**Tech Stack:** Windows PowerShell 5.1, Pester 3.4 (sintaxe v3: `Should Be`), JSON via ConvertTo/From-Json. Sem rede.

**Spec:** `~/.claude/projects/C--Users-23GAMER/memory/project_brain_feeding_guarantee.md`

---

## Arquivos

- Create: `C:\Users\23GAMER\work\CRM\tests\brain-ledger.ps1` (módulo dot-sourceável, funções puras)
- Create: `C:\Users\23GAMER\work\CRM\tests\brain-ledger.Tests.ps1` (Pester 3.4)
- Modify: `C:\Users\23GAMER\work\CRM\tests\boot-briefing.ps1` (snapshot de abertura + linha de delta visível)
- Modify: `C:\Users\23GAMER\work\CRM\tests\post-session.ps1` (snapshot de fecho + flag de seca)
- Rewrite: `C:\Users\23GAMER\.claude\scheduled-tasks\auto-aprendizado-e-evoluo\SKILL.md` (backstop pensante)
- Runtime data: `~/.claude/projects/C--Users-23GAMER/memory/brain-ledger.json` (não é .md → invisível ao memory-health; viaja no backup)

**Decisão de contagem:** Nós = `*.md` exceto `MEMORY`+`README` (conhecimento real; difere do `memory-health` que conta tudo). Arestas = `[[wikilinks]]` **resolvidos** (alvo existe), mesma regex+allowlist do memory-health.

**Ruga conhecida (sessões paralelas, E047):** `session_open` num ledger único é sobrescrito se 2 sessões abrem juntas → última vence. Aceito; a rotina das 02:08 reconcilia por dia. Não over-engenheirar agora.

---

### Task 1: Módulo `brain-ledger.ps1` — funções puras (TDD)

**Files:** Create `tests\brain-ledger.ps1`, `tests\brain-ledger.Tests.ps1`

- [ ] **Step 1 — teste que falha** (`brain-ledger.Tests.ps1`):

```powershell
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'brain-ledger.ps1')

Describe "Get-BrainVerdict" {
    It "no novo no = alimentou"      { Get-BrainVerdict 1 7 | Should Be 'alimentou' }
    It "so aresta nova = so-conexao" { Get-BrainVerdict 0 3 | Should Be 'so-conexao' }
    It "zero/zero = seca"            { Get-BrainVerdict 0 0 | Should Be 'seca' }
}

Describe "Get-BrainCounts" {
    $tmp = Join-Path $env:TEMP ("bl_" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tmp | Out-Null
    Set-Content "$tmp\MEMORY.md" "indice [[a]]" -Encoding UTF8
    Set-Content "$tmp\README.md" "meta" -Encoding UTF8
    Set-Content "$tmp\a.md" "liga [[b]] e [[naoexiste]]" -Encoding UTF8
    Set-Content "$tmp\b.md" "volta [[a]]" -Encoding UTF8

    It "conta nos sem MEMORY/README" { (Get-BrainCounts $tmp).Nodes | Should Be 2 }
    It "conta so arestas resolvidas" { (Get-BrainCounts $tmp).Edges | Should Be 3 }
    Remove-Item $tmp -Recurse -Force
}

Describe "Add-BrainLedgerEntry" {
    $p = Join-Path $env:TEMP ("ledger_" + [guid]::NewGuid().ToString('N') + ".json")
    $before = [pscustomobject]@{ Nodes=10; Edges=20 }
    $after  = [pscustomobject]@{ Nodes=11; Edges=27 }
    $e = Add-BrainLedgerEntry -Path $p -Source 'test' -Before $before -After $after -Verdict 'alimentou'

    It "grava delta certo"      { $e.delta_nodes | Should Be 1; $e.delta_edges | Should Be 7 }
    It "persiste e le de volta" { (Read-BrainLedger $p).entries.Count | Should Be 1 }
    It "atualiza last_snapshot" { (Read-BrainLedger $p).last_snapshot.nodes | Should Be 11 }
    Remove-Item $p -Force
}
```

- [ ] **Step 2 — rodar, ver falhar:** `powershell -NoProfile -Command "Invoke-Pester C:\Users\23GAMER\work\CRM\tests\brain-ledger.Tests.ps1"` → FAIL (funções inexistentes).

- [ ] **Step 3 — implementar** (`brain-ledger.ps1`):

```powershell
# brain-ledger.ps1 - contabilidade do crescimento do cerebro (funcoes puras).
# Dot-source: . brain-ledger.ps1 ; sem efeitos no import.

function Get-BrainCounts {
    param([string]$MemoryDir)
    $files = Get-ChildItem $MemoryDir -Filter *.md -ErrorAction SilentlyContinue
    $allow = @('link','links','wikilink','wikilinks','snake_case','their-name','name','project-rafaela-...')
    $baseSet = @{}; $files | ForEach-Object { $baseSet[$_.BaseName.ToLower()] = $true }
    $nodes = 0; $edges = 0
    foreach ($f in $files) {
        if ($f.BaseName -in @('MEMORY','README')) { continue }
        $nodes++
        foreach ($m in [regex]::Matches([IO.File]::ReadAllText($f.FullName), '\[\[([^\]\|#\n]+?)(?:[#\|][^\]]*)?\]\]')) {
            $t = $m.Groups[1].Value.Trim().ToLower()
            if ($allow -contains $t) { continue }
            if ($baseSet.ContainsKey($t)) { $edges++ }
        }
    }
    [pscustomobject]@{ Nodes = $nodes; Edges = $edges }
}

function Get-BrainVerdict {
    param([int]$DeltaNodes, [int]$DeltaEdges)
    if ($DeltaNodes -gt 0) { return 'alimentou' }
    if ($DeltaEdges -gt 0) { return 'so-conexao' }
    return 'seca'
}

function Read-BrainLedger {
    param([string]$Path)
    if (Test-Path $Path) { try { return (Get-Content $Path -Raw | ConvertFrom-Json) } catch {} }
    [pscustomobject]@{ schema=1; last_snapshot=$null; session_open=$null; entries=@(); pending_capture=$false }
}

function Save-BrainLedger {
    param([string]$Path, $Ledger)
    [System.IO.File]::WriteAllText($Path, ($Ledger | ConvertTo-Json -Depth 8), (New-Object System.Text.UTF8Encoding $false))
}

function Add-BrainLedgerEntry {
    param([string]$Path, [string]$Source, $Before, $After, [string]$Verdict)
    $led = Read-BrainLedger -Path $Path
    $entry = [pscustomobject]@{
        ts=(Get-Date -Format 'o'); source=$Source
        nodes_before=[int]$Before.Nodes; nodes_after=[int]$After.Nodes
        edges_before=[int]$Before.Edges; edges_after=[int]$After.Edges
        delta_nodes=([int]$After.Nodes-[int]$Before.Nodes); delta_edges=([int]$After.Edges-[int]$Before.Edges)
        verdict=$Verdict
    }
    $led.entries = @($led.entries) + $entry
    $led.last_snapshot = [pscustomobject]@{ ts=$entry.ts; nodes=[int]$After.Nodes; edges=[int]$After.Edges }
    if ($Verdict -eq 'seca') { $led.pending_capture = $true }
    Save-BrainLedger -Path $Path -Ledger $led
    $entry
}
```

- [ ] **Step 4 — rodar, ver passar:** mesmo comando → todos PASS.
- [ ] **Step 5 — commit local** (repo `work\CRM`): `git add tests/brain-ledger.ps1 tests/brain-ledger.Tests.ps1 && git commit -m "feat(brain): ledger module + tests"`

---

### Task 2: Wire `boot-briefing.ps1` — snapshot de abertura + delta visível

**Files:** Modify `tests\boot-briefing.ps1` (após o bloco memory-health, antes do PROTOCOLO)

- [ ] **Step 1 — inserir** (após a linha 91, fim do bloco `$memHealth`):

```powershell
# --- CRESCIMENTO do cerebro (write-path): delta desde o ultimo boot + snapshot de abertura ---
$blMod = Join-Path $PSScriptRoot 'brain-ledger.ps1'
if (Test-Path $blMod) {
    try {
        . $blMod
        $ledgerPath = Join-Path $MemoryDir 'brain-ledger.json'
        $now = Get-BrainCounts $MemoryDir
        $led = Read-BrainLedger $ledgerPath
        Write-Output ""
        if ($led.last_snapshot) {
            $dN = [int]$now.Nodes - [int]$led.last_snapshot.nodes
            $dE = [int]$now.Edges - [int]$led.last_snapshot.edges
            if ($dN -eq 0 -and $dE -eq 0) {
                Write-Output ("CEREBRO: 0 crescimento desde o ultimo boot ({0} nos / {1} sinapses). Backstop das 02:08 vai curar se persistir." -f $now.Nodes, $now.Edges)
            } else {
                Write-Output ("CEREBRO: +{0} nos / +{1} sinapses desde o ultimo boot (total {2}/{3})." -f $dN, $dE, $now.Nodes, $now.Edges)
            }
        } else {
            Write-Output ("CEREBRO: ledger iniciado ({0} nos / {1} sinapses)." -f $now.Nodes, $now.Edges)
        }
        if ($led.pending_capture) { Write-Output "  >>> ha SECA pendente no ledger: a rotina das 02:08 deve capturar/costurar (ou ja curou)." }
        # marca a abertura desta sessao pro post-session diferenciar
        $led.session_open = [pscustomobject]@{ ts=(Get-Date -Format 'o'); nodes=[int]$now.Nodes; edges=[int]$now.Edges }
        Save-BrainLedger $ledgerPath $led
    } catch {}
}
```

- [ ] **Step 2 — verificar:** `powershell -File tests\boot-briefing.ps1` → imprime linha `CEREBRO:` sem erro; cria/atualiza `brain-ledger.json` com `session_open`.
- [ ] **Step 3 — commit local:** `git add tests/boot-briefing.ps1 && git commit -m "feat(brain): boot mostra delta + marca abertura de sessao"`

---

### Task 3: Wire `post-session.ps1` — fecho de sessão + flag de seca

**Files:** Modify `tests\post-session.ps1` (após o bloco 2.5 capture, antes do append em metrics)

- [ ] **Step 1 — inserir** (após a linha 106, `if ($captureGap)...`):

```powershell
# ------------------------------------------------------------
# 2.6 Brain feed — esta sessao alimentou o cerebro? (delta vs abertura)
# ------------------------------------------------------------
$blMod = Join-Path $PSScriptRoot 'brain-ledger.ps1'
if (Test-Path $blMod) {
    try {
        . $blMod
        $ledgerPath = Join-Path $MemoryDir 'brain-ledger.json'
        $led  = Read-BrainLedger $ledgerPath
        $open = if ($led.session_open) { [pscustomobject]@{ Nodes=$led.session_open.nodes; Edges=$led.session_open.edges } } else { $led.last_snapshot }
        if ($open) {
            $after   = Get-BrainCounts $MemoryDir
            $before  = [pscustomobject]@{ Nodes=[int]$open.Nodes; Edges=[int]$open.Edges }
            $verdict = Get-BrainVerdict ([int]$after.Nodes-[int]$before.Nodes) ([int]$after.Edges-[int]$before.Edges)
            $e = Add-BrainLedgerEntry -Path $ledgerPath -Source 'session' -Before $before -After $after -Verdict $verdict
            $logLine += (" brain {0}(+{1}n/+{2}s)" -f $verdict, $e.delta_nodes, $e.delta_edges)
        }
    } catch { $logLine += " brain ERR" }
}
```

- [ ] **Step 2 — verificar:** `powershell -File tests\post-session.ps1` → logLine ganha ` brain <veredito>(+Nn/+Ms)`; ledger ganha entrada `source=session`.
- [ ] **Step 3 — commit local:** `git add tests/post-session.ps1 && git commit -m "feat(brain): post-session crava veredito de alimento + seca"`

---

### Task 4: Reescrever a rotina das 02:08 — backstop pensante

**Files:** Rewrite `.claude\scheduled-tasks\auto-aprendizado-e-evoluo\SKILL.md`

- [ ] **Step 1 — escrever o novo SKILL.md** (conteúdo no Task abaixo, seção "SKILL.md novo").
- [ ] **Step 2 — verificar dry-run:** simular seca (sessão que não escreve nada) → rodar a lógica do prompt manualmente → confirmar que ele costura **aresta real** ou captura conhecimento real, e **nunca** cria nó-lixo. Grava `quiet-day` honesto se nada legítimo.
- [ ] **Step 3 — commit local** (a SKILL.md não está no repo CRM; vai no backup do `.claude`): registrar no metrics.

#### SKILL.md novo (conteúdo exato)

```markdown
---
name: auto-aprendizado-e-evoluo
description: Backstop diario do write-path do cerebro — garante que o grafo da memoria cresceu (no, aresta ou quiet-day honesto), nunca por padding. "awake up neo".
---

# Rotina 02:08 — Backstop de Alimento do Cerebro (awake up neo)

Voce e a Fable. Esta rotina garante que o cerebro (vault Obsidian da memoria) **cresceu de verdade**
nas ultimas 24h — e cura qualquer seca SEM fabricar lixo. Le antes: o spec
`~/.claude/projects/C--Users-23GAMER/memory/project_brain_feeding_guarantee.md` e o
`feedback_no_busywork`.

## Passos
1. **Ler o ledger** `~/.claude/projects/C--Users-23GAMER/memory/brain-ledger.json`. Olhar as entradas das ultimas 24h e o flag `pending_capture`.
2. **Se houve seca** (`verdict:seca` ou `pending_capture:true`):
   a. Investigar o que aconteceu (paginas novas do diario, git log do vault, atividade do CRM, transcripts do dia).
   b. **Decidir COM julgamento (anti-padding):**
      - Conhecimento real que nao virou nota -> **escrever a nota** (frontmatter completo, interconectada via `feedback_interconectar_ao_salvar`, ponteiro no MEMORY.md).
      - Dia quieto sem conhecimento novo -> **passar o relogio suico**: rodar `memory-health.ps1`, achar notas sub-linkadas/orfas e **costurar `[[wikilinks]]` REAIS** onde fazem sentido. Cresce por aresta.
      - Genuinamente nada a capturar nem costurar -> registrar entrada honesta `quiet-day` no ledger (origem `02:08`). **NUNCA inventar no pra bater meta.**
3. **Re-render do wallpaper** se o grafo mudou: `python C:\Users\23GAMER\BrainWallpaper\render_brain.py`.
4. **Fechar:** append no ledger (origem `02:08`, veredito real), limpar `pending_capture`, deixar recibo de crescimento (`+N nos / +M sinapses, motivo: captura|conexao|quiet`) no `metrics.md`.

## Regra de ouro
Crescimento honesto = no real **OU** aresta real **OU** quiet-day honesto. Um cerebro que se enche de
padding fica pior. Nem um dia e igual ao outro — e voce deve saber disso.
```

---

## Self-Review (writing-plans)
- **Cobertura do spec:** ledger ✅ (T1), medir/sinalizar nos hooks ✅ (T2/T3), backstop pensante ✅ (T4), anti-padding ✅ (SKILL.md). Cobertura "toda automação" = ledger por origem (T3 usa `source`; futuras automações chamam Add com seu nome) ✅. memory-health NÃO modificado (decisão DRY) — divergência consciente do spec.
- **Placeholders:** nenhum; todo código presente.
- **Consistência de tipos:** `Get-BrainCounts`→`{Nodes,Edges}` usado igual em T2/T3; `Add-BrainLedgerEntry(-Path,-Source,-Before,-After,-Verdict)` idêntico em teste e hooks; `Read-BrainLedger().last_snapshot.{nodes,edges}` consistente.
```
