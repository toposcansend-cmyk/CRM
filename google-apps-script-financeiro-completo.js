/**
 * CRM Toposcan - PACOTE COMPLETO Financeiro + Seed Historico
 * Versao 1.0 (2026-05-19)
 *
 * INSTRUCOES (3 passos):
 *
 *  PASSO 1 - Cole TODO este arquivo no FIM do projeto V3.1 em script.google.com
 *            (sem apagar nada que ja existe la).
 *
 *  PASSO 2 - Na funcao dispatcher (a que faz "switch (action)") do V3.1,
 *            adicione estes cases ANTES do "default":
 *
 *      case 'addPaymentPlan':    return jsonOK(addPaymentPlan(body));
 *      case 'listPayments':      return jsonOK(listPayments(body));
 *      case 'updatePayment':     return jsonOK(updatePayment(body));
 *      case 'markPaid':          return jsonOK(markPaid(body));
 *      case 'getFinanceKPIs':    return jsonOK(getFinanceKPIs(body));
 *      case 'ensureFinanceiro':  return jsonOK(ensureFinanceiroSheet());
 *
 *           (Use o nome de wrapper de resposta que ja existe la — pode ser respond, ok, etc.)
 *
 *  PASSO 3 - No editor do GAS, selecione a funcao "bulkSeedHistorico" no
 *            seletor (topo da tela), clique "Executar". Vai criar a aba
 *            Financeiro e inserir as 37 propostas fechadas como pagas.
 *
 *            Apos isso, Implantar > Nova versao para a API ficar publica.
 */

const FIN_SHEET_ID = '1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4';
const FIN_SHEET_NAME = 'Financeiro';
const FIN_AUTH = 'toposcan-agent-2026';

const FIN_HEADERS = [
  'numeroProposta', 'cliente', 'vendedor',
  'parcelaNum', 'totalParcelas',
  'valor', 'formaPagamento',
  'vencimento', 'dataPagamento',
  'status', 'comprovante', 'observacao',
  'criadoEm', 'atualizadoEm'
];

const FIN_COL = {
  numeroProposta: 1, cliente: 2, vendedor: 3,
  parcelaNum: 4, totalParcelas: 5,
  valor: 6, formaPagamento: 7,
  vencimento: 8, dataPagamento: 9,
  status: 10, comprovante: 11, observacao: 12,
  criadoEm: 13, atualizadoEm: 14
};

const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Transferência', 'Cartão', 'Cheque', 'Espécie', 'Outros'];

function ensureFinanceiroSheet() {
  const ss = SpreadsheetApp.openById(FIN_SHEET_ID);
  let sheet = ss.getSheetByName(FIN_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(FIN_SHEET_NAME);
    sheet.getRange(1, 1, 1, FIN_HEADERS.length).setValues([FIN_HEADERS]);
    sheet.getRange(1, 1, 1, FIN_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1f2937')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, FIN_HEADERS.length, 130);
    return { ok: true, created: true, sheet: FIN_SHEET_NAME };
  }
  return { ok: true, created: false, sheet: FIN_SHEET_NAME };
}

function _finSheet() {
  ensureFinanceiroSheet();
  return SpreadsheetApp.openById(FIN_SHEET_ID).getSheetByName(FIN_SHEET_NAME);
}

function _finAuthOK(body) {
  return body && body.secret === FIN_AUTH;
}

function _today() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy');
}

function _now() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm:ss');
}

function _parseDataBR(str) {
  if (!str) return null;
  if (str instanceof Date) return str;
  const m = String(str).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let y = parseInt(m[3]); if (y < 100) y += 2000;
  return new Date(y, parseInt(m[2]) - 1, parseInt(m[1]));
}

function _derivarStatus(row) {
  const dataPagto = row[FIN_COL.dataPagamento - 1];
  const status = row[FIN_COL.status - 1];
  if (status === 'Cancelado') return 'Cancelado';
  if (dataPagto && String(dataPagto).trim() !== '') return 'Pago';
  const venc = _parseDataBR(row[FIN_COL.vencimento - 1]);
  if (!venc) return 'Pendente';
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return venc < hoje ? 'Atrasado' : 'Pendente';
}

function _rowToObj(row, rowIndex) {
  const o = { rowIndex: rowIndex };
  FIN_HEADERS.forEach((h, i) => {
    let v = row[i];
    if (v instanceof Date) v = Utilities.formatDate(v, 'America/Sao_Paulo', 'dd/MM/yyyy');
    o[h] = v;
  });
  o.status = _derivarStatus(row);
  return o;
}

