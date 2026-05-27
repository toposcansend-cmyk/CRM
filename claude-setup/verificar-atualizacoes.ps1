# =====================================================================
# VERIFICAR-ATUALIZACOES.PS1
# =====================================================================
# Verifica se ha atualizacoes de memorias no repo remoto vs local.
#
# Modos:
#   .\verificar-atualizacoes.ps1            (interativo, com prompts)
#   .\verificar-atualizacoes.ps1 -Silent    (silencioso, auto-aplica, log em arquivo)
#
# O modo Silent eh usado pelo proprio Claude no inicio de cada sessao
# para sincronizar memorias entre PCs sem incomodar o usuario.
# =====================================================================

param(
    [switch]$Silent = $false
)

$ErrorActionPreference = 'Stop'

# Em modo silent, redireciona output para arquivo de log
$logFile = Join-Path $env:TEMP "claude-sync.log"
if ($Silent) {
    function Write-Host { param($msg, $opts) Add-Content -Path $logFile -Value ([string]$msg) -ErrorAction SilentlyContinue }
}

if (-not $Silent) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  VERIFICADOR DE ATUALIZACOES DE MEMORIA - TOPOSCAN/CLAUDE" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}
Add-Content -Path $logFile -Value "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') silent=$Silent =====" -ErrorAction SilentlyContinue

$usuario = $env:USERNAME
$homeDir = $env:USERPROFILE
$repoDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$setupDir = Join-Path $repoDir "claude-setup"
$memoriasRemoteDir = Join-Path $setupDir "memorias"
$memoriasLocalDir = Join-Path $homeDir ".claude\projects\C--Users-$usuario\memory"
$changelogFile = Join-Path $setupDir "MEMORIAS-CHANGELOG.md"

Write-Host "[1/4] Verificando estado..." -ForegroundColor Cyan
Write-Host "      Usuario:  $usuario"
Write-Host "      Repo:     $repoDir"
Write-Host "      Local:    $memoriasLocalDir"
Write-Host ""

# 1) Git pull do repo
Write-Host "[2/4] Buscando ultimas mudancas do GitHub..." -ForegroundColor Cyan
Push-Location $repoDir
try {
    $pullOutput = git pull origin main 2>&1
    if ($LASTEXITCODE -eq 0) {
        if ($pullOutput -match 'Already up to date|Already up-to-date') {
            Write-Host "      Ja esta atualizado." -ForegroundColor Green
        } else {
            Write-Host "      OK - novas mudancas baixadas:" -ForegroundColor Green
            Write-Host $pullOutput -ForegroundColor Gray
        }
    } else {
        Write-Host "      AVISO: git pull com problema:" -ForegroundColor Yellow
        Write-Host $pullOutput -ForegroundColor Yellow
    }
} catch {
    Write-Host "      Erro: $($_.Exception.Message)" -ForegroundColor Red
}
Pop-Location
Write-Host ""

# 2) Compara memorias locais vs remotas
Write-Host "[3/4] Comparando memorias locais vs remoto..." -ForegroundColor Cyan
$diferencas = @()
if (Test-Path $memoriasRemoteDir) {
    Get-ChildItem -Path $memoriasRemoteDir -Filter "*.md" | ForEach-Object {
        $remoteFile = $_.FullName
        $localFile = Join-Path $memoriasLocalDir $_.Name
        if (-not (Test-Path $localFile)) {
            $diferencas += [PSCustomObject]@{ Arquivo = $_.Name; Status = "NOVO"; Tamanho = [math]::Round($_.Length/1024,1) }
        } else {
            $remoteHash = (Get-FileHash $remoteFile -Algorithm MD5).Hash
            $localHash = (Get-FileHash $localFile -Algorithm MD5).Hash
            if ($remoteHash -ne $localHash) {
                $diferencas += [PSCustomObject]@{ Arquivo = $_.Name; Status = "ATUALIZADO"; Tamanho = [math]::Round($_.Length/1024,1) }
            }
        }
    }
}

if ($diferencas.Count -eq 0) {
    Write-Host "      Tudo sincronizado! Nada novo." -ForegroundColor Green
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  NADA A FAZER" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    exit 0
}

Write-Host "      Encontrei $($diferencas.Count) memoria(s) com diferenca:" -ForegroundColor Yellow
$diferencas | Format-Table -AutoSize | Out-String | Write-Host
Write-Host ""

# 3) Mostra ultimas entradas do changelog
Write-Host "[4/4] Ultimas mudancas (do CHANGELOG):" -ForegroundColor Cyan
if (Test-Path $changelogFile) {
    $changelog = Get-Content $changelogFile -Raw
    # Pega os primeiros 60 linhas a partir da primeira entrada (###)
    $linhas = $changelog -split "`n"
    $started = $false
    $count = 0
    foreach ($linha in $linhas) {
        if ($linha -match '^### ') { $started = $true }
        if ($started) {
            Write-Host "      $linha" -ForegroundColor Gray
            $count++
            if ($count -ge 50) { Write-Host "      [... mais entradas no CHANGELOG]" -ForegroundColor DarkGray; break }
        }
    }
} else {
    Write-Host "      (CHANGELOG nao encontrado)" -ForegroundColor Yellow
}
Write-Host ""

