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

    if (!raw) return respond({ status: 'error', message: 'Nenhum dado recebido' }, cb);

    const data = JSON.parse(raw);
    const cb = data.callback || (e.parameter && e.parameter.callback) || null;
    if (data.token !== AUTH_TOKEN) return respond({ status: 'error', message: 'Token invalido' }, cb);

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
    }, cb);

  } catch (error) {
    Logger.log('Erro: ' + error.message);
    return respond({ status: 'error', message: error.message });
  }
}

function doGet(e) {
  const cb = e.parameter && e.parameter.callback;

  // Acao: Buscar dados (para gerar o data.js)
  if (e.parameter && e.parameter.action === 'getdata') {
    return respond({ status: 'ok', propostas: readData() }, cb);
  }

  // Se receber parametro 'data', processa a sincronizacao (chamado pelo CRM via GET)
  if (e.parameter && e.parameter.data) {
    return doPost(e);
  }

  // Health check
  return respond({ status: 'healthy', message: 'OK v5' }, cb);
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

/**
 * Le todos os dados da planilha e retorna no formato esperado pelo CRM
 * Inclui o rowIndex para cada proposta para permitir edicoes futuras.
 */
function readData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const propostas = [];

  // Mapeamento reverso do COLUMN_MAP para facilitar a montagem do objeto
  const REVERSE_MAP = {};
  for (const [key, col] of Object.entries(COLUMN_MAP)) {
    REVERSE_MAP[col] = key;
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {
      id: i, // ID sequencial para uso interno no CRM
      rowIndex: i + 1, // Indice real da linha (1-base + header)
      isLocal: false
    };

    for (let j = 0; j < row.length; j++) {
      const field = REVERSE_MAP[j + 1];
      if (field) {
        let val = row[j];
        // Tratamento basico de tipos
        if (field === 'valor' && typeof val === 'string') {
          val = parseFloat(val.replace(/[R$. ]/g, '').replace(',', '.')) || 0;
        }
        item[field] = val;
      }
    }
    // Determinar status baseado na probabilidade se vazio
    if (!item.status) {
      const prob = parseInt(item.probabilidade) || 0;
      item.status = prob === 100 ? 'Fechada' : prob === 0 ? 'Perdida' : 'Pendente';
    }
    propostas.push(item);
  }
  return propostas;
}

// Sanitizar entrada (remover SQL injection / XSS)
function sanitizar(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/<script[^>]*>.*?<\/script>/gi, '').substring(0, 1000);
}

// Suporta JSONP: se callback presente, retorna JS; senao retorna JSON
function respond(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