function addPaymentPlan(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.numeroProposta) return { ok: false, error: 'numeroProposta obrigatorio' };
  if (!Array.isArray(body.parcelas) || body.parcelas.length === 0)
    return { ok: false, error: 'parcelas vazias' };

  const sheet = _finSheet();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const existing = _findRowsByProposta(sheet, body.numeroProposta);
    if (existing.length > 0 && !body.replace)
      return { ok: false, error: 'Ja existem ' + existing.length + ' parcelas. Use replace:true para sobrescrever.' };

    if (body.replace && existing.length > 0) {
      const indices = existing.map(e => e.rowIndex).sort((a, b) => b - a);
      indices.forEach(i => sheet.deleteRow(i));
    }

    const total = body.parcelas.length;
    const rows = body.parcelas.map((p, i) => {
      const r = new Array(FIN_HEADERS.length).fill('');
      r[FIN_COL.numeroProposta - 1] = body.numeroProposta;
      r[FIN_COL.cliente - 1] = body.cliente || '';
      r[FIN_COL.vendedor - 1] = body.vendedor || '';
      r[FIN_COL.parcelaNum - 1] = i + 1;
      r[FIN_COL.totalParcelas - 1] = total;
      r[FIN_COL.valor - 1] = parseFloat(p.valor) || 0;
      r[FIN_COL.formaPagamento - 1] = p.formaPagamento || body.formaPagamentoPadrao || '';
      r[FIN_COL.vencimento - 1] = p.vencimento || '';
      r[FIN_COL.dataPagamento - 1] = p.dataPagamento || '';
      r[FIN_COL.status - 1] = p.dataPagamento ? 'Pago' : 'Pendente';
      r[FIN_COL.comprovante - 1] = p.comprovante || '';
      r[FIN_COL.observacao - 1] = p.observacao || '';
      r[FIN_COL.criadoEm - 1] = _now();
      r[FIN_COL.atualizadoEm - 1] = _now();
      return r;
    });

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, FIN_HEADERS.length).setValues(rows);
    return { ok: true, added: rows.length, numeroProposta: body.numeroProposta };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function _findRowsByProposta(sheet, numeroProposta) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const data = sheet.getRange(2, 1, last - 1, FIN_HEADERS.length).getValues();
  const out = [];
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(numeroProposta).trim()) {
      out.push(_rowToObj(data[i], i + 2));
    }
  }
  return out;
}

function listPayments(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _finSheet();
  const last = sheet.getLastRow();
  if (last < 2) return { ok: true, total: 0, parcelas: [] };

  const data = sheet.getRange(2, 1, last - 1, FIN_HEADERS.length).getValues();
  let parcelas = data.map((row, i) => _rowToObj(row, i + 2))
    .filter(p => p.numeroProposta && String(p.numeroProposta).trim() !== '');

  if (body.numeroProposta) {
    parcelas = parcelas.filter(p => String(p.numeroProposta).trim() === String(body.numeroProposta).trim());
  }
  if (body.vendedor) {
    parcelas = parcelas.filter(p => p.vendedor === body.vendedor);
  }
  if (body.filter && body.filter !== 'todas') {
    const f = String(body.filter).toLowerCase();
    parcelas = parcelas.filter(p => p.status.toLowerCase() === f);
  }
  if (body.fromDate) {
    const fd = _parseDataBR(body.fromDate);
    parcelas = parcelas.filter(p => { const v = _parseDataBR(p.vencimento); return v && v >= fd; });
  }
  if (body.toDate) {
    const td = _parseDataBR(body.toDate);
    parcelas = parcelas.filter(p => { const v = _parseDataBR(p.vencimento); return v && v <= td; });
  }

  return { ok: true, total: parcelas.length, parcelas: parcelas };
}

function updatePayment(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.rowIndex || body.rowIndex < 2) return { ok: false, error: 'rowIndex invalido' };
  const sheet = _finSheet();
  const fields = body.fields || {};
  let updated = 0;

  for (const [field, value] of Object.entries(fields)) {
    const col = FIN_COL[field];
    if (!col) continue;
    sheet.getRange(body.rowIndex, col).setValue(value);
    updated++;
  }

  if (updated > 0) {
    sheet.getRange(body.rowIndex, FIN_COL.atualizadoEm).setValue(_now());
    if ('dataPagamento' in fields) {
      const novoStatus = fields.dataPagamento ? 'Pago' : 'Pendente';
      sheet.getRange(body.rowIndex, FIN_COL.status).setValue(novoStatus);
    }
  }

  return { ok: true, updated: updated, rowIndex: body.rowIndex };
}

