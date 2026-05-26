---
name: technical-patterns-recap-rcp
description: Como converter LAS/LAZ para RCP e criar RCP mestre unificando múltiplas nuvens via decap.exe + manipulação do XML interno
metadata: 
  node_type: memory
  type: reference
  originSessionId: d170933a-74ef-40a3-980d-a9230c1c9037
---

# Autodesk ReCap RCP/RCS — workflow CLI

## Ferramentas (já instalados em C:\Program Files\Autodesk\Autodesk ReCap\)
- `ReCap.exe` — GUI (não tem `--help` CLI utilizável)
- `decap.exe` — CLI batch para conversão (este é o canivete)
- `AdskFaroConverter.exe` — converter Faro nativo

## Formato RCP — engenharia reversa
- RCP é um arquivo **ZIP** (header `PK 03 04`) contendo **1 XML** nomeado por GUID
- O XML lista cada scan como `<VoxelTreeRunTime>` apontando para um `.rcs` via `<Path Value="absoluto">`
- Flags importantes: `<IsLidarData Value="0|1">`, `<HasRGB>`, `<HasNormals>`, `<HasIntensity>`
- Bounding box em `<map>` e `<LimitBox>`
- CRS em `<CoordinateSystem Value="">` (frequentemente vazio nos exports de Register360 — fica em coords locais)
- `<GeoReference>`, `<GridOrigin>` para origem global

## Caminhos quebrados em RCPs do Register360
**Why:** Register360 (Faro) exporta RCP com Path absoluto da pasta original do projeto, NÃO do disco atual. Se a pasta foi renomeada (ex: "FS 01 Final" → "FS 01 Final scan"), o RCP referencia caminho que não existe e ReCap não abre os RCS.

**How to apply:** Antes de unir RCPs num mestre, **corrigir todos os `<Path Value="...">`** para os caminhos reais dos `.rcs` no disco. Validar com `Test-Path` antes de gerar o RCP final.

## Comando-chave: converter LAS/LAZ → RCP
```powershell
& "C:\Program Files\Autodesk\Autodesk ReCap\decap.exe" `
    --importWithLicense "<output-dir>" "<project-name>" `
    --currentCoordinateSystem "EPSG:31982" `
    --targetCoordinateSystem "EPSG:31982" `
    "<input.las|.laz>"
```
- `--importWithLicense` usa licença ReCap instalada (evita auth token manual)
- `--currentCoordinateSystem` / `--targetCoordinateSystem` aceitam códigos EPSG
- Para LAZ georef brasileiro padrão use EPSG:31978-31985 (SIRGAS 2000 UTM 18S-25S)
- Outras opções úteis: `--decimation`, `--unify`, `--normalizeIntensity 1`, `--minRangeClipping`, `--maxRangeClipping`

## Como extrair CRS de um LAZ (sem laspy/lastools)
Ler VLR com UserID="LASF_Projection" RecID=34735 (GeoKeyDirectoryTag).
A Key 3072 (ProjectedCSTypeGeoKey) tem o EPSG no `ValueOffset`.
A VLR RecID=34737 (GeoAsciiParamsTag) tem nome legível tipo "SIRGAS_2000_UTM_Zone_22S".

## Como unificar N RCPs num mestre (sem reprocessar)
1. Extrair o XML de cada RCP origem (são ZIPs)
2. Coletar todos os `<VoxelTreeRunTime>` de cada um
3. Corrigir os `<Path>` apontando para os `.rcs` reais no disco
4. Montar XML novo com:
   - `<ProjectId UUID="...">` (novo GUID)
   - `<Nodes>` contendo todos os VoxelTreeRunTime concatenados
   - Estrutura mínima: `<Measurements/>`, `<PointCloudSegmentList>`, `<ViewStates/>`, `<ProjectMetaData>`, `<Project>`
5. Compactar como ZIP com extensão `.rcp` — UM único XML nomeado por GUID

## Pegadinhas / E-* candidates
- LAZ com PointDataFormat ≥ 128 é a flag de compressão laszip (formato real = format - 128)
- Se FS scans estão em coords locais e LIDAR em UTM real, eles **NÃO caem no mesmo lugar** mesmo "georef" → precisa pontos de controle ou co-registro manual no ReCap
- Sempre rodar `decap.exe --checkLicense` primeiro

Ver também: [[error_patterns]], [[project_torre_radar_simepar]]
