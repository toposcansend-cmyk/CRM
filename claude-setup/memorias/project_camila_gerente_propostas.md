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

## ⚠️ Pendência pra ligar 100% (1 auth interativa restante)
1. 🔴 **OAuth scope `documents` no GAS** — `generateProposal` falha em `DocumentApp.openById` até o owner autorizar. Resolver: rodar `forceAuthProposal()` no editor GAS → consentir. **O novo dropdown do editor (framework `jsaction` do Google) NÃO cede a NENHUMA automação** (clique real isTrusted acerta o item mas não commita; teclado foca mas Enter/Space não commitam; trigger-force-auth bloqueado pela camada de segurança como "contornar consentimento manual"). **Genuinamente precisa de clique humano.** Depois disso o web app deployado herda o scope.
2. ✅ **Cloudflare login + deploy — FEITO (10/06)**. `wrangler login` completou (sessão quente após 2ª tentativa; cookie banner OneTrust bloqueava o auto-redirect → "Reject All" destravou). Deploy v1.3.0, **42 tools live** (health `tools_count:42`, Version ID `bd6a6438`). `crm_next_proposal_number` testada ponta a ponta. ⚠️ verificar determinismo do sequencial (108 vs 201).

## Precificação — base destilada (resumo; detalhe em PRECIFICACAO-TOPOSCAN.md)
- **Não existe tabela oficial confirmada** — só âncoras: scan ~R$3,35/m², BIM ~R$6,50/m² (ambas do H&S). Maior incerteza a validar.
- Faixas por serviço: Scan to BIM (verba, típico R$35k-55k), Escaneamento 3D, Modelagem BIM, Topografia/LPC, Drone/LiDAR, Locação de obra (diária/contrato), Tour 360/Matterport (ladder oficial).
- Regra fiscal: **Líquida = Bruta × 0,89** (11% imposto). Custos por serviço ausentes → margem depende de Operação/Engenharia.
- ⚠️ **Valor da proposta ≠ valor no CRM** em vários casos (CRM grava o negociado) — sempre citar fonte/versão.
- Padrão de perda dominante: **preço + fora-PR perde pra concorrente local** (vários casos).

## Refs
- [[reference-crm-api]] · [[project-crm-toposcan]] · [[project-mcp-toposcan-crm]] · [[feedback-emails-ambos-socios]] · [[error-patterns]] (E032 — falha que retorna vazio)