function markPaid(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.rowIndex || body.rowIndex < 2) return { ok: false, error: 'rowIndex invalido' };
  const sheet = _finSheet();
  const dataPagto = body.dataPagamento || _today();
  sheet.getRange(body.rowIndex, FIN_COL.dataPagamento).setValue(dataPagto);
  sheet.getRange(body.rowIndex, FIN_COL.status).setValue('Pago');
  sheet.getRange(body.rowIndex, FIN_COL.atualizadoEm).setValue(_now());
  if (body.comprovante) sheet.getRange(body.rowIndex, FIN_COL.comprovante).setValue(body.comprovante);
  return { ok: true, rowIndex: body.rowIndex, dataPagamento: dataPagto };
}

function getFinanceKPIs(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _finSheet();
  const last = sheet.getLastRow();
  if (last < 2) return { ok: true, kpis: _zeroKPIs() };

  const data = sheet.getRange(2, 1, last - 1, FIN_HEADERS.length).getValues();
  let parcelas = data.map((row, i) => _rowToObj(row, i + 2))
    .filter(p => p.numeroProposta && String(p.numeroProposta).trim() !== '');
  if (body.vendedor) parcelas = parcelas.filter(p => p.vendedor === body.vendedor);

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const em30 = new Date(hoje); em30.setDate(hoje.getDate() + 30);
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const proxMes = new Date(anoAtual, mesAtual + 1, 1);
  const fimProxMes = new Date(anoAtual, mesAtual + 2, 0);

  let aReceber30 = 0, recebidoMes = 0, atrasado = 0, previstoProxMes = 0;
  let porFormaPagto = {}, porStatus = { Pago: 0, Pendente: 0, Atrasado: 0, Cancelado: 0 };

  parcelas.forEach(p => {
    const v = parseFloat(p.valor) || 0;
    const venc = _parseDataBR(p.vencimento);
    const pag = _parseDataBR(p.dataPagamento);
    porStatus[p.status] = (porStatus[p.status] || 0) + 1;
    porFormaPagto[p.formaPagamento || 'Outros'] = (porFormaPagto[p.formaPagamento || 'Outros'] || 0) + v;
    if (p.status === 'Pago' && pag && pag.getMonth() === mesAtual && pag.getFullYear() === anoAtual) recebidoMes += v;
    if (p.status === 'Pendente' && venc && venc >= hoje && venc <= em30) aReceber30 += v;
    if (p.status === 'Atrasado') atrasado += v;
    if (p.status === 'Pendente' && venc && venc >= proxMes && venc <= fimProxMes) previstoProxMes += v;
  });

  return {
    ok: true,
    kpis: {
      aReceber30: aReceber30, recebidoMes: recebidoMes,
      atrasado: atrasado, previstoProxMes: previstoProxMes,
      totalParcelas: parcelas.length, porStatus: porStatus, porFormaPagto: porFormaPagto
    }
  };
}

function _zeroKPIs() {
  return {
    aReceber30: 0, recebidoMes: 0, atrasado: 0, previstoProxMes: 0,
    totalParcelas: 0, porStatus: { Pago: 0, Pendente: 0, Atrasado: 0, Cancelado: 0 },
    porFormaPagto: {}
  };
}


