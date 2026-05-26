---
name: project-torre-radar-simepar
description: Projeto SIMEPAR Torre Radar Meteorológico Banda C — convertido de PDF arquitetônico para modelo 3D em 2026-05-23 para integração com MDT do levantamento Toposcan.
metadata: 
  node_type: memory
  type: project
  originSessionId: 0c9ff5a2-f7b0-44c3-8bc9-14bc792f7f4d
---

# SIMEPAR — Torre Radar Banda C

**Cliente/Parceiro:** SIMEPAR (Sistema Meteorológico do Paraná)
**Tipo:** Projeto de montagem de torre para estação de radar meteorológico Banda C
**Origem do projeto:** AutoCAD 2020, prancha A1 única (01-ARQUITETONICO), datada JUN/2025, rev 01 em 24/03/2026
**PDF fonte:** `C:\Users\23GAMER\Downloads\01-ARQUITETONICO TORRE RADAR-BANDA C-.pdf`

**Estrutura:**
- Torre metálica treliçada quadrada 5,00 × 5,00 m
- Altura da plataforma: **22,00 m AOS** (acima do solo)
- 4 pernas + X-bracing em todas as faces + escada switchback interna (7 lances)
- Plataforma com cabine "escritório" (4,84 × 4,25m = 20,57m²)
- Guarda-corpo H=1,30m perimetral
- Edificação térrea anexa LSF (43m², com COPA, ALMOXARIFADO, TRANSMISSOR, GERADOR)

**Why:** O cliente entregou o PDF e Guilherme pediu para gerar modelo 3D para integrar com o MDT do terreno levantado por Toposcan.

**How to apply:** Modelo 3D paramétrico em `C:\Users\23GAMER\Downloads\torre_radar_extract\modelo_3d\`:
- Multi-formato: OBJ/GLB/DAE/STL/PLY/3MF
- Origem em (0,0,0) no centro da base para implantação no MDT (translação para coordenada UTM da torre)
- Script paramétrico `build_torre_radar.py` permite ajustar dimensões e regerar
- Radome é placeholder (não consta no PDF arquitetônico — pegar do fabricante quando precisar de precisão)

Pipeline técnico usado: [[technical-patterns-pdf-to-3d]]
