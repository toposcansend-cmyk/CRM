/**
 * CRM Toposcan - Google Apps Script Webhook
 * Versao 3.0 - Suporta edicoes E novos leads
 *
 * COMO PUBLICAR (leva ~3 minutos):
 * 1. Acesse https://script.google.com
 * 2. Clique em "Novo projeto"
 * 3. Apague o codigo existente e cole TODO este arquivo
 * 4. Salve: Ctrl+S -> nome "CRM Toposcan Sync"
 * 5. Clique "Implantar" -> "Nova implantacao"
 * 6. Tipo: "App da Web"
 * 7. Executar como: "Eu mesmo"
 * 8. Quem pode acessar: "Qualquer pessoa"
 * 9. Clique "Implantar" -> copie a URL
 * 10. Cole a URL em crm.html na variavel WEBHOOK_URL
 */

const SHEET_ID = '1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4';
const SHEET_NAME = 'Planilha1';
const AUTH_TOKEN = 'toposcan-crm-2026-v2';

// Mapeamento de colunas (1-base, conforme planilha real)
// A=Vendedor, B=NumeroProposta, C=Cliente, D=Contato, E=Telefone,
// F=Email, G=Servico, H=FollowUp, I=(vazio), J=Localizacao,
// K=DataProposta, L=DataFechamento, M=Valor, N=Probabilidade, O=Observacao
const COLUMN_MAP = {
  'vendedor': 1,
  'numeroProposta': 2,
  'cliente': 3,
  'contato': 4,
  'telefoneEmail': 5,
  'email': 6,
  'servico': 7,
  'dataFollowup': 8,
  'ultimoFollowup': 8,
  'localizacao': 10,
  'dataProposta': 11,
  'dataFechamento': 12,
  'valor': 13,
  'probabilidade': 14,
  'observacao': 15
};

// Campos internos que nao devem ser escritos na planilha
const CAMPOS_INTERNOS = ['id', 'rowIndex', 'empresa', '_timestamp', '_criadoEm', 'isLocal', 'status'];

function doPost(e) {
  try {
    // CRM envia JSON puro com Content-Type: text/plain
    // Apps Script le em e.postData.contents
    const raw = (e.postData && e.postData.contents) ? e.postData.contents
      : (e.parameter && e.parameter.data) ? e.parameter.data
        : null;

    if (!raw) return respond({ status: 'error', message: 'Nenhum dado recebido' });

    const data = JSON.parse(raw);
    if (data.token !== AUTH_TOKEN) return respond({ status: 'error', message: 'Token invalido' });

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      // Fallback: usa a primeira aba disponível
      sheet = ss.getSheets()[0];
      Logger.log('Aba "' + SHEET_NAME + '" nao encontrada. Usando: "' + sheet.getName() + '"');
    }

    let updated = 0;
    let added = 0;

    // 1. Processar edicoes de propostas existentes
    const edits = data.edits || {};
    for (const [id, edit] of Object.entries(edits)) {
      const rowIndex = edit.rowIndex;
      if (!rowIndex || rowIndex < 2) continue;

      for (const [field, value] of Object.entries(edit)) {
        if (CAMPOS_INTERNOS.includes(field)) continue;

        const colNum = COLUMN_MAP[field];
        if (!colNum) continue;

        const formatted = formatarValor(field, value);
        sheet.getRange(rowIndex, colNum).setValue(sanitizar(formatted));
        updated++;
      }
    }

    // 2. Processar novos leads (adicionar linha nova)
    const newLeads = data.newLeads || [];
    for (const lead of newLeads) {
      const lastRow = sheet.getLastRow() + 1;
      const row = new Array(15).fill('');

      for (const [field, value] of Object.entries(lead)) {
        if (CAMPOS_INTERNOS.includes(field)) continue;
        const colNum = COLUMN_MAP[field];
        if (!colNum) continue;
        row[colNum - 1] = sanitizar(formatarValor(field, value));
      }

      sheet.getRange(lastRow, 1, 1, 15).setValues([row]);
      added++;
    }

    Logger.log('CRM Sync: ' + updated + ' campos atualizados, ' + added + ' leads novos em ' + new Date().toISOString());

    return respond({
      status: 'ok',
      updated: updated,
      added: added,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    Logger.log('Erro: ' + error.message);
    return respond({ status: 'error', message: error.message });
  }
}

function doGet(e) {
  return respond({
    status: 'healthy',
    message: 'CRM Toposcan Webhook v3.0 - OK',
    sheet: SHEET_ID
  });
}

// Formatar valor conforme o campo
function formatarValor(field, value) {
  if (field === 'valor' && typeof value === 'number') {
    return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
  if (field === 'probabilidade' && typeof value === 'string' && !value.includes('%')) {
    return value + '%';
  }
  return value !== null && value !== undefined ? String(value) : '';
}

// Sanitizar entrada (remover SQL injection / XSS)
function sanitizar(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/<script[^>]*>.*?<\/script>/gi, '').substring(0, 1000);
}

// Criar resposta JSON com CORS headers
function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
