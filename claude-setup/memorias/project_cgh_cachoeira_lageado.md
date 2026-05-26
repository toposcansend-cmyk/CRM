---
name: project-cgh-cachoeira-lageado
description: "Projeto CGH Cachoeira do Lageado — 3 nuvens unificadas (FS01 32 scans, FS02 1 scan gigante, LIDAR aerolevantamento UTM 22S)"
metadata: 
  node_type: memory
  type: project
  originSessionId: d170933a-74ef-40a3-980d-a9230c1c9037
---

# CGH Cachoeira do Lageado — Unificação de nuvens

## Dados
- **Local:** D:\FS\
- **Cliente/Obra:** CGH (Central Geradora Hidrelétrica) Cachoeira do Lageado — Paraná
- **CRS oficial:** SIRGAS 2000 / UTM Zone 22S (EPSG:31982)

## Insumos
| Fonte | Pontos | Tamanho | Sistema de coords |
|-------|--------|---------|-------------------|
| FS 01 (32 scans Faro) | 1.422.072.555 | ~10 GB | LOCAL (origem ~0) |
| FS 02 (1 scan único 360°) | 1.061.514.824 | ~15 GB | LOCAL (origem ~0) |
| LIDAR aerolevantamento (LAZ Global Mapper) | 124.916.364 | 1 GB (.laz) → 3 GB (.rcs) | UTM 22S real (436km E, 7200km N) |
| **TOTAL** | **2.612.964.020 (2.6 bi)** | **~27 GB RCS** | |

## Entregáveis gerados (2026-05-25)
- `D:\FS\LIDAR_RCP\LIDAR_CGH_Lageado.rcp` — LAZ convertido para RCP via decap.exe
- `D:\FS\PROJETO_UNIFICADO.rcp` — RCP mestre com 34 scans (FS01 + FS02 + LIDAR)
- `D:\FS\merge_rcps.ps1` — script reutilizável

## Alinhamento ⚠️
**Why:** Faro Register360 exportou os RCPs dos FS sem georef UTM (CoordinateSystem="", coords locais pequenas). O LIDAR LAZ tem georef UTM real. No RCP unificado eles ficam separados por ~436km no espaço 3D — não caem no mesmo lugar visualmente, embora o LIDAR esteja correto em UTM.

**How to apply:** Para alinhar definitivamente: (a) re-registrar FS no Register360 com pontos de controle GPS coletados em campo, (b) ou aplicar translação manual via ReCap GUI usando ponto comum identificável (ex: estrutura visível tanto no LIDAR quanto nos FS), (c) ou subtrair offset UTM do LIDAR (perde georef mas junta visualmente).

## Workflow técnico aplicado
1. Inspecionei header LAZ + VLRs → extrai EPSG:31982 do GeoKeyDirectoryTag
2. `decap.exe --importWithLicense` → LAZ→RCP/RCS preservando UTM
3. Script PowerShell unificou 3 RCPs via manipulação direta do XML interno (RCP=ZIP+XML), corrigindo paths quebrados do Register360
4. Validação: Test-Path em cada um dos 34 RCS + bounding box check

Ver: [[technical_patterns_recap_rcp]] (padrão geral reutilizável)
