---
name: self-health-log
description: "Log append-only da auto-saude interna e silenciosa do Claude (scheduled task ToposcanSelfHealth, 6h). Cada linha = 1 probe. WARN = surface no proximo boot-briefing. Nao notifica o usuario."
metadata:
  node_type: memory
  type: metrics
---

# Auto-saude interna (silenciosa, 6h)

> Append-only. Lido pelo boot-briefing pra cutucar quando houver WARN.
> Politica vigente: TEMP no C: + monitorar (09/06). DISK-LOW < 60GB.
- [2026-06-09 17:22:40] WARN | mcp OK (5375ms) | C:399GB | D:58GB | git:1nc | >>> DISK-D-LOW(58GB)
- [2026-06-09 17:26:25] WARN | mcp OK (4918ms) | C:399GB | D:58GB | git:2nc | >>> DISK-D-LOW(58GB)
- [2026-06-09 18:00:02] WARN | mcp OK (6849ms) | C:399GB | D:58GB | >>> DISK-D-LOW(58GB)
- [2026-06-10 00:00:02] WARN | mcp OK (6696ms) | C:398GB | D:52GB | git:3nc | >>> DISK-D-LOW(52GB)
- [2026-06-10 00:38:49] WARN | mcp OK (9286ms) | C:398GB | D:50GB | git:5nc | pipe:R([math]::Round(0/1000))k | >>> DISK-D-LOW(50GB), BIZ-PIPELINE-SUSPEITO(Rpipe)
- [2026-06-10 00:39:43] WARN | mcp OK (4645ms) | C:398GB | D:50GB | git:5nc | pipe:R$2538k | aRec30:R$103k | >>> DISK-D-LOW(50GB)
