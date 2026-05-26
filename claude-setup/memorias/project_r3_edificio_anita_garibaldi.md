---
name: project-r3-edificio-anita-garibaldi
description: "Projeto R3 Engenharia — Scan to BIM do Edifício Av. Anita Garibaldi (Curitiba/PR) — R$19k, prev. 30/06/2026"
metadata: 
  node_type: memory
  type: project
  originSessionId: a926eea7-fb25-4a3c-8866-6924b65333cb
---

# R3 Engenharia — Edifício Av. Anita Garibaldi

## Identificação
- **Proposta:** 04202648.2 (revisada da 04202648.1)
- **Data assinatura:** 22/04/2026
- **Cliente:** R3 Engenharia
- **Contato do cliente:** **Luiza Oliveira** (⚠️ NÃO é Luiza Morilhas — coincidência de nome)
- **Vendedor Toposcan:** Guilherme Becker
- **Coordenadora interna:** **Ana Lucia de Menezes Ceccon** (contrata Arthur)
- **Modelista:** **Arthur Martins de Oliveira** (terceiro contratado pela Ana, sozinho — substitui Gabriela que estava no CRM Produção)

## Escopo técnico
- **Endereço:** Av. Anita Garibaldi, 1250 — Curitiba/PR
- **Área terreno:** 1.187,94 m²
- **Área construída:** 5.664,63 m²
- **Estrutura do prédio (confirmada pelos custos):** **2 subsolos + térreo + 8 pavimentos tipo + ático**
- **Serviços contratados:**
  - Scan a laser Leica interno + apoio topográfico georreferenciado
  - Aerolevantamento georreferenciado para unificação de nuvem
  - Modelagem BIM Revit 2026: paredes, cobertura, aberturas, pontos elétrica/hidráulica, topografia do lote
- **Particularidade:** pavimentos tipo — apenas **2 andares são scaneados** (Tipo 01 e 02); os demais 6 entram por **replicação via modelagem** (decisão do escopo comercial — reduziu valor de R$21.280 para R$19.000)

## Financeiro
- **Valor:** R$ 19.000 (desconto sobre R$ 21.280)
- **Parcelas (Recebimentos):**
  - P1: R$ 9.500 PIX, venc 18/05/2026 — ⚠️ **ATRASADA** (inadimplente conforme CRM)
  - P2: R$ 9.500 PIX, venc 15/06/2026
- **Condição:** 50% entrada + 50% após entrega

## Custos (TopoPartners lançados em 21/05/2026)

| Parceiro | Serviço | Valor | Prev. Pagto |
|---|---|---:|---|
| Ana Lucia de Menezes Ceccon | Coordenação + apoio modelagem BIM | R$ 3.500 | 12/06/2026 |
| Ana Lucia | Comissão 3% sobre venda | R$ 570 | 26/05/2026 |
| Arthur Martins de Oliveira | Modelagem BIM Revit 2026 | R$ 3.000 | 12/06/2026 |
| Luiz Otávio | Serviço R3 (2 entradas) | R$ 2.000 | — |
| Nu | Serviço R3 | R$ 1.000 | — |
| Seixas | Serviço R3 | R$ 150 | — |
| **TOTAL CUSTOS** |  | **R$ 10.220** | |

## Margem
- **Venda:** R$ 19.000
- **Custos:** R$ 10.220 (54%)
- **Margem bruta:** R$ 8.780 (46%)
- **Imposto (-11%):** -R$ 2.090
- **Margem líquida:** ~R$ 6.690 (35%)
- ⚠️ **Recebido até agora:** R$ 0 (P1 inadimplente)

## Produção (estado em 25/05/2026)
| # | Fase | Resp atual no CRM | Resp real | Status | % | Início | Conclusão |
|---|------|-------------------|-----------|--------|---|--------|-----------|
| 1 | Coleta de campo | Marcelo | Marcelo | Em revisão | 80% | 22/04 | 25/04 |
| 2 | Registro/Processamento | Jean | Jean | Em andamento | 59% | 26/04 | 06/05 |
| 3 | Modelagem BIM | Gabriela Linhares | **Arthur** ⚠️ | Em andamento | 17% | 07/05 | — |
| 4 | Revisão e entrega | Guilherme | Guilherme | Não iniciado | 0% | — | — |

**Previsão de entrega final:** 30/06/2026 (entregas segmentadas durante o caminho).

## Discrepância CRM × realidade (a corrigir)
- **CRM:** Gabriela Linhares na fase Modelagem BIM
- **Real:** Arthur (terceiro contratado pela Ana)
- **Como corrigir:** `updateProducao` rowIndex=98 → responsavel: "Arthur"

## Inadimplência P1
- Parcela R$9.500 venceu 18/05/2026 — não paga
- Observação no CRM Financeiro: "R3 Retrofit P1 - inadimplente"
- Cobrança pendente

## Arquivos relacionados
- Proposta original: `C:\Users\23GAMER\Downloads\TOPOSCAN_PROPOSTA_04202648.2_Edifício Anita Garibaldi.pdf`
- Controle de produção (a criar): `C:\Users\23GAMER\Downloads\Controle_R3_Anita_Garibaldi.csv`

## Referências cruzadas
- [[user_guilherme]] — vendedor
- [[user_marcelo]] — execução de coleta
- [[learning_user_identification]] — onde Arthur e Ana foram catalogados
- [[reference_crm_api]] — actions `updateProducao`, `markPaid`, `find`
