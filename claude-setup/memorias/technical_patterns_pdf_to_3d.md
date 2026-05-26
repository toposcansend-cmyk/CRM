---
name: technical-patterns-pdf-to-3d
description: "Pipeline para converter PDFs arquitetônicos (CAD/AutoCAD) em modelo 3D paramétrico via Python + trimesh, sem depender de Blender ou software fechado. Útil para integrar projetos do cliente com MDT de levantamento topográfico."
metadata: 
  node_type: memory
  type: project
  originSessionId: 0c9ff5a2-f7b0-44c3-8bc9-14bc792f7f4d
---

# PDF arquitetônico → Modelo 3D paramétrico (sem Blender)

**Contexto:** Toposcan recebe PDFs arquitetônicos de clientes/parceiros (ex: SIMEPAR torre radar) que precisam ser integrados ao MDT do terreno levantado. Em vez de redesenhar manualmente, usar pipeline Python autônomo.

**Why:** Blender via Microsoft Store no Windows tem proteção AppX que bloqueia execução CLI (acesso negado). Não dá para automatizar sem reinstalar versão portable.

**How to apply:**

1. **Extrair conteúdo do PDF** com `pymupdf` (fitz):
   - Renderizar páginas em PNG alta resolução (mat = `fitz.Matrix(6.0, 6.0)` ou 8x para zoom de detalhes)
   - Recortar regiões de interesse (plantas, cortes, fachadas, carimbo) com `clip=fitz.Rect(...)`
   - Ler texto incorporado com `page.get_text("text")` (CAD PDFs costumam ter texto fragmentado/sem ordem espacial — usar só para pegar cotas isoladas)

2. **Interpretar visualmente** via Read tool nos PNGs gerados — não tentar parsear cotas automaticamente de PDFs CAD (texto está fora de ordem).

3. **Modelar parametricamente com `trimesh`:**
   - Origem (0,0,0) no centro da base, eixo Z=up, unidades em metros
   - Construir por componente (foundation → estrutura → escadas → plataforma → equipamentos → terreno_built)
   - Cores por componente via `mesh.visual.face_colors = [r,g,b,a]`
   - `trimesh.creation.box`, `cylinder`, `icosphere` + helper para `beam_between(p1, p2)` que cria viga retangular entre 2 pontos 3D

4. **Exportar formatos universais** (todos suportados nativamente por trimesh):
   - **OBJ + MTL** (universal — Civil 3D via Recap, AutoCAD, SketchUp, ArcGIS, QGIS)
   - **GLB** (web, Three.js, Windows 3D Viewer)
   - **DAE** (COLLADA — requer `pip install pycollada`)
   - **STL** (impressão 3D, CloudCompare)
   - **PLY** (point clouds, GIS)
   - **3MF** (impressão moderna, Windows nativo — requer `pip install networkx lxml`)

5. **Render preview** com matplotlib 3D (`Poly3DCollection`) — 4-5 vistas (perspectiva, frontal, lateral, planta, isolada). Carregar do GLB (preserva grupos) e usar dict de cores por prefixo do node_name.

6. **Bônus Blender:** gerar script `.py` que reconstrói o `.blend` com Collections + materiais — usuário roda manualmente no Blender se quiser editar.

**Pacotes Python necessários:**
```
pymupdf trimesh numpy pycollada networkx lxml matplotlib
```

**Referência:** primeira execução desse pipeline foi em 2026-05-23 para [[project_torre_radar_simepar]] — convertendo o PDF da Torre Banda C em modelo 3D para integração com MDT do levantamento Toposcan.
