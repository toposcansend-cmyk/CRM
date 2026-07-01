=============================================
5. SERVICOS DA TOPOSCAN
=============================================
Servicos: Scan to BIM, Scan to CAD, LiDAR, Topografia, Locacao, Matterport, LPC, Fachada, Automotivo.

=============================================
6. METAS COMERCIAIS
=============================================
Meta Equipe: R$135.000 (Vendas), 23 propostas, 23 leads.
Guilherme: R$50k | Marcelo: R$40k | Allana: R$30k | Rafaela: R$15k.

=============================================
7. KPIs OBRIGATORIOS
=============================================
Pipeline, Forecast Ponderado, Taxa de Conversao, Ticket Medio, Ciclo de Vendas, Coverage Ratio.

=============================================
8. CADENCIA DE FOLLOW-UP
=============================================
PADRAO INICIAL (definido 14/06/2026): ao criar/enviar, o campo proximoFollowup = data da proposta (ou do envio) + 7 dias CORRIDOS. Campo proprio, nao a observacao, nao dias uteis ("ja linka com a propria data"). Backend (V7.20) auto-preenche +7 no addLead se vier vazio.
Dai em diante, cadencia por temperatura: Quente: 2-3 dias | Morno: 5-7 dias | Frio: 10-14 dias | Morto: 30+ dias.

=============================================
9. PROTOCOLO DE ESCALACAO
=============================================
Escalar se: Proposta > R$50k parada 10+ dias, Pipeline < 2x meta, Feedback negativo.

=============================================
10. FORECAST PONDERADO
=============================================
Receita Esperada = Soma (Valor x Probabilidade).

=============================================
11. ANALISE DE WIN/LOSS
=============================================
Motivos: Preco, Timing, Concorrencia, Relacionamento, Qualificacao.

=============================================
12. GESTAO DE CLIENTES ESTRATEGICOS
=============================================
Tier 1: CB Engenharia, KZEMOS.
Tier 2: Oliveira e Araujo, Carrefour, Metodo.

=============================================
13. COACHING DE VENDEDORES
=============================================
Metodo SBI: Situacao, Comportamento, Impacto.

=============================================
14. SCRIPTS DE ABORDAGEM
=============================================
Follow-up pos-proposta, Resgate de lead frio, Pedir indicacao, Negociacao de valor.

=============================================
15. REGRA MASTER — VENDA FECHADA PROPAGA (30/06/2026)
=============================================
Toda proposta status=Fechada DEVE existir em Financeiro (addPaymentPlan) + Engenharia (bulkAddProducao) + Custos (addTopoPartner; pode ser 0 se producao 100% interna). Chave: numeroProposta.
Fechar editando a celula DIRETO na planilha NAO dispara a cascata -> venda fica ORFA (sem recebivel/producao/custo), aparece so no total de "fechadas do mes".
Enforcement automatico: alerta "Venda fechada incompleta" (getActiveAlerts, Code.js V7.20) reconcilia Vendas x todas as abas POR LEITURA e lista QUAIS abas faltam. Ao ver um alerta 🟣, o gerente cria o registro que falta na sua area.
Vale para operadores manuais (Guilherme/Marcelo/Allana/Luiz Gustavo) E para os 5 gerentes IA. Doc completa: REGRA-MASTER-VENDA-FECHADA.md.
