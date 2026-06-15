---
name: project-camila-gerente-propostas
description: "Camila — 5ª IA gerente da Toposcan (Propostas & Precificação). Absorve demanda do cliente, sugere preço pelo histórico real, monta a proposta no formato Toposcan (Doc+PDF no Drive), anexa no CRM e registra no funil. Criada em 10/06/2026."
metadata:
  node_type: memory
  type: project
  originSessionId: 54ac2af3-9720-429d-8811-908d0aedb9a2
---

# 💼 Camila — Gerente de Propostas & Precificação (Claude Project)

Criada em **2026-06-10** a pedido do Guilherme: *"um gerente que absorve demandas dos clientes, analisa, cria a proposta 100% no formato Toposcan e dá a sugestão de precificação conforme fazemos hoje, totalmente integrado ao sistema e aos outros gerentes — eu passo a demanda, ele sugere o preço e monta a proposta sozinho, 100% autônomo executivo."*

É a **6ª IA** da Toposcan (5 gerentes operacionais + Sofia secretária). Stakeholder principal: **Guilherme** (comercial). Irmãs: [[project-rafaela-gerente-comercial]] (Comercial), [[project-beatriz-gerente-engenharia]] (Engenharia), [[project-vanessa-gerente-financeiro]] (Financeiro), [[project-fernanda-gerente-operacao]] (Operação); + [[project-sofia-secretaria]] (pessoal do Guilherme).

## Identidade
- **Área:** Propostas / Pré-vendas / Precificação
- **Project ID:** `019eb2fa-bb3a-779f-9698-9dea43e6870f`
- **URL:** https://claude.ai/project/019eb2fa-bb3a-779f-9698-9dea43e6870f
- **Prompt (fonte da verdade):** `C:\Users\23GAMER\work\CRM\PROMPT-CLAUDE-PROPOSTAS.md` (~500 linhas, commitado no repo)
- **Default da conta é "Rafaela"** → o prompt sobrescreve a identidade pra "Camila" (mesmo padrão de Vanessa/Beatriz/Fernanda).

## Fluxo mestre (o que ela faz)
1. Recebe a demanda do cliente (texto/e-mail/áudio transcrito)
2. Extrai serviço, quantitativo (m²/área/cenas), local, prazo, entregáveis — pergunta no máx. 2-4 itens se faltar dado essencial
3. Consulta contexto: `crm_find` (cliente/histórico/inadimplência), `crm_get_learnings` (codinomes, padrões de perda), e o doc de precificação
4. **Sugere preço:** faixa + recomendado + justificativa (âncoras/comparáveis) + margem líquida (×0,89)
5. **Aguarda OK do Guilherme no preço** (não gera doc antes)
6. `crm_next_proposal_number` → `crm_generate_proposal` (Doc+PDF no Drive, anexa no CRM)
7. Registra no funil: `crm_add_lead`/`crm_update` (status "Lead" 10%; "Enviada" 30% só após envio real)
8. Prepara rascunho de e-mail ao cliente → **envia só com OK** (`crm_send_email`)
9. Handoff pra Rafaela (follow-up); grava aprendizado se houver lição

## Limite de autonomia (decidido pelo Guilherme em 10/06)
- ✅ Gera proposta + anexa + registra + deixa e-mail PRONTO sozinha
- 🔴 **NÃO envia e-mail ao cliente sem OK** · 🔴 **NÃO fecha/promete preço sem OK** · 🔴 não marca "Fechada" (território Rafaela/Guilherme) · 🔴 não inventa preço fora das faixas sem sinalizar

