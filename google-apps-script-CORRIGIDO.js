/**
 * CRM Sync Web App - VERSÃO FINAL CORRIGIDA
 * 
 * ATUALIZAR no Google Apps Script para resolver o erro de sincronização de entrada:
 * 1. Abra https://script.google.com
 * 2. Selecione o projeto "CRM Sync" ou similar
 * 3. Substitua TODO o código existente por este conteúdo abaixo
 * 4. Salve e implante como "Nova Implantação" (Tipo: App da Web)
 * 5. Garanta que o acesso seja "Qualquer pessoa"
 */

const SHEET_ID = '1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4';
const SHEET_NAME = 'Planilha1';

// Mapeamento baseado na estrutura real da planilha (16 colunas)
const COL_MAP = {
  vendedor: 1,
  numeroProposta: 2,
  cliente: 3,
  contato: 4,
  telefoneEmail: 5,
  email: 6,
  servico: 7,
  proximoFollowup: 8,
  ultimoFollowup: 9,
  localizacao: 10,
  dataProposta: 11,
  fechamentoPrevisto: 12, // Mapeado para data fechamento
  dataFechamento: 12,     // Alias
  valor: 13,
  probabilidade: 14,
  status: 15,
  observacao: 16
};

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // MODO SALVAR (Via GET/JSONP para contornar CORS)
    if (e.parameter.mode === 'save' && e.parameter.data) {
      const data = JSON.parse(decodeURIComponent(e.parameter.data));
      const edits = data.edits || {};
      let updated = 0;

      for (const [id, edit] of Object.entries(edits)) {
        let rowIndex = parseInt(edit.rowIndex);
        if (!rowIndex || rowIndex < 2) {
          // Busca por numeroProposta se rowIndex não for confiável
          const num = edit.numeroProposta;
          if (num) {
            const vals = sheet.getDataRange().getValues();
            for (let i = 1; i < vals.length; i++) {
              if (vals[i][1] == num) {
                rowIndex = i + 1;
                break;
              }
            }
          }
        }

        if (!rowIndex || rowIndex < 2) rowIndex = sheet.getLastRow() + 1;

        for (const [field, value] of Object.entries(edit)) {
          const col = COL_MAP[field];
          if (col) {
            let finalVal = value;
            if (field === 'valor' && typeof value === 'number') {
              finalVal = 'R$' + value.toLocaleString('pt-BR');
            }
            sheet.getRange(rowIndex, col).setValue(finalVal);
            updated++;
          }
        }
      }

      const output = JSON.stringify({ status: 'ok', updated: updated, message: "Salvo via JSONP" });
      if (e.parameter.callback) {
        return ContentService.createTextOutput(e.parameter.callback + '(' + output + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);
    }

    // MODO LEITURA (Padrão)
    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1);
    const propostas = rows.map((row, index) => {
      const rowIndex = index + 2;
      return {
        id: 'row_' + rowIndex,
        rowIndex: rowIndex,
        vendedor: row[0] || "",
        numeroProposta: row[1] || "",
        cliente: row[2] || "",
        contato: row[3] || "",
        telefoneEmail: row[4] || "",
        email: row[5] || "",
        servico: row[6] || "",
        proximoFollowup: row[7] || "",
        ultimoFollowup: row[8] || "",
        localizacao: row[9] || "",
        dataProposta: row[10] || "",
        fechamentoPrevisto: row[11] || "",
        valor: typeof row[12] === 'number' ? row[12] : row[12],
        probabilidade: row[13] || "",
        status: row[14] || "Lead",
        observacao: row[15] || ""
      };
    }).filter(p => p.cliente && p.cliente.toString().trim() !== "");

    const output = JSON.stringify({ status: 'ok', count: propostas.length, propostas: propostas });

    if (e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + output + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errOutput = JSON.stringify({ status: 'error', message: error.toString() });
    if (e && e.parameter && e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + errOutput + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(errOutput).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const content = e.postData.contents;
    const data = JSON.parse(content);
    const edits = data.edits || {};

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    let updated = 0;

    for (const [id, edit] of Object.entries(edits)) {
      let rowIndex = edit.rowIndex;

      // Se não tem rowIndex ou é local, tenta encontrar pelo ID ou adiciona ao fim
      if (!rowIndex || rowIndex < 2) {
        rowIndex = sheet.getLastRow() + 1;
      }

      for (const [field, value] of Object.entries(edit)) {
        const col = COL_MAP[field];
        if (col) {
          let finalVal = value;
          // Formatação especial para valor se for número
          if (field === 'valor' && typeof value === 'number') {
            finalVal = 'R$' + value.toLocaleString('pt-BR');
          }
          sheet.getRange(rowIndex, col).setValue(finalVal);
          updated++;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      updated: updated,
      message: "Planilha atualizada com sucesso"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
