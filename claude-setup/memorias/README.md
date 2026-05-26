# 🧠 Claude Memories — Toposcan

Memórias persistentes do Claude Code operando o CRM Toposcan.

**Conteúdo PRIVADO** — só para uso interno (Guilherme + Marcelo + Claude).

## Estrutura

| Arquivo | Tipo | Conteúdo |
|---|---|---|
| `MEMORY.md` | índice | Lista de todos os arquivos com 1-linha de descrição |
| `user_*.md` | user | Perfis de Guilherme e Marcelo |
| `project_*.md` | project | Estado dos projetos CRM e Sofia |
| `feedback_*.md` | feedback | Regras de como ser servido |
| `reference_*.md` | reference | Pointers para sistemas externos |
| `learning_*.md` | learning | Log evolutivo (atualizado por sessão) |
| `error_patterns.md` | error-catalog | Padrões de falha conhecidos |
| `technical_patterns_*.md` | technical | Padrões reutilizáveis (GAS, OAuth, etc) |
| `autoanalise_*.md` | self-analysis | Autoavaliações pontuais |
| `backlog_*.md` | backlog | Priorização de próximos passos |
| `metrics.md` | metrics | Métricas de auto-monitoramento |

## Backup

Backup automático diário via Windows Task Scheduler → push para este repo.
Backup local manual fica em `_backup_YYYYMMDD_HHMMSS/` (excluído do Git).

## Como restaurar em outra máquina

```bash
gh repo clone toposcansend-cmyk/claude-memories-toposcan ~/.claude/projects/C--Users-NOVAMACHINE/memory
```

Em seguida o Claude Code carrega `MEMORY.md` no início de cada sessão.
