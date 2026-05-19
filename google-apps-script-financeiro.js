/**
 * CRM Toposcan - Modulo FINANCEIRO (Apps Script)
 * Versao 1.0 - Adicao incremental sobre o GAS V3.1 existente
 *
 * COMO INSTALAR:
 * 1. Abra o projeto V3.1 em https://script.google.com (mesmo que ja roda listAll/find/update)
 * 2. COLE TODO ESTE ARQUIVO no final do projeto (apos as funcoes existentes)
 * 3. Adicione no DISPATCHER principal (a funcao que faz "switch (action)") os novos cases:
 *      case 'addPaymentPlan':  return jsonOK(addPaymentPlan(body));
 *      case 'listPayments':    return jsonOK(listPayments(body));
 *      case 'updatePayment':   return jsonOK(updatePayment(body));
 *      case 'markPaid':        return jsonOK(markPaid(body));
 *      case 'getFinanceKPIs':  return jsonOK(getFinanceKPIs(body));
 *      case 'ensureFinanceiro':return jsonOK(ensureFinanceiroSheet());
 * 4. Salve (Ctrl+S) e "Implantar > Gerenciar implantacoes > Editar" -> nova versao.
 *
 * A aba "Financeiro" e criada automaticamente na primeira chamada.
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