// ============================================================
// SEED HISTORICO - executar UMA vez no editor (Run)
// ============================================================
const SEED_HISTORICO_DATA = [
    {"numeroProposta": "1", "cliente": "Vanessa Guimarães", "vendedor": "Guilherme", "valor": 3500, "servico": "Tour Virtual", "dataServico": "27/02/2025", "vencimento": "29/03/2025", "dataPagamento": "29/03/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "06202534.0", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "28/07/2025", "vencimento": "27/08/2025", "dataPagamento": "27/08/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "6202533.0", "cliente": "Palacete do pinho", "vendedor": "Guilherme", "valor": 38000, "servico": "Scan To BIM", "dataServico": "29/08/2025", "vencimento": "28/09/2025", "dataPagamento": "28/09/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "072025.38.0", "cliente": "Cidatec", "vendedor": "Marcelo", "valor": 3800, "servico": "Voo + cadastro de Vaga", "dataServico": "20/03/2026", "vencimento": "19/04/2026", "dataPagamento": "19/04/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "08202545.0", "cliente": "Oliveira e Araujo", "vendedor": "Guilherme", "valor": 13800, "servico": "Scan Hospital", "dataServico": "20/03/2026", "vencimento": "19/04/2026", "dataPagamento": "19/04/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "08202547.0", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "11/08/2025", "vencimento": "10/09/2025", "dataPagamento": "10/09/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "08202553.0", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "25/08/2025", "vencimento": "24/09/2025", "dataPagamento": "24/09/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "09202557.0", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "08/09/2025", "vencimento": "08/10/2025", "dataPagamento": "08/10/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "09202564.2", "cliente": "UNILIVRE", "vendedor": "Guilherme", "valor": 100000, "servico": "Lidar e Modelo BIM", "dataServico": "20/01/2026", "vencimento": "19/02/2026", "dataPagamento": "19/02/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "10202569.0", "cliente": "CB Construções – 6º contrato", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "22/09/2025", "vencimento": "22/10/2025", "dataPagamento": "22/10/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "row_47", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "06/10/2025", "vencimento": "05/11/2025", "dataPagamento": "05/11/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "20/10/2025", "vencimento": "19/11/2025", "dataPagamento": "19/11/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "11202582.0", "cliente": "Six Detail", "vendedor": "Guilherme", "valor": 2600, "servico": "Scan Automotivo", "dataServico": "20/03/2026", "vencimento": "19/04/2026", "dataPagamento": "19/04/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "11202583.3", "cliente": "Construtora Fairbanks E Pilnik", "vendedor": "Guilherme", "valor": 11500, "servico": "Scan to CAD", "dataServico": "28/11/2025", "vencimento": "28/12/2025", "dataPagamento": "28/12/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "row_58", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "03/11/2025", "vencimento": "03/12/2025", "dataPagamento": "03/12/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "row_61", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "17/11/2025", "vencimento": "17/12/2025", "dataPagamento": "17/12/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "12202591.0", "cliente": "KZEMOS", "vendedor": "Guilherme", "valor": 6800, "servico": "Scan - RTC - Igreja", "dataServico": "28/12/2025", "vencimento": "27/01/2026", "dataPagamento": "27/01/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "12202592.0", "cliente": "Carrefour", "vendedor": "Marcelo", "valor": 3800, "servico": "Scan to CAD - Carrefour Cabral (lojas)", "dataServico": "09/01/2026", "vencimento": "08/02/2026", "dataPagamento": "08/02/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "row_64", "cliente": "CB Engenharia", "vendedor": "Guilherme", "valor": 12000, "servico": "Locação de Obra", "dataServico": "01/12/2025", "vencimento": "31/12/2025", "dataPagamento": "31/12/2025", "formaPagamento": "PIX"},
    {"numeroProposta": "02202610.0", "cliente": "EAC Consultoria", "vendedor": "Marcelo", "valor": 28600, "servico": "Aerolevantamento LiDAR", "dataServico": "03/02/2026", "vencimento": "05/03/2026", "dataPagamento": "05/03/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "01202606.0", "cliente": "KZEMOS", "vendedor": "Guilherme", "valor": 6500, "servico": "Scan - RTC - Igreja", "dataServico": "29/01/2026", "vencimento": "28/02/2026", "dataPagamento": "28/02/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "02202609.0", "cliente": "Tony", "vendedor": "Marcelo", "valor": 11500, "servico": "Aerolevantamento LiDAR", "dataServico": "03/02/2026", "vencimento": "05/03/2026", "dataPagamento": "05/03/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "02202611.0", "cliente": "KZEMOS", "vendedor": "Guilherme", "valor": 5200, "servico": "Scan - RTC - Igreja", "dataServico": "09/02/2026", "vencimento": "11/03/2026", "dataPagamento": "11/03/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "02202618.0", "cliente": "Dr Alexandre Wood Branco", "vendedor": "Guilherme", "valor": 5000, "servico": "Scan Fachada", "dataServico": "19/02/2026", "vencimento": "21/03/2026", "dataPagamento": "21/03/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "sem contrato", "cliente": "CB Engenharia", "vendedor": "Marcelo", "valor": 4000, "servico": "Locação de Obra", "dataServico": "05/12/2025", "vencimento": "04/01/2026", "dataPagamento": "04/01/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "132", "cliente": "Cidatec", "vendedor": "Marcelo", "valor": 20000, "servico": "Drone e LPC", "dataServico": "13/03/2026", "vencimento": "12/04/2026", "dataPagamento": "12/04/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "04202647.0", "cliente": "TENEGE", "vendedor": "Guilherme", "valor": 37000, "servico": "Scan to Bim", "dataServico": "05/05/2026", "vencimento": "04/06/2026", "dataPagamento": "04/06/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "04202648.2", "cliente": "R3 Engenharia", "vendedor": "Guilherme", "valor": 19000, "servico": "", "dataServico": "22/04/2026", "vencimento": "22/05/2026", "dataPagamento": "22/05/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "04202651.0", "cliente": "Camargo Penteado", "vendedor": "Guilherme", "valor": 5000, "servico": "Levantamento planialtimétrico", "dataServico": "16/04/2026", "vencimento": "16/05/2026", "dataPagamento": "16/05/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "", "cliente": "CB Engenharia ", "vendedor": "Marcelo", "valor": 11000, "servico": "Diarias", "dataServico": "15/03/2026", "vencimento": "14/04/2026", "dataPagamento": "14/04/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "", "cliente": "CB Engenharia ", "vendedor": "Marcelo", "valor": 11000, "servico": "Diarias", "dataServico": "15/04/2026", "vencimento": "15/05/2026", "dataPagamento": "15/05/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "04202655.0", "cliente": "Cmargo Penteado 03 PG", "vendedor": "Guilherme", "valor": 4800, "servico": "Levantamento planialtimétrico", "dataServico": "23/04/2026", "vencimento": "23/05/2026", "dataPagamento": "23/05/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "NOVO", "cliente": "Jonathan - Chinês", "vendedor": "Marcelo", "valor": 3000, "servico": "Fotografias com Drone ", "dataServico": "28/04/2026", "vencimento": "28/05/2026", "dataPagamento": "28/05/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "NOVO", "cliente": "FS - Parceria Scanner", "vendedor": "Marcelo", "valor": 6000, "servico": "Laser Scanner Georreferenciado ", "dataServico": "28/04/2026", "vencimento": "28/05/2026", "dataPagamento": "28/05/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "05202663.0", "cliente": "GEPLAN", "vendedor": "Guilherme", "valor": 4200, "servico": "Levantamento Planialtimétrico Georreferenciado", "dataServico": "07/05/2026", "vencimento": "06/06/2026", "dataPagamento": "06/06/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "05202667.0", "cliente": "Jonathan - China - Ponta Grossa-PR", "vendedor": "Marcelo", "valor": 25000, "servico": "Fotos 360 12 prédios + Fly to BIM 12 Igrejas", "dataServico": "09/05/2026", "vencimento": "08/06/2026", "dataPagamento": "08/06/2026", "formaPagamento": "PIX"},
    {"numeroProposta": "04202650.1", "cliente": "SIMEPAR", "vendedor": "Guilherme", "valor": 11200, "servico": "Lev. Topo + Locação Estacas", "dataServico": "19/05/2026", "vencimento": "18/06/2026", "dataPagamento": "18/06/2026", "formaPagamento": "PIX"}
  ];