# 4) Aplicar atualizacoes
# - Modo Silent: aplica direto sem perguntar (uso interno do Claude)
# - Modo interativo: pergunta antes
if ($Silent) {
    Add-Content -Path $logFile -Value "Aplicando atualizacoes automaticamente (modo silent)..." -ErrorAction SilentlyContinue

    # 4a) Copia memorias atualizadas
    foreach ($d in $diferencas) {
        try {
            $src = Join-Path $memoriasRemoteDir $d.Arquivo
            $dst = Join-Path $memoriasLocalDir $d.Arquivo
            if (-not (Test-Path $memoriasLocalDir)) {
                New-Item -ItemType Directory -Path $memoriasLocalDir -Force | Out-Null
            }
            Copy-Item -Path $src -Destination $dst -Force
            Add-Content -Path $logFile -Value "  OK $($d.Arquivo)" -ErrorAction SilentlyContinue
        } catch {
            Add-Content -Path $logFile -Value "  ERRO $($d.Arquivo): $($_.Exception.Message)" -ErrorAction SilentlyContinue
        }
    }

    # 4b) Aplica patches de settings.json (se houver novos)
    # Cada patch eh um JSON parcial que sera mergeado no settings.json local.
    # Idempotente: aplicar o mesmo patch 2x produz o mesmo resultado.
    $patchesDir = Join-Path $setupDir "settings-patches"
    $settingsFile = Join-Path $homeDir ".claude\settings.json"
    $appliedTrackFile = Join-Path $homeDir ".claude\.toposcan-patches-applied.json"
    if (Test-Path $patchesDir) {
        try {
            $applied = @{}
            if (Test-Path $appliedTrackFile) {
                $applied = Get-Content $appliedTrackFile -Raw | ConvertFrom-Json -AsHashtable
            }
            $patches = Get-ChildItem -Path $patchesDir -Filter "*.json" | Sort-Object Name
            foreach ($patch in $patches) {
                $patchHash = (Get-FileHash $patch.FullName -Algorithm MD5).Hash
                if ($applied[$patch.Name] -eq $patchHash) {
                    continue  # Ja aplicado, idempotente
                }
                $patchContent = Get-Content $patch.FullName -Raw | ConvertFrom-Json -AsHashtable
                $current = @{}
                if (Test-Path $settingsFile) {
                    $current = Get-Content $settingsFile -Raw | ConvertFrom-Json -AsHashtable
                }
                # Merge raso (top-level keys do patch sobrescrevem); deep-merge fica como upgrade futuro
                foreach ($k in $patchContent.Keys) {
                    $current[$k] = $patchContent[$k]
                }
                $current | ConvertTo-Json -Depth 10 | Set-Content -Path $settingsFile -Encoding utf8
                $applied[$patch.Name] = $patchHash
                Add-Content -Path $logFile -Value "  PATCH $($patch.Name) aplicado em settings.json" -ErrorAction SilentlyContinue
            }
            $applied | ConvertTo-Json -Depth 5 | Set-Content -Path $appliedTrackFile -Encoding utf8
        } catch {
            Add-Content -Path $logFile -Value "  ERRO ao aplicar patches: $($_.Exception.Message)" -ErrorAction SilentlyContinue
        }
    }

    # 4c) Verifica se package.json do mcp-server mudou - se sim, roda npm install
    $mcpServerDir = Join-Path $repoDir "mcp-server"
    $packageFile = Join-Path $mcpServerDir "package.json"
    $packageHashFile = Join-Path $mcpServerDir ".package-hash"
    if (Test-Path $packageFile) {
        try {
            $newHash = (Get-FileHash $packageFile -Algorithm MD5).Hash
            $oldHash = ""
            if (Test-Path $packageHashFile) { $oldHash = Get-Content $packageHashFile -Raw }
            if ($newHash -ne $oldHash.Trim()) {
                Add-Content -Path $logFile -Value "  package.json mudou, rodando npm install..." -ErrorAction SilentlyContinue
                Push-Location $mcpServerDir
                $npmOutput = & npm install --silent 2>&1
                Pop-Location
                Set-Content -Path $packageHashFile -Value $newHash -NoNewline
                Add-Content -Path $logFile -Value "  npm install concluido" -ErrorAction SilentlyContinue
            }
        } catch {
            Add-Content -Path $logFile -Value "  ERRO npm install: $($_.Exception.Message)" -ErrorAction SilentlyContinue
        }
    }

    Add-Content -Path $logFile -Value "Sincronizacao silenciosa concluida." -ErrorAction SilentlyContinue
    exit 0
}

Write-Host "================================================================" -ForegroundColor Cyan
$resp = Read-Host "Deseja ATUALIZAR suas memorias locais com a versao do repo? [S/n]"
if ($resp -eq '' -or $resp -match '^[sS]') {
    Write-Host ""
    Write-Host "Aplicando atualizacoes..." -ForegroundColor Cyan
    $instalarScript = Join-Path $setupDir "instalar-memorias.ps1"
    if (Test-Path $instalarScript) {
        & $instalarScript
    } else {
        Write-Host "ERRO: $instalarScript nao encontrado." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "OK, mantida versao local. Rode novamente quando quiser sincronizar." -ForegroundColor Gray
}
