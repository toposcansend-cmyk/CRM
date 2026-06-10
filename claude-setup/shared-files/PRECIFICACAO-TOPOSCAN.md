# PRECIFICACAO-TOPOSCAN.md — Cérebro de preços da Camila

> **Propósito:** Este é o conhecimento de precificação da **Camila**, IA gerente de Propostas da Toposcan (Claude Project). Destila o motor de preços real da empresa a partir do histórico de propostas e do funil ao vivo, para que a Camila sugira valores coerentes, com proveniência e honestidade sobre incerteza. **Não é tabela oficial** — é o padrão observado, a ser validado pelos sócios.
>
> **Data de destilação:** 10/06/2026
> **Fontes:**
> 1. 74 arquivos `.docx` de propostas reais (`Desktop\Toposcan\Propostas\` — 53 de 2025, 21 de 2026), índice completo extraído via python-docx + ~20 lidas em profundidade.
> 2. CRM ao vivo via MCP (`crm_find` por cliente, `crm_get_learnings`) — status final, valor fechado, motivo de perda.
> 3. `Guia_de_Vendas_TopoScan.pdf` (catálogo oficial de serviços + argumentos) e `regras_gestao.md` (metas).
>
> **Regra fiscal incorporada:** Toposcan paga **11% de imposto** sobre a venda → **Líquida = Bruta × 0,89**. Margem Real = Líquida − Custos.
> **Chave:** `numeroProposta` = `MMAAANNNN.V` (mês+ano+sequencial.versão).

---

## ⚠️ Leia primeiro: como ler os números desta tabela

1. **Valor da proposta ≠ valor no CRM.** Em vários casos o CRM grava o valor *negociado/revisado* (mais baixo), não o da última `.docx`. Exemplos confirmados:
   - UNILIVRE: proposta listava R$122.700 → **fechada R$100.000** (CRM).
   - Atlas Schindler: proposta R$165.700 → CRM registra R$129.960 (perdida).
   - POTENCIAL: propostas R$79.920 e R$135.320 → CRM R$135.000 (perdida "por preço").
   ➡️ Ao citar referência, **diga a fonte** (proposta-fonte ou CRM) e a versão.
2. **Versões (.0, .1, .2) quase sempre são o MESMO escopo com preço caindo** — é o rastro da negociação. A versão mais alta é o "preço de tabela mental"; a mais baixa é o "piso que aceitamos".
3. **A maioria das propostas tem valor em verba global (lump sum)**, não preço unitário. As poucas com unidade explícita (H&S R$/m², Método/Matterport ladder por m²) são as âncoras de unitário — use-as para *derivar* o lump sum, não como tabela rígida de venda.

---

## 1. Tabela de faixas por serviço

> Faixas em R$ **bruto**. "Típico" = mediana observada / valor mais recorrente. Proveniência cita nº da proposta + cliente.

| # | Serviço | Unidade de cobrança típica | Faixa observada (mín–máx) | Típico | Proveniência |
|---|---|---|---|---|---|
| 1 | **Scan to BIM** (scan 3D + modelagem BIM, pacote completo) | Verba global, derivada de m² | R$ 18.000 – R$ 350.000 | ~R$ 35.000–55.000 (prédio médio) | Lizit 02202624.0 R$18.000/2.500m² (perdida); Palácio do Pinho 06202533 R$40.960; Fábio 01202601.0 R$53.500; H&S 2026 02202612.0 R$350.000 (perdida, planta industrial 45.000m²) |
| 2 | **Escaneamento 3D / Captura de realidade** (scan TLS, nuvem de pontos, *sem* modelagem) | Verba global ou R$/m²; também **diária** | R$ 4.580 – R$ 165.700 | unit ~R$ 3,35/m² (TLS) | H&S 01202605.0 **R$ 3,35/m²** levantamento (15.820m²→R$52.997); Estaleiro Maúa 02202615.0 R$19.946 + R$8.527 (relatório planicidade); Atlas Schindler 10202579.0 R$165.700 (bundle scan+drone+modelagem+tour) |
| 3 | **Modelagem BIM** (a partir de nuvem já existente / etapa isolada) | R$/m² ou verba | R$ 6,50/m² (unit) | R$ 6,50/m² | H&S 01202605.0 **R$ 6,50/m²** modelagem (15.820m²→R$102.830; 29.708m²→R$193.102) |
| 4 | **Topografia / Levantamento Planialtimétrico Cadastral** | Verba global; por hectare em área rural | R$ 1.650 – R$ 135.320 | ~R$ 7.000–25.000 (urbano) | Arcadis 11202581.0 R$1.650 (350m², 9 poços); Imobiliária Jundiaí 07202540 R$6.880; POTENCIAL 07202541.0 R$79.920–135.320 (132 ha, perdida por preço); Projeto AMPR 08202548.0 R$1.950.000 (lote enorme, ver §6) |
| 5 | **Drone / Aerolevantamento / LiDAR** (ortofoto, MDT/MDS, nuvem aérea) | Verba global; por nº de áreas/hectare | R$ 1.800 – R$ 164.990 | ~R$ 14.000 (1 área urbana) | Jundiaí 07202540 R$1.800 (aerolev. simples); HIPARC 10202576.0 R$14.100 (até 5 áreas); Intertechne 02202613.0 R$164.990 (LiDAR aéreo, 40ha/11 áreas, perdida); UNILIVRE 09202564 LiDAR R$28.000 (aquisição) |
| 6 | **Locação de obra / Acompanhamento topográfico** (equipe+equip. em campo) | **Diária / semana / quinzena / mês** | Diária R$ 2.000–3.980; Semana R$ 7.500–10.600; Mês R$ 24.000 | Diária ~R$ 2.000; contrato CB **R$ 12.000/quinzena** | CB Engenharia (10+ aditivos) **R$ 12.000** cada (rows 6,20,27,31...); Locação 06202534.1 Semana R$7.500/Quinzena R$12.000/Mês R$24.000; Sagat 02202620.0 Semana R$10.600/Quinzena R$15.600/Mês R$24.000; Acompanhamento Pinho 07202537 **diária R$3.980**; CB diárias avulsas R$2.000/dia (row 83) |
| 7 | **Tour Virtual 360° / Matterport** | **R$/m² (ladder)** ou add-on | R$ 1.200 (≤100m²) – R$ 34.000 (≤20.000m²) | conforme ladder | **Método MPRO3 08202546.0** — tabela oficial por m² (ver §1.1); Método Vitória ES 08202549.0 R$24.800 (9.484m²) |
| 8 | **Análise de planicidade / inspeção dimensional** (entregável de engenharia sobre scan) | Verba (add-on do scan) | R$ 8.527 (1 caso) | hipótese ~25–45% do scan | Estaleiro Maúa 02202615.0 R$8.527 (sobre scan R$19.946) — **amostra n=1, hipótese** |

### 1.1 Ladder Matterport / Tour 360° por m² (âncora dura — Método MPRO3 08202546.0)

| Metragem limite | Valor | | Metragem limite | Valor |
|---|---|---|---|---|
| Até 100 m² | R$ 1.200 | | Até 4.000 m² | R$ 12.000 |
| Até 200 m² | R$ 1.600 | | Até 6.000 m² | R$ 15.000 |
| Até 400 m² | R$ 2.200 | | Até 8.000 m² | R$ 18.000 |
| Até 600 m² | R$ 2.900 | | Até 10.000 m² | R$ 21.000 |
| Até 1.000 m² | R$ 4.000 | | Até 15.000 m² | R$ 28.000 |
| Até 1.500 m² | R$ 5.500 | | Até 20.000 m² | R$ 34.000 |
| Até 2.500 m² | R$ 8.500 | | | |

> Observação: nesta proposta hospedagem do tour inclusa, deslocamento à parte, faturamento 45 dias após cada tour. O R$/m² **cai** com a escala (R$12/m² a 100m² → R$1,70/m² a 20.000m²) — economia de escala embutida.

### 1.2 Âncoras de R$/m² para Scan/BIM em área grande

| Cliente / Proposta | Área | Valor | R$/m² implícito | Escopo |
|---|---|---|---|---|
| H&S 01202605.0 | 15.820 m² | R$ 3,35 / R$ 6,50 | **3,35 (scan) + 6,50 (BIM)** | unitário explícito na proposta |
| Oliveira Araújo 09202560.0 | 90.000 m² | R$ 180.600 | ~R$ 2,01/m² | Scan to BIM Senado Federal (Anexo II + Túnel) |
| Atlas Schindler 10202579.0 | 60.000 m² | R$ 165.700 | ~R$ 2,76/m² | bundle scan+drone+modelagem+render+tour |
| Lizit 02202624.0 | 2.500 m² | R$ 18.000 | ~R$ 7,20/m² | scan + drone + topo + tour (área pequena = R$/m² alto) |

> **Padrão de escala:** R$/m² despenca com o tamanho — ~R$7/m² em 2.500m², ~R$2/m² em 90.000m². Não extrapolar linearmente.

---

## 2. Fatores de ajuste

| Fator | Direção | Sustentação | Confiança |
|---|---|---|---|
| **Escala (m²/ha)** | ↓ R$/m² conforme área cresce | Ladder Matterport + âncoras §1.2 (7→2 R$/m²) | **Alta** (dado direto) |
| **Fora do PR + concorrente local** | ↑ risco de perda (não necessariamente ↑ preço) | 3+ perdas: PJJ Malucelli (Brasília, R$249.990), Lizit (SP), padrão APR-0020/APR-0033. Atlas (Londrina) e Intertechne perdidas | **Alta** |
| **Mobilização/distância** | ↑ custo, normalmente "deslocamento à parte" | Método MPRO3: "deslocamento à parte"; várias propostas tratam acesso/logística como cláusula separada | **Média** (citado, mas não quantificado em R$) |
| **Recorrência / cliente fiel** | preço estável e previsível | CB Engenharia: 10+ contratos de locação a **R$12.000 fixo**, relação contínua | **Alta** |
| **Modelagem BIM agregada** | ↑ ~2x sobre só-scan | H&S: BIM R$6,50/m² ≈ 1,94× scan R$3,35/m² | **Alta** (1 fonte forte) |
| **Complexidade (industrial/Oil&Gas/patrimônio)** | ↑ valor | Plantas industriais (H&S R$350k, Atlas), refinaria Tenenge (R$1,14M), patrimônio (Palácio do Pinho) puxam ticket | **Média** |
| **Urgência / prazo apertado** | ↑ preço (hipótese) ou risco de perda | POTENCIAL e PJJ perdidas citaram "prazos apertados"; sem caso de prêmio de urgência cobrado | **Hipótese** |
| **Porte do cliente (procurement formal)** | ciclo longo, sensível a preço | KATRIUM/Atlas/PJJ = compradores formais, silêncio pós-proposta, perda por orçamento | **Média** |

---

## 3. Heurística de sugestão de preço (passo a passo para a Camila)

1. **Classificar o serviço** entre os 8 da §1 (pode ser combinação — ex. scan + drone + BIM + tour como bundle).
2. **Estimar o quantitativo:** m² (interno/externo), nº de pavimentos, hectares, nº de áreas/pontos, ou regime (diária/semana/mês para locação). Se faltar, **pedir ao vendedor** — m²/área é o driver nº 1.
3. **Faixa base:**
   - Matterport/Tour → ladder §1.1 direto.
   - Scan 3D isolado → R$ 3,35/m² (âncora H&S) como piso; ajustar pela escala (§1.2).
   - Modelagem BIM → R$ 6,50/m² (âncora H&S), ou ~2× o scan.
   - Topo/Drone/LPC → verba global pela faixa §1 + nº de áreas/ha.
   - Locação → regime CB R$12.000/quinzena ou diária ~R$2.000–3.980.
4. **Aplicar ajustes (§2):** escala (↓R$/m² se grande), complexidade (industrial/patrimônio ↑), modelagem agregada (↑), recorrência (manter preço do cliente fiel).
5. **Sanity check de margem:** Líquida = Bruta × 0,89. Confirmar que Líquida − custos estimados (campo + parceiros + modelagem) deixa margem sadia. Se Camila não tiver o custo, **sinalizar que precisa do custo da Operação/Engenharia** antes de garantir margem.
6. **Sanity check de mercado:** se o valor cair perto de casos perdidos "por preço" (POTENCIAL R$135k topo 132ha; H&S R$350k), alertar risco.
7. **Apresentar:** uma **faixa** (piso–teto), um **recomendado**, e a **justificativa com proveniência** ("base: H&S R$3,35/m²; ajustado pela escala de 90k m² como Oliveira Araújo a ~R$2/m²"). Para fora-PR alto valor, adicionar nota de risco (§4) e recomendar **1 ponto focal**.

---

## 4. Padrões de ganho/perda (casos reais do CRM)

**Perdas — o tema dominante é PREÇO + fora-PR/concorrente local:**
- **POTENCIAL S.A.** 07202541.0 — R$135.000 topo (132 ha, Lapa-PR) — **"Perdemos por preço"** (CRM row 15). Propostas iam de R$79.920 a R$135.320.
- **PJJ Malucelli** 03202639-0 — **R$249.990** (maior perda) — perdida para **fornecedor LOCAL de Brasília**, motivos "orçamento + prazos apertados" (APR-0020).
- **Atlas Schindler** 10202579.0 — R$129.960 (CRM; proposta R$165.700) — perdida, Londrina-PR (fora da base Curitiba).
- **Intertechne** 02202613.1 — R$164.990 — perdida, "cliente final optou por outra empresa".
- **Lizit** 02202624.0 — R$18.000 — perdida, Ribeirão Preto/SP (fora-PR).
- **ORION** 09202559.0 — R$135.600 — "cliente declinou".
- **H&S Projeto 2026** 02202612.0 — R$350.000 — perdida, "sem definição do cliente".

➡️ **Regra de ouro:** cliente fora do PR + concorrente local = ALTO risco (logística/garantia/prazo). Deals R$200k+ fora-PR exigem **UM ponto focal claro** (G ou SDR, não ambos). WhatsApp tem ~2× a taxa de resposta de email para comprador formal/procurement (APR-0053/KATRIUM).

**Ganhos:**
- **UNILIVRE** 09202564.2 — fechada **R$100.000** (lista R$122.700) — LiDAR + Modelo BIM, Guaratuba-PR (no estado). Negociou ~18% abaixo da lista.
- **CB Engenharia** — máquina de recorrência: 10+ contratos de locação a R$12.000 cada + diárias avulsas. Cliente fiel, PR, preço estável = previsibilidade. Tier 1.

---

## 5. Condições comerciais padrão (observadas em ~todas as propostas)

- **Pagamento:** **50% de entrada + 50% na entrega** (default mais comum). Para projetos de engenharia maiores: **50% entrada + 25% na entrega dos dados + 25% na entrega do produto** (POTENCIAL, Oliveira Araújo, Fábio, Estaleiro Maúa). Variantes: 40% entrada + saldo a negociar / cartão com juros do cliente (Arcadis, HIPARC). Matterport: faturamento 45 dias após cada tour.
- **Execução:** início em **7–15 dias** após aceite + entrada; campo costuma ser **2–4 dias**.
- **Prazo de entrega:** **15 dias após o levantamento** (padrão mais novo, 2026 / Lizit) a **30 dias** (padrão 2025); projetos grandes 50–60 dias.
- **Cláusula de acesso:** "problemas de operação por acesso/não-permissão tratados com o contratante" — em todas.
- **Assinaturas:** Marcelo Ramos + Guilherme Becker (Toposcan).
- **Estrutura do .docx:** Tabela 0 (A/C, nº proposta, data) · Tabela 1 ("Serviços" + "Valor"/"Valor Dia"/"qnt+Valor Total") · Tabela 2 (assinaturas) · parágrafos institucionais fixos + Área + Escopo + Condições de Pagamento.

---

## 6. Incertezas e lacunas (PRECISA de validação dos sócios)

> Este documento será enviado a Guilherme e Marcelo. Pontos que a Camila NÃO deve tratar como verdade fechada até validação:

1. **Existe tabela de R$/m² oficial por serviço?** Só temos âncoras pontuais (H&S R$3,35 scan / R$6,50 BIM; ladder Matterport). Os sócios precisam confirmar se R$3,35/R$6,50/m² é a régua atual de 2026 ou foi específico do H&S. **Maior lacuna.**
2. **Projeto AMPR 08202548.0 = R$1.950.000** — outlier 10× acima de tudo. Não está no CRM como fechado; pode ser erro de digitação na proposta (vírgula), lote de regularização fundiária gigante, ou rascunho. **Confirmar se o valor é real** antes de usar como referência (não usei na faixa de topo).
3. **Custos por serviço (campo, parceiros RTK/drone, horas de modelagem) não estão neste doc** — sem eles a Camila não fecha o sanity check de margem (×0,89 − custo) sozinha. Precisa que Operação (Fernanda) e Engenharia (Beatriz) forneçam custo médio por m²/diária. Hoje a Camila só consegue checar margem se o vendedor informar o custo.

**Top 3 outras incertezas menores:** (a) prêmio de urgência — citado em perdas mas nunca cobrado explicitamente; (b) política de desconto por versão (.0→.2) — observa-se ~18% (UNILIVRE) a negociações maiores, sem teto formal; (c) "análise de planicidade/inspeção" tem só 1 amostra (Estaleiro Maúa R$8.527) — insuficiente para faixa.

---
*Gerado por Claude Code (Opus) em 10/06/2026 — Onda 1-A. Números verificados contra proposta-fonte e CRM. Documento de trabalho, sujeito a validação dos sócios.*
