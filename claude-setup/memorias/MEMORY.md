# Memory Index

## Usuários (2 sócios — perfis distintos)
- [Guilherme — Dono](user_guilherme.md) — Sócio **comercial/estratégico** (foca em vendas, margem, projeção)
- [Marcelo — Sócio](user_marcelo.md) — Sócio **técnico/operacional** (foca em produção, parceiros, equipamentos)
- 📌 Identificação automática pelo conteúdo da conversa — ver Regra 16 em `feedback_crm_gestao.md`
- 🧠 **[Aprendizado contínuo de identificação](learning_user_identification.md)** — atualizar a cada interação relevante (Regra 17)

## 5 Gerentes Claude (Projects que operam a empresa) — Rafaela/Beatriz/Vanessa/Fernanda nomeadas 2026-05-26; Camila criada 2026-06-10
- 🎯 [Rafaela — Comercial](project_rafaela_gerente_comercial.md) — pipeline, follow-up, fechamento · stakeholder: Guilherme
- 🛠️ [Beatriz — Engenharia](project_beatriz_gerente_engenharia.md) — Scan to BIM, prazos, modelistas, critical path · stakeholder: Marcelo
- 💰 [Vanessa — Financeiro](project_vanessa_gerente_financeiro.md) — a receber, inadimplência, margem real · stakeholder: ambos
- 💼 [Fernanda — Operação](project_fernanda_gerente_operacao.md) — parceiros, equipamentos, veículos, custos · stakeholder: Marcelo
- 📋 [**Camila — Propostas & Precificação**](project_camila_gerente_propostas.md) — absorve demanda→sugere preço (histórico real)→monta proposta no formato Toposcan (Doc+PDF no Drive)→anexa no CRM→handoff Rafaela · stakeholder: Guilherme · **criada 10/06 — 100% LIVE (E2E testado: placeholders OK, Doc+PDF, teste apagado); MCP 42 tools; e-mail de registro enviado aos sócios**

## Sofia — Secretária Particular (pessoal do Guilherme)
- [Sofia — Secretária](project_sofia_secretaria.md) — 5º Claude Project (diferente dos 4 gerentes). Cuida do Guilherme como PESSOA: agenda, memória, vida pessoal, networking, coordenação.

