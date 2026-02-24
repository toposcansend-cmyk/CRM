/**
 * CRM Sync Web App - Google Apps Script
 * 
 * DEPLOY:
 * 1. Abra https://script.google.com
 * 2. Crie novo projeto
 * 3. Cole este código
 * 4. Implantação → Nova implantação → Tipo: Aplicativo da Web
 * 5. Executar como: Eu mesmo
 * 6. Quem pode acessar: Qualquer pessoa
 * 7. Copiar URL e colar no CRM
 */

const SHEET_ID = '1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4';
const SHEET_NAME = 'Planilha1';

// Column mapping (after email column added):
// A=1, B=2, C=3, D=4, E=5 (Telefone), F=6 (Email), G=7 (Servico)...
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
    const edits = data.edits || {};
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    let updated = 0;
    
    for (const [id, edit] of Object.entries(edits)) {
      const rowIndex = edit.rowIndex;
      if (!rowIndex) continue;
      
      for (const [field, value] of Object.entries(edit)) {
        if (['id', 'rowIndex', 'empresa', '_timestamp'].includes(field)) continue;
        
        const colNum = COLUMN_MAP[field];
        if (!colNum) continue;
        
        let formattedValue = value;
        
        // Format value
        if (field === 'valor' && typeof value === 'number') {
          formattedValue = `R$${value.toLocaleString('pt-BR')}`;
        } else if (field === 'probabilidade' && typeof value === 'string' && !value.includes('%')) {
          formattedValue = `${value}%`;
        }
        
        sheet.getRange(rowIndex, colNum).setValue(formattedValue);
        updated++;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      updated: updated
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
    message: 'CRM Sync Web App is running'
  })).setMimeType(ContentService.MimeType.JSON);
}
