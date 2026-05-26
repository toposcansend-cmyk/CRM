# Memory Index

## Usuários (2 sócios — perfis distintos)
- [Guilherme — Dono](user_guilherme.md) — Sócio **comercial/estratégico** (foca em vendas, margem, projeção)
- [Marcelo — Sócio](user_marcelo.md) — Sócio **técnico/operacional** (foca em produção, parceiros, equipamentos)
- 📌 Identificação automática pelo conteúdo da conversa — ver Regra 16 em `feedback_crm_gestao.md`
- 🧠 **[Aprendizado contínuo de identificação](learning_user_identification.md)** — atualizar a cada interação relevante (Regra 17)

## 4 Gerentes Claude (Projects que operam a empresa) — nomeados em 2026-05-26
- 🎯 [Rafaela — Comercial](project_rafaela_gerente_comercial.md) — pipeline, follow-up, fechamento · stakeholder: Guilherme
- 🛠️ [Beatriz — Engenharia](project_beatriz_gerente_engenharia.md) — Scan to BIM, prazos, modelistas, critical path · stakeholder: Marcelo
- 💰 [Vanessa — Financeiro](project_vanessa_gerente_financeiro.md) — a receber, inadimplência, margem real · stakeholder: ambos
- 💼 [Fernanda — Operação](project_fernanda_gerente_operacao.md) — parceiros, equipamentos, veículos, custos · stakeholder: Marcelo

## Sofia — Secretária Particular (pessoal do Guilherme)
- [Sofia — Secretária](project_sofia_secretaria.md) — 5º Claude Project (diferente dos 4 gerentes). Cuida do Guilherme como PESSOA: agenda, memória, vida pessoal, networking, coordenação.

## CRM Toposcan
- [Estado do Projeto (V7.6)](project_crm_toposcan.md) — 4 áreas integradas, 4 gerentes Claude, Central, agentes 24/7, deploy estável + monitor triggers
- [API Webhook (V7.12)](reference_crm_api.md) — endpoint vivo, ~36 actions, módulos V1-V7.12 incl. Aprendizados (memória institucional da Rafaela)
- [Manual Operacional](project_crm_manual_operacional.md) — 16 colunas Vendas, 6 status, regras de ouro originais
- [Discrepâncias Manual × Repo](project_crm_discrepancias.md) — Histórico de diffs (parcialmente resolvidas)
- [Feedback de gestão (17 regras)](feedback_crm_gestao.md) — Como o Guilherme quer ser servido: autonomia, verificação, cross-funcional
- [Backlog de features](backlog_crm.md) — P1 liquidado em 23/05; ainda em aberto P2 (WhatsApp, Dashboard, auto-cadastro) e P3-P4

## Padrões técnicos reutilizáveis
- [GAS + OAuth + Chrome MCP automation](technical_patterns_gas_oauth_chrome.md) — Como adicionar scopes, autorizar, automatizar claude.ai Projects, fetchar GitHub sem cache
- [PDF arquitetônico → 3D via Python/trimesh](technical_patterns_pdf_to_3d.md) — Pipeline sem Blender: pymupdf extrai pranchas, trimesh modela e exporta OBJ/GLB/DAE/STL para integrar projeto cliente com MDT
- [Autodesk ReCap RCP/RCS — workflow CLI](technical_patterns_recap_rcp.md) — decap.exe converte LAS/LAZ→RCP; RCP é ZIP+XML; unificar N RCPs num mestre sem reprocessar
- 🚨 [Catálogo de erros conhecidos (E001-E011)](error_patterns.md) — Consultar SEMPRE antes de refazer operação que falhou

## Projetos de clientes (modelagem)
- [SIMEPAR Torre Radar Banda C](project_torre_radar_simepar.md) — Torre treliçada 22m + edificação térrea 43m². Modelo 3D paramétrico gerado em 2026-05-23 a partir do PDF arquitetônico, pronto para implantar no MDT do levantamento.
- [R3 Engenharia — Edifício Anita Garibaldi](project_r3_edificio_anita_garibaldi.md) — Scan to BIM Curitiba, R$19k, 5.664m², 30/06/2026. Coord: Ana · Modela: Arthur (terceiro) · Contato cliente: Luiza Oliveira · P1 inadimplente.
- [CGH Cachoeira do Lageado](project_cgh_cachoeira_lageado.md) — 3 nuvens unificadas (32 scans FS01 + 1 FS02 + LIDAR) = 2.6bi pontos num RCP. Alinhamento UTM×local pendente.

## Auto-reflexão e evolução contínua
- 🔍 [Autoanálise 2026-05-22](autoanalise_2026-05-22.md) — onde fui forte, onde fui burro, roadmap de evolução
- 📋 [Backlog priorizado (P1-P4)](backlog_crm.md) — P1 LIQUIDADO em 23/05 (smoke + error_patterns + backup + hook + monitor triggers)
- 📊 [Métricas auto-monitoramento](metrics.md) — baseline + metas 30/90 dias
- 📌 **Hook SessionStart ativo:** smoke test dispara automaticamente ao iniciar nova sessão (output: 1 linha)
- 📌 **Backup automático:** Windows Task Scheduler 22h diário → push para repo privado `claude-memories-toposcan`