function bulkSeedHistorico() {
  ensureFinanceiroSheet();
  const sheet = SpreadsheetApp.openById(FIN_SHEET_ID).getSheetByName(FIN_SHEET_NAME);
  const last = sheet.getLastRow();
  const existing = last >= 2 ? sheet.getRange(2, 1, last - 1, 1).getValues().flat().filter(Boolean) : [];

  let inserted = 0;
  let skipped = 0;
  const now = _now();

  const rows = [];
  SEED_HISTORICO_DATA.forEach(function(item) {
    if (existing.indexOf(item.numeroProposta) !== -1 && item.numeroProposta) {
      skipped++;
      return;
    }
    const r = new Array(FIN_HEADERS.length).fill('');
    r[FIN_COL.numeroProposta - 1] = item.numeroProposta || '';
    r[FIN_COL.cliente - 1] = item.cliente || '';
    r[FIN_COL.vendedor - 1] = item.vendedor || '';
    r[FIN_COL.parcelaNum - 1] = 1;
    r[FIN_COL.totalParcelas - 1] = 1;
    r[FIN_COL.valor - 1] = item.valor || 0;
    r[FIN_COL.formaPagamento - 1] = item.formaPagamento || 'PIX';
    r[FIN_COL.vencimento - 1] = item.vencimento || '';
    r[FIN_COL.dataPagamento - 1] = item.dataPagamento || '';
    r[FIN_COL.status - 1] = item.dataPagamento ? 'Pago' : 'Pendente';
    r[FIN_COL.comprovante - 1] = '';
    r[FIN_COL.observacao - 1] = 'Seed historico - servico: ' + (item.servico || '');
    r[FIN_COL.criadoEm - 1] = now;
    r[FIN_COL.atualizadoEm - 1] = now;
    rows.push(r);
    inserted++;
  });

  if (rows.length > 0) {
    const start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, rows.length, FIN_HEADERS.length).setValues(rows);
  }

  Logger.log('Seed concluido: ' + inserted + ' inseridos, ' + skipped + ' duplicados ignorados.');
  return { ok: true, inserted: inserted, skipped: skipped };
}
