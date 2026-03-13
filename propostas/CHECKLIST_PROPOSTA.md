# Checklist - Nova Proposta Toposcan

## Dados para Preencher

| # | Campo | Placeholder | Exemplo |
|---|-------|-------------|---------|
| 1 | Cliente | {{CLIENTE}} | Strinso |
| 2 | Contato | {{CONTATO}} | Gabriela Santana |
| 3 | Número da Proposta | {{NUMERO}} | 03/2026.27.0 |
| 4 | Data | {{DATA}} | 04 de março de 2026 |
| 5 | Resumo do Objeto | {{RESUMO_OBJETO}} | Estudo Topográfico - Natal/RN |
| 6 | Objeto Completo | {{OBJETO}} | Texto completo do objetivo |
| 7 | Área | {{AREA}} | Entorno do Aeródromo de Natal/RN |
| 8 | Serviços | {{SERVICOS}} | Lista de serviços |
| 9 | Produtos | {{PRODUTOS}} | Lista de produtos |
| 10 | Valor | {{VALOR}} | R$ 18.900,00 |
| 11 | Pagamento | {{PAGAMENTO}} | 50% entrada + 50% saldo |
| 12 | Prazo | {{PRAZO}} | 45 dias |
| 13 | Assinatura Cliente | {{ASSINATURA_CLIENTE}} | Nome do contato |

---

## Como usar

1. Preencher todos os campos acima
2. Gerar JSON com os dados
3. Rodar: `python gerar_proposta_completa.py dados.json`
4. DOCX será gerado com todos os campos substituídos

---

## Exemplo de JSON

```json
{
  "cliente": "Strinso",
  "contato": "Gabriela Santana",
  "numero": "03/2026.27.0",
  "data": "04 de março de 2026",
  "resumo_objeto": "Estudo Topográfico - Natal/RN",
  "objeto": "Executar levantamento topográfico...",
  "area": "Entorno do Aeródromo de Natal/RN (PPD) - Extensão: ~3.500 metros",
  "servicos": "1. Planimetria...",
  "produtos": "Planta Planialtimétrica DWG / PDF...",
  "valor": "R$ 18.900,00",
  "pagamento": "Entrada de 50% e saldo a negociar.",
  "prazo": "45 dias",
  "assinatura_cliente": "Gabriela Santana"
}
```