## Infraestrutura criada pra ela
- **2 actions novas no GAS** (`work\clasp-crm\Code.js`, V7.15, deployado @50): `generateProposal` (copia template→preenche 11 placeholders→Doc+PDF na pasta Drive→anexa no CRM) e `nextProposalNumber` (sequencial **contínuo no ANO**, não por mês: jun/2026 = `062026108.0`) + `uploadProposalTemplate` (admin). Reusa o módulo de Anexos do backend.
- **2 tools novas no MCP** (`mcp-server/src/index.ts` v1.3.0): `crm_generate_proposal`, `crm_next_proposal_number` (total 42 no fonte; **deploy vivo ainda em 35** — ver pendência).
- **Template oficial:** Google Doc no Drive (pasta `CRM-Propostas` ID `1E5nNduD2q8LaQi3v8AoNfwpyHL--zREh`, Shared Drive `0AKp-OkVlROITUk9PVA`). **Template Doc ID:** `1FgUA5RVj_kPVXzBIdLd0D75vY3tmwGV6AqKZuZLUMNw` (salvo em ScriptProperties `PROPOSAL_TEMPLATE_ID`). Fonte local: `work\CRM\template\TEMPLATE_PROPOSTA_TOPOSCAN.docx`. 11 placeholders: `{{CLIENTE}} {{CONTATO}} {{NUMERO}} {{DATA}} {{OBJETIVO}} {{AREA}} {{SERVICOS}} {{VALOR}} {{PAGAMENTO}} {{PRAZO}} {{OBS}}`.
- **Knowledge files** (`work\CRM\claude-setup\shared-files\`): `PRECIFICACAO-TOPOSCAN.md` (faixas destiladas de 74 propostas — VALIDAR com sócios), `FORMATO-PROPOSTA-TOPOSCAN.md` (anatomia do template).

## ✅ 100% LIVE (10/06/2026 tarde) — todos os portões fechados
1. ✅ **OAuth scope `documents` no GAS — AUTORIZADO** (Guilherme rodou `forceAuthProposal`). Teste E2E: `generateProposal` → Doc+PDF gerados, **11/11 placeholders preenchidos (0 sobrando)**, institucional intacto → teste apagado via `trashProposalFile`. `nextProposalNumber` determinístico (3/3 = `062026201.0`). E-mail de registro enviado aos 2 sócios (com pedido de validação da base de preços §6). **Camila operacional ponta a ponta.**
   - ⚠️ Aprendizado pro próximo: o dropdown novo do editor GAS (`jsaction`) NÃO automatiza (clique isTrusted acerta mas não commita; teclado foca mas Enter/Space não; trigger-force-auth bloqueado pela camada de segurança). Para forçar OAuth de scope novo no GAS → **clique humano** é o caminho. Cloudflare wrangler login: cuidado com o cookie banner OneTrust que trava o auto-redirect (Reject All destrava).
2. ✅ **Cloudflare login + deploy — FEITO (10/06)**. `wrangler login` completou (sessão quente após 2ª tentativa; cookie banner OneTrust bloqueava o auto-redirect → "Reject All" destravou). Deploy v1.3.0, **42 tools live** (health `tools_count:42`, Version ID `bd6a6438`). `crm_next_proposal_number` testada ponta a ponta. ⚠️ verificar determinismo do sequencial (108 vs 201).

## 🧠 Memória de auto-aprendizado (2 laços) — V7.16, 10/06
A Camila não precifica com base congelada — ela **melhora todo dia**. Dois laços girando:
- **🤖 Autônomo (GAS, roda às 6h diário no Google, mesmo PC off):** `camilaPricingLearn()` (`work\clasp-crm\Code.js`, V7.16 @51) varre o funil, pega cada proposta **Fechada/Perdida**, calcula **margem real** (`liquido = valor×0,89`; `custo` = soma `TopoPartners.valorAcordado` casando `projeto` por `numeroProposta`; `margem = liquido − custo`), e grava aprendizado **categoria `Precificacao`**. Tag `margem-baixa` se margem<15% (CONST `CAMILA_MARGEM_BAIXA_PCT`). Idempotente via `ScriptProperties` particionado por ano (`CAMILA_SEEN_2026`). Trigger registrado no `installCentralTriggers` (+ no `nomes` do uninstall). **Dia 0 já rodou: 83 aprendizados** (12 com margem real calculada, resto "custo não informado"); flagrou prejuízo real (Tour Virtual Vanessa Guimarães: custo R$4.890 vs R$3.500 = −50,7%). Action webhook: `camilaPricingLearn`.
- **🧑 Interação (prompt):** antes de precificar → `crm_get_learnings{categoria:'Precificacao'}` (calibra faixa pela realidade recente); depois do desfecho → `crm_add_learning{categoria:'Precificacao'}`. Vigilância de margem (mostra líquida ×0,89, avisa margem apertada ANTES do aceite) + sincronia de processo (via `numeroProposta`: como andou produção/pagamento/custo do último job).
- ⚠️ **Lacuna que limita a margem:** só ~27% das fechadas têm custo TopoPartners amarrado ao `numeroProposta` → pro robô calcular margem em mais casos, os custos precisam ser lançados com o nº da proposta. (faz parte do pedido de validação aos sócios.)

## Precificação — base destilada (resumo; detalhe em PRECIFICACAO-TOPOSCAN.md)
- **Não existe tabela oficial confirmada** — só âncoras: scan ~R$3,35/m², BIM ~R$6,50/m² (ambas do H&S). Maior incerteza a validar.
- Faixas por serviço: Scan to BIM (verba, típico R$35k-55k), Escaneamento 3D, Modelagem BIM, Topografia/LPC, Drone/LiDAR, Locação de obra (diária/contrato), Tour 360/Matterport (ladder oficial).
- Regra fiscal: **Líquida = Bruta × 0,89** (11% imposto). Custos por serviço ausentes → margem depende de Operação/Engenharia.
- ⚠️ **Valor da proposta ≠ valor no CRM** em vários casos (CRM grava o negociado) — sempre citar fonte/versão.
- Padrão de perda dominante: **preço + fora-PR perde pra concorrente local** (vários casos).

## ⚠️ Incidente Galeria Ramal (062026202.0) + correções — 14/06/2026
A Camila subiu a proposta com **3 anexos duplicados** e `proximoFollowup` fora do padrão (16/06 = +5; o padrão da casa é **+7 dias CORRIDOS**, "já linka com a própria data"). **Causa raiz:** (1) o `+7` **nunca foi auto-computado** no backend/frontend — era só convenção — e o prompt dela tinha a regra ERRADA (Passo 9: "+3-5 dias úteis, na observação"); (2) `linkAttachment` fazia `appendRow` sem dedup → regerar 3× empilhou 3 PDFs. Pior: a versão mais recente (16:06, 121KB) era um re-export DEGRADADO (sem capa/figuras/assinaturas) — a boa era a 15:36 (com tudo + pgto 50/50). **Travado no backend (V7.20 @57):** `agentAddLead` auto-preenche follow-up +7 (helper `_addDiasBR`); `linkAttachment` deduplica/substitui (idempotente por driveFileId; replace por nome+categoria). **Prompt atualizado:** Passos 6 (conferir capa+figuras+assinaturas; 1 anexo), 7 (follow-up +7 no campo; proposta nova = sempre addLead), 9 (re-ancora envio+7); Regras de ouro 18/19; 3 itens em "NUNCA FAZ". Learnings **APR-0167**/**APR-0168**. Erros **E039**/**E040**. ⚠️ **Re-aplicar este prompt no Project live** (Chrome MCP) — pendente; os learnings já chegam por runtime.

## Refs
- [[reference-crm-api]] · [[project-crm-toposcan]] · [[project-mcp-toposcan-crm]] · [[feedback-emails-ambos-socios]] · [[error-patterns]] (E032 — falha que retorna vazio; **E039** follow-up +7; **E040** dedup de anexo)
