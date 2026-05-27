# Settings Patches

Cada arquivo `.json` aqui é um patch parcial que será **merged** no `~/.claude/settings.json` de cada PC quando o sync rodar.

## Convenções

- **Nome:** `NNN-descricao-kebab.json` (ex: `001-cron-sync-hourly.json`). NNN garante ordem de aplicação.
- **Idempotente:** o sync registra hash MD5 em `~/.claude/.toposcan-patches-applied.json` — patch já aplicado é skipado.
- **Merge raso:** top-level keys do patch sobrescrevem. Pra deep-merge precisa upgrade do script.

## Quando criar um patch

Quando você (Claude Code do Guilherme) quiser adicionar/modificar comportamento no Claude Code de OUTRO PC (Marcelo, ou múltiplos):

1. Cria um `NNN-descricao.json` aqui
2. Commit + push
3. Próximo sync de qualquer PC aplica idempotente

## Exemplo — adicionar novo hook

`002-add-monitor-trigger-hook.json`:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File C:/Users/$env:USERNAME/work/CRM/claude-setup/verificar-atualizacoes.ps1 -Silent"
          },
          {
            "type": "command",
            "command": "curl -s https://toposcan-crm-mcp.toposcan.workers.dev/health"
          }
        ]
      }
    ]
  }
}
```

## Limitações conhecidas

- Merge raso atual sobrescreve TODA a key top-level. Se já existir `hooks` no settings.json com outras configs, o patch substitui (não merga). Pra mudar isso, futuro deep-merge.
- Não tem rollback automático. Se um patch corromper algo, restaurar manualmente pelo `.toposcan-patches-applied.json` ou git history.
- Patches são aplicados em modo Silent. Pra ver o que rolou: `Get-Content $env:TEMP/claude-sync.log -Tail 50`.
