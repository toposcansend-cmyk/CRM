# Como Publicar o Módulo Financeiro

Este guia descreve como ativar a aba **Financeiro** no CRM Toposcan.

## Visão Geral

A aba Financeiro adiciona controle de pagamentos ao CRM:
- Modal automático ao marcar proposta como **Fechada** (à vista / parcelado / entrada+saldo)
- Aba nova **💰 Financeiro** com KPIs, filtros e 3 visualizações (Lista / Kanban / Calendário)
- Marcar parcelas como pagas em 1 clique
- Detecção automática de inadimplência

## Arquitetura

- **Frontend** (`crm.html`) — já está pronto e foi publicado via GitHub Pages
- **Backend** (Google Apps Script V3.1) — precisa adicionar as novas funções financeiras

## Passos para Ativar

### 1. Abrir o projeto V3.1 do GAS

Acesse https://script.google.com e abra o projeto que contém o webhook V3.1
(o que responde na URL `AKfycbz_EE5M_grg...`).

### 2. Colar o código financeiro

Abra o arquivo `google-apps-script-financeiro.js` deste repositório.
Copie **TODO** o conteúdo e cole no FIM do projeto V3.1 (sem apagar nada do que já existe).

### 3. Registrar as novas actions no dispatcher

Procure no projeto V3.1 a função que faz o roteamento (geralmente um `switch (action)`).
Adicione os seguintes `case` antes do `default`:

```javascript
case 'addPaymentPlan':    return jsonOK(addPaymentPlan(body));
case 'listPayments':      return jsonOK(listPayments(body));
case 'updatePayment':     return jsonOK(updatePayment(body));
case 'markPaid':          return jsonOK(markPaid(body));
case 'getFinanceKPIs':    return jsonOK(getFinanceKPIs(body));
case 'ensureFinanceiro':  return jsonOK(ensureFinanceiroSheet());
```

> Observação: o nome da função que envelopa a resposta JSON pode ser `respond`, `jsonOK`, `ok`,
> etc. Use o mesmo padrão que as outras actions (`listAll`, `find`...) seguem.

### 4. Salvar e implantar

1. Salve o projeto (Ctrl+S)
2. Menu → **Implantar** → **Gerenciar implantações**
3. Selecione a implantação atual → ✏️ Editar
4. **Versão** → "Nova versão"
5. Clique em **Implantar**
6. A URL não muda — o CRM continua usando a mesma

### 5. Testar

Acesse https://toposcansend-cmyk.github.io/CRM/ e:

1. Faça login normalmente
2. Clique na nova aba **💰 Financeiro**
3. Deve aparecer "Nenhuma parcela cadastrada ainda" — isso confirma que a API respondeu OK
4. Abra qualquer proposta, mude o status para **Fechada** e salve
5. Confirme o popup "Deseja configurar o pagamento agora?"
6. Configure as parcelas e salve

### 6. Verificar no Sheets

Abra o Google Sheets (ID `1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4`) — uma nova
aba chamada **Financeiro** terá sido criada automaticamente com 14 colunas e os dados.

## Troubleshooting

- **Aba Financeiro mostra erro de carga:** o GAS V3.1 ainda não tem as funções novas — refazer passo 2/3
- **Modal de pagamento não abre:** verifique que o status novo é "Fechada" (case-sensitive)
- **`Secret invalido`:** confira a constante `FIN_SECRET` no `crm.html` e `FIN_AUTH` no GAS — devem ser idênticas (`toposcan-agent-2026`)
- **`Ja existem N parcelas`:** já tem plano de pagamento para essa proposta. O modal substitui automaticamente quando você confirma (`replace: true`)

## Estrutura de Colunas da Aba Financeiro

| Col | Campo | Tipo |
|---|---|---|
| A | `numeroProposta` | string |
| B | `cliente` | string |
| C | `vendedor` | string |
| D | `parcelaNum` | int (1, 2, 3...) |
| E | `totalParcelas` | int |
| F | `valor` | number |
| G | `formaPagamento` | PIX / Boleto / Transferência / Cartão / Cheque / Espécie / Outros |
| H | `vencimento` | DD/MM/AAAA |
| I | `dataPagamento` | DD/MM/AAAA ou vazio |
| J | `status` | Pendente / Pago / Atrasado / Cancelado |
| K | `comprovante` | string |
| L | `observacao` | string |
| M | `criadoEm` | timestamp |
| N | `atualizadoEm` | timestamp |

## Novos Usuários

A vendedora **Rafaela** foi adicionada ao sistema de login:
- Email: `rafaela@toposcan.com.br`
- Senha inicial: a mesma padrão dos demais (`toposcan2026`)
- Recomendação: trocar a senha de todos os usuários após esta implantação

Para trocar uma senha, gere o novo hash SHA-256 e atualize `AUTH_USERS` em `crm.html` (linhas 1738-1744).
