/**
 * CRM Sync Web App - Google Apps Script
 * VERSÃO SEGURA COM AUTENTICAÇÃO
 *
 * DEPLOY:
 * 1. Abra https://script.google.com
 * 2. Selecione o projeto existente OU crie novo
 * 3. Substitua TODO o código por este
 * 4. Salve e faça nova implantação
 * 5. Executar como: Eu mesmo
 * 6. Quem pode acessar: Qualquer pessoa
 */

const SHEET_ID = '1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4';
const SHEET_NAME = 'Planilha1';

// Token de autenticação - altere para um valor secreto seu!
const AUTH_TOKEN = 'toposcan-crm-2026-ALTERE-ESTE-TOKEN';

// Mapeamento de colunas (1-based, conforme planilha)
// A=Vendedor, B=N°Proposta, C=Cliente, D=Contato, E=Telefone,
// F=Email, G=Serviço, H=Follow-up, I=(vazio), J=Localização,
// K=DataProposta, L=DataFechamento, M=Valor, N=Probabilidade, O=Observação
const COLUMN_MAP = {
  'vendedor': 1,
  'numeroProposta': 2,
  'cliente': 3,
  'contato': 4,
  'telefoneEmail': 5,
  'email': 6,
  'servico': 7,
  'dataFollowup': 8,
  'localizacao': 10,
  'dataProposta': 11,
  'dataFechamento': 12,
  'valor': 13,
  'probabilidade': 14,
  'observacao': 15
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Verificar autenticação
    if (data.token !== AUTH_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Token de autenticação inválido'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const edits = data.edits || {};
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Sheet not found: ' + SHEET_NAME
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let updated = 0;

    for (const [id, edit] of Object.entries(edits)) {
      const rowIndex = edit.rowIndex;
      if (!rowIndex || rowIndex < 2) continue; // Proteger header

      for (const [field, value] of Object.entries(edit)) {
        // Pular campos internos
        if (['id', 'rowIndex', 'empresa', '_timestamp', 'status'].includes(field)) continue;

        const colNum = COLUMN_MAP[field];
        if (!colNum) continue;

        let formattedValue = value;

        // Formatar valor
        if (field === 'valor' && typeof value === 'number') {
          formattedValue = `R$${value.toLocaleString('pt-BR')}`;
        } else if (field === 'probabilidade' && typeof value === 'string' && !value.includes('%')) {
          formattedValue = `${value}%`;
        }

        // Sanitizar entrada (remover scripts e caracteres perigosos)
        if (typeof formattedValue === 'string') {
          formattedValue = formattedValue.replace(/<script[^>]*>.*?<\/script>/gi, '');
          formattedValue = formattedValue.substring(0, 500); // Limitar tamanho
        }

        sheet.getRange(rowIndex, colNum).setValue(formattedValue);
        updated++;
      }
    }

    // Log da sincronização
    Logger.log('CRM Sync: ' + updated + ' campos atualizados em ' + new Date().toISOString());

    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      updated: updated,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'healthy',
    message: 'CRM Toposcan Sync - Autenticação ativa',
    version: '2.0'
  })).setMimeType(ContentService.MimeType.JSON);
}