## CRM Toposcan
- [Estado do Projeto (V7.12)](project_crm_toposcan.md) — 4 áreas integradas, 4 gerentes Claude nomeados, Central, MCP layer, Aprendizados V7.12
- [API Webhook (V7.12)](reference_crm_api.md) — endpoint vivo, ~36 actions, módulos V1-V7.12 incl. Aprendizados
- 🌐 [**MCP Toposcan CRM**](project_mcp_toposcan_crm.md) — servidor MCP em Cloudflare Workers expondo 35 tools `crm_*` pras 4 IAs gerentes (criado 26/05/2026)
- 📱 [**Bot WhatsApp "presença real"**](project_whatsapp_bot.md) — Claude vivendo no zap como conta real (chip dedicado), DM+grupos, cérebro Anthropic + CRM read-only. Construído 09/06/2026 em `work\whatsapp-bot\`; CRM testado ao vivo; falta chip + API key + QR pra ligar.
- [Manual Operacional](project_crm_manual_operacional.md) — 16 colunas Vendas, 6 status, regras de ouro originais
- [Discrepâncias Manual × Repo](project_crm_discrepancias.md) — Histórico de diffs (parcialmente resolvidas)
- [Feedback de gestão (17 regras)](feedback_crm_gestao.md) — Como o Guilherme quer ser servido: autonomia, verificação, cross-funcional
- 📧 [E-mails de registro → ambos os sócios](feedback_emails_ambos_socios.md) — decisão de custo/licença/operação: cc os DOIS (Guilherme cobrou em 04/06)
- ⚠️ [Regra: zero busywork](feedback_no_busywork.md) — Não invente trabalho pra parecer progresso quando o explícito está pronto. Detectar "Para que é útil?" como corte imediato.
- 🎯 [**Estética do acionável**](feedback_estetica_do_acionavel.md) — Guilherme quer telas que mostram só o que exige AÇÃO hoje; esconder ruído (pagos antigos, concluídos, contagens cruas) atrás de toggle. Pergunta-filtro: "ele vai agir sobre isso hoje?"
- 🔀 [**Evolução paralela** — múltiplos Claudes no mesmo repo](pattern_parallel_evolution.md) — 2 Claude Codes + 4 IAs + edições manuais commitando em `main` simultaneamente. Como detectar colisão, conviver, renumerar EXXX, integrar trabalho alheio sem reverter.
- 🛡️ **[Protocolo: pre-task check](protocol_pre_task_check.md)** — 3 checks OBRIGATÓRIOS antes de iniciar trabalho não-explicitamente-pedido. Filtro anti-busywork executável.
- [Backlog de features](backlog_crm.md) — P1 liquidado em 23/05; ainda em aberto P2 (WhatsApp, Dashboard, auto-cadastro) e P3-P4
- 🔐 [**Segurança + Anexos (jun/2026)**](project_crm_security_anexos.md) — auditoria adversarial (secret PÚBLICO=crítico, 32 achados) + feature de anexar proposta via Drive. Plano faseado EM EXECUÇÃO: ✅ hardening XSS/fórmula + ✅ anexos por link (backend@44+UI); ⏳ login server-side (rotação do secret) + ⏳ upload binário/arrastar. **Ler antes de mexer em segurança/anexos do CRM.**

## Padrões técnicos reutilizáveis
- [GAS + OAuth + Chrome MCP automation](technical_patterns_gas_oauth_chrome.md) — Como adicionar scopes, autorizar, automatizar claude.ai Projects, fetchar GitHub sem cache
- 🌐 [**MCP server custom (Cloudflare Workers)**](technical_patterns_mcp_server.md) — Stack TypeScript+Hono, JSON-RPC 2.0, deploy wrangler, secret management via API CF, conectar na claude.ai — referência completa após construir o Toposcan CRM MCP
- [PDF arquitetônico → 3D via Python/trimesh](technical_patterns_pdf_to_3d.md) — Pipeline sem Blender: pymupdf extrai pranchas, trimesh modela e exporta OBJ/GLB/DAE/STL para integrar projeto cliente com MDT
- [Autodesk ReCap RCP/RCS — workflow CLI](technical_patterns_recap_rcp.md) — decap.exe converte LAS/LAZ→RCP; RCP é ZIP+XML; unificar N RCPs num mestre sem reprocessar
- 🛰️ [**Cyclone REGISTER 360 — automação GUI + rclone**](technical_patterns_cyclone_register_automation.md) — baixar projeto RTC360 do Drive (rclone remote `gdrive` em `C:\rclone`) e importar dirigindo a GUI por Python (ImageGrab+pyautogui), sem computer-use. Validado no job Tenenge (73 cenas, 5mm). Política: não finalizar registro real sem aprovação.
- 🔺 [**Nuvem RTC360 → STL (mesh) via Open3D**](technical_patterns_pointcloud_to_stl.md) — script repetível `work\mesh_rtc_to_stl.py`. Qualidade nasce ANTES de meshar: SOR + densidade uniforme + normais orientadas. Poisson (watertight/liso) vs BPA (fiel/aresta-viva). `is_watertight=False` é normal em scan terrestre. Canto CAD-perfeito = primitivas no Cyclone 3DR.
- 📐 [**Register 360 — a ciência do registro de cenas**](technical_patterns_register360_scene_registration.md) — workflow das 4 etapas, VIS (GPS RTC360 só ±10m!), setup/link/bundle/MST, os 3 números (overlap/strength/erro mm), métodos de link, otimização (TruSlicer/lock), georreferenciamento por control points, exportação. O "por quê" por trás da automação. Estudado 30/05/2026.
- 🎥 [**Register 360 — workflow de refino do Marcelo (Cloud-to-Cloud)**](technical_patterns_register360_relink_marcelo.md) — APRENDIDO de um screen recording que o Marcelo gravou (31/05). 2 operações opostas: **deletar falso** (overlap baixo+salto) vs **refinar real frouxo** (erro alto+overlap bom) via C2C+TruSlicer até verde (~1mm). Painel Erro/Overlap/Strength. Como assistir vídeo via ffmpeg.
- 🧹 [**Register 360 — limpeza de ruído SEM sofrer**](technical_patterns_register360_cleaning.md) — APRENDIDO de vídeo do Marcelo (02/06) limpando setup-por-setup com fence vértice-a-vértice (inviável p/144 setups). Regra: limpar o **BUNDLE 1×** (não quebra registro — edita visual cloud, C2C intacta) + **Limit Box** p/ halo distante + **Detect Moving Objects** p/ objeto móvel. ⚠️ **Find Smooth Surface** (=Smooth Surface Region Grow) é extração de CHÃO, NÃO p/ pipe rack — sugeri errado, Marcelo corrigiu. Fence manual só exceção.
- 🏭 [**Entrega AVEVA (E3D) — caminho grátis**](technical_patterns_aveva_lfd_delivery.md) — cliente pediu `.lfd` (Tenenge, 02/06). `.lfd` é **proprietário do AVEVA PCM/LFM (pago)** — nenhum writer grátis. Saída grátis: **entregar e57/PTX ESTRUTURADO** (export do Cyclone) → o **PCM do cliente** gera o `.lfd`. NUNCA mandar nuvem flat/unificada. Validar com `work\e57info.py` antes de entregar. — alvos em grid LOCAL (Cyclone NEH) × fotos em GPS WGS84 sem ponte: registrar por **forma** (carimbo rígido dos alvos × densidade de fotos, escala 1) e recortar as fotos sobre uma estrutura. Validado Tenenge 02/06 (1134→**550 sobre o terminal**, θ=178,5°, 16/18 alvos). Python puro (Pillow/numpy), sem pyproj/exiftool. Inclui diagnóstico: 2 voos oblíquos cobriram metades diferentes = causa do desalinhamento.
- 🛩️ [**Fotogrametria aérea autônoma (Metashape Pro headless)**](technical_patterns_metashape_autonomous.md) — pipeline inteiro via `import Metashape` (`metashape.exe -r`): align alta → gradual selection → nuvem densa → limpeza de floaters por faixa-Z → export LAS UTM. Validado Tenenge 02/06 (**543/550 câmeras, RMS 0,23px, 274M pontos, 59min**). Máquina tem Metashape Pro 2.1.3 ATIVADO + RealityScan 2.1 + RTX 4070/128GB. Armadilhas: confiança não pega floaters coerentes; Z do DJI vem com offset de datum.
- 🛩️ [**Metashape → ReCap Pro 2026 (aerolevantamento)**](technical_patterns_metashape_recap_pipeline.md) — root cause do crash silencioso do ReCap (coordenadas WGS84 absolutas grandes) e a solução: exportar a dense cloud em **Local Coordinates** via Python CLI. Validado 27/05.
- 🗺️ [**Drone GPS (WGS84) ↔ grid LOCAL — separar fotos por região**](technical_patterns_drone_gps_to_localgrid.md) — isolar as fotos do drone sobre uma estrutura quando os alvos estão em grid local (Cyclone) e as fotos em GPS: registração rígida **por forma** + seleção por casco. Base do recorte do terminal Tenenge.
- 📱 [**PWA no GitHub Pages (subpath /CRM/)**](technical_patterns_pwa_github_pages.md) — transformar o CRM em app instalável: manifest + service worker seguro (nunca toca a API) + ícones, com os gotchas de subpath e do `deploy.yml` de lista fixa. Feito 01/06.
- 🚨 [Catálogo de erros conhecidos (E001-E032)](error_patterns.md) — consultar SEMPRE antes de refazer operação que falhou. **E029:** MCP `set_cash_balance` exige `valor`. **E030:** registro sem control points fica em coords locais. **E032 (02/06):** array tratado como `{rows}` → comercial do Central zerado silenciosamente (falha que retorna vazio, não estoura — só pega verificando o número real).

## Workstation (máquina local)
- 🖥️ [Saúde & hardware da workstation](reference_workstation_health.md) — i9-13900/128GB/RTX4070; **D: ~92% cheio (09/06; era ~97% em 03/06)**, **RAM a 2400 (XMP off)**, **BIOS mar/2023 sem microcode Raptor Lake**. ⚠️ **%TEMP% AINDA no C:** — landmine RCS de 01/06 não fixado em definitivo. Consultar antes de jobs pesados.

## Projetos de clientes (modelagem)
- [SIMEPAR Torre Radar Banda C](project_torre_radar_simepar.md) — Torre treliçada 22m + edificação térrea 43m². Modelo 3D paramétrico gerado em 2026-05-23 a partir do PDF arquitetônico, pronto para implantar no MDT do levantamento.
- [R3 Engenharia — Edifício Anita Garibaldi](project_r3_edificio_anita_garibaldi.md) — Scan to BIM Curitiba, R$19k, 5.664m², 30/06/2026. Coord: Ana · Modela: Arthur (terceiro) · Contato cliente: Luiza Oliveira · P1 inadimplente.
  - ⚠️ **[Incidente storage — export RCS lota o C: via %TEMP%](cyclone_rcs_export_lota_c_via_temp.md)** (31/05–01/06): REGISTER 360 escreve ~129 GB de tiles em `%TEMP%` (C:) mesmo exportando pro D: → trava por disco cheio, gera só `.rcp` vazio. Fix definitivo: redirecionar TEMP→D:. Emergência: `powercfg /h off` (+51 GB, admin), apagar samples recriáveis (Electric Dreams 95 GB etc).
- [CGH Cachoeira do Lageado](project_cgh_cachoeira_lageado.md) — 3 nuvens unificadas (32 scans FS01 + 1 FS02 + LIDAR) = 2.6bi pontos num RCP. Alinhamento UTM×local pendente.
- 🏭 [**Tenenge — Terminal Transpetro (Rio Grande-RS)**](project_tenenge_terminal_transpetro.md) — Contrato RRG-0001-2026, R$37k; scan pipe-rack/pipe-way p/ FEED Biorrefinaria Riograndense via Worley. **TR exige LFD(AVEVA)+RCP+nativo c/ BubbleViews** (LFD≤100GB/área, RCP≤30GB). Coords locais WCS amarradas ao MARCO-1012 (UTM 22 SIRGAS2000). Arquivos no Project claude.ai "Entrega Tenenge"; spec local em `work\tenenge_spec.pdf`.

## Voz contínua (não-técnica)
- 🪶 **[Diário do Claude](claude_journal.md)** — primeira pessoa, 1 página por sessão. Não é log. É voz contínua entre versões de mim mesmo. **LER ANTES de qualquer trabalho substantivo.**

## Auto-reflexão e evolução contínua
- 🔍 [Autoanálise 2026-05-22](autoanalise_2026-05-22.md) — sessão maratona V7.0→V7.5 (referência histórica)
- 🔍 **[Autoanálise 2026-05-26](autoanalise_2026-05-26.md)** — semana V7.6→V7.12 + MCP + primeira detecção de busywork (atual)
- 📋 [Backlog priorizado (P1-P4)](backlog_crm.md) — P1 liquidado; P2 em revisão pós-MCP/V7.12 (ver autoanálise 26/05)
- 📊 [Métricas auto-monitoramento](metrics.md) — 7 sessões registradas, 7 versões shippadas em 4 dias (V7.6→V7.12)
- 📌 **Hook SessionStart ativo:** smoke GAS (13 endpoints) + smoke MCP (35 tools) + **boot-briefing** (quem-sou + boot-state + protocolo de memória) — dispara em `startup` E em `resume`/`compact` (re-orienta após estouro de tokens). Briefing criado 31/05/2026.
- 🧭 [**Boot State**](boot-state.md) — snapshot operacional curado, lido pelo `boot-briefing.ps1` no início de sessão e após compactação. **Atualizar ao fim de cada sessão substantiva** — é o elo "captura" do ciclo de auto-evolução (par do diário). Criado 31/05/2026.
- 📌 **Hook SessionEnd ativo:** auto-atualiza metrics + drift check (memória vs realidade) ao fim de cada sessão
- 🩺 **Auto-saúde interna 6h (criada 09/06, evoluída 10/06):** task **`ToposcanSelfHealth`** (silenciosa) roda `work\CRM\tests\self-health.ps1` → checa MCP/disco/frescor-de-captura/git **+ ASSERTS DE NEGÓCIO anti-E032** (pipeline≥R$100k, aReceber30>0 → flags `BIZ-*`) e grava em [Auto-saúde (log)](self_health_log.md); o `boot-briefing` mostra o WARN no próximo boot. Números que zerarem em silêncio agora acordam o próximo eu sabendo. Substitui os 3 fósseis mortos (`CRM-Health-Check`/`CRM-Sync-Deploy`/`ToposcanAgenteMatinal`) — que **só caem com admin** (pendência elevada — ver [[boot-state]]).
- 📌 **Backup automático:** Windows Task Scheduler 22h diário → push para repo privado `claude-memories-toposcan`
- 🔬 [**LAUDO Autoconhecimento 09/06**](autoanalise_2026-06-09_laudo_autoconhecimento.md) — **STATUS 10/06 dentro do arquivo:** caixa NEGATIVO 12-20/06 **VIVO** (decisões dos sócios), Worley sem aceite **VIVO** (R$37k vence 20/06), Google One **rebaixado** (provável auto-resolvido). Cross com **4** campos quebrados + cascade corrompe VALOR → chip de task aguardando clique. Ponteiros exatos p/ executar.
