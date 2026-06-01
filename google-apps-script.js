/**
 * ============================================================
 * TOPOSCAN CRM — Webhook Unificado V3.1
 * ============================================================
 * 
 * Este script UNIFICA duas funcionalidades:
 * 1. Sync do CRM Frontend (edits + newLeads) — já existente
 * 2. Ações do Agente Claude (find, update, bulkUpdate) — NOVO
 *
 * COMO PUBLICAR:
 * 1. Acesse https://script.google.com
 * 2. Crie novo projeto → cole TODO este arquivo
 * 3. Salve como "CRM Toposcan Webhook V3.1"
 * 4. Implantar → Nova implantação → App da Web
 *    - Executar como: "Eu mesmo"
 *    - Quem pode acessar: "Qualquer pessoa"
 * 5. Copie a URL gerada (termina em /exec)
 * 6. Cole a URL no CRM (variável WEBHOOK_URL) E forneça ao agente Claude
 *
 * IMPORTANTE: Se você já tem o webhook V1 rodando, faça uma
 * NOVA implantação (não edite a existente) para não quebrar nada.
 * ============================================================
 */

const SHEET_ID   = '1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4';
const SHEET_NAME = 'CRM Consolidado';
const AUTH_TOKEN  = 'toposcan-crm-2026-v2';  // Token existente do CRM frontend
const AGENT_SECRET = 'toposcan-agent-2026';  // Usado pelo agente Claude
const NUM_COLUNAS = 16; // Total de colunas na planilha (A até P)

// ============================================================
// MAPEAMENTO DE COLUNAS (1-base, conforme planilha real — 16 colunas A-P)
// A=Vendedor, B=NumeroProposta, C=Cliente, D=Contato, E=Telefone,
// F=Email, G=Servico, H=ProximoFollowUp, I=UltimoFollowUp, J=Localizacao,
// K=DataProposta, L=DataFechamento, M=Valor, N=Probabilidade,
// O=Status, P=Observação
// ============================================================
const COLUMN_MAP = {
  'vendedor': 1,
  'numeroProposta': 2,
  'cliente': 3,
  'contato': 4,
  'telefoneEmail': 5,
  'email': 6,
  'servico': 7,
  'proximoFollowup': 8,
  'ultimoFollowup': 9,
  'dataFollowup': 9,
  'localizacao': 10,
  'dataProposta': 11,
  'fechamentoPrevisto': 12,
  'dataFechamento': 12,
  'valor': 13,
  'probabilidade': 14,
  'status': 15,          // Coluna O = Status (Lead, Enviada, Pendente, Standby, Fechada, Perdida)
  'observacao': 16       // Coluna P = Observação (texto livre)
};

// Campos internos que NÃO devem ser escritos na planilha
const CAMPOS_INTERNOS = ['id', 'rowIndex', 'empresa', '_timestamp', '_criadoEm', 'isLocal'];

// ============================================================
// ENTRY POINT — doPost
// Detecta automaticamente se veio do CRM frontend ou do agente Claude
// ============================================================
function doPost(e) {
  try {
    const raw = (e.postData && e.postData.contents) ? e.postData.contents
      : (e.parameter && e.parameter.data) ? e.parameter.data
        : null;

    const cb = (e.parameter && e.parameter.callback) || null;

    if (!raw) return respond({ status: 'error', message: 'Nenhum dado recebido' }, cb);

    const data = JSON.parse(raw);

    // ─── Detectar origem: Agente Claude ou CRM Frontend ───
    // Se tem "secret" + "action" → veio do agente Claude
    if (data.secret && data.action) {
      return handleAgentRequest(data);
    }

    // Caso contrário → veio do CRM frontend (fluxo original)
    if (data.token && data.token !== AUTH_TOKEN) {
      return respond({ status: 'error', message: 'Token invalido' }, cb);
    }

    return handleCrmSync(data, cb);

  } catch (error) {
    Logger.log('Erro doPost: ' + error.message);
    return respond({ status: 'error', message: error.message });
  }
}

// ============================================================
// ENTRY POINT — doGet
// ============================================================
function doGet(e) {
  const cb = e.parameter && e.parameter.callback;

  // Health check
  if (e.parameter && e.parameter.action === 'health') {
    return respond({ status: 'healthy', message: 'CRM Webhook V3.1 ativo ✅', timestamp: new Date().toISOString() }, cb);
  }

  // Agente Claude: find via GET
  if (e.parameter && e.parameter.secret === AGENT_SECRET && e.parameter.action === 'find' && e.parameter.cliente) {
    const result = findRow(e.parameter.cliente);
    if (!result) return respond({ ok: false, error: 'Não encontrado: ' + e.parameter.cliente }, cb);
    return respond({ ok: true, result: result }, cb);
  }

  // CRM frontend: envio de dados via GET (fallback)
  if (e.parameter && e.parameter.data) {
    return doPost(e);
  }

  // Acao: Buscar dados (para gerar o data.js) - compatibilidade V1
  if (e.parameter && e.parameter.action === 'getdata') {
    return respond({ status: 'ok', propostas: readAllData() }, cb);
  }

  // Default: retorna todos os dados (puxarDadosDaNuvem do CRM)
  return respond({ status: 'ok', propostas: readAllData() }, cb);
}


// ╔═══════════════════════════════════════════════════════════╗
// ║  PARTE 1: AÇÕES DO AGENTE CLAUDE (find, update, bulk)    ║
// ╚═══════════════════════════════════════════════════════════╝

function handleAgentRequest(data) {
  // Validar senha do agente
  if (data.secret !== AGENT_SECRET) {
    return respond({ ok: false, error: 'Senha inválida' });
  }

  const action = data.action;

  if (action === 'find')       return agentFind(data);
  if (action === 'update')     return agentUpdate(data);
  if (action === 'bulkUpdate') return agentBulkUpdate(data);
  if (action === 'addLead')    return agentAddLead(data);
  if (action === 'listAll')    return agentListAll(data);

  // ─── Financeiro (V4.0) ───
  if (action === 'addPaymentPlan')   return respond(addPaymentPlan(data));
  if (action === 'listPayments')     return respond(listPayments(data));
  if (action === 'updatePayment')    return respond(updatePayment(data));
  if (action === 'markPaid')         return respond(markPaid(data));
  if (action === 'getFinanceKPIs')   return respond(getFinanceKPIs(data));
  if (action === 'ensureFinanceiro') return respond(ensureFinanceiroSheet());
  if (action === 'seedHistorico')    return respond(bulkSeedHistorico());

  // ─── TopoPartners (V5.0) ───
  if (action === 'addTopoPartner')      return respond(addTopoPartner(data));
  if (action === 'listTopoPartners')    return respond(listTopoPartners(data));
  if (action === 'updateTopoPartner')   return respond(updateTopoPartner(data));
  if (action === 'deleteTopoPartner')   return respond(deleteTopoPartner(data));
  if (action === 'getTopoPartnersKPIs') return respond(getTopoPartnersKPIs(data));
  if (action === 'ensureTopoPartners')  return respond(ensureTopoPartnersSheet());

  // ─── Engenharia / Producao (V6.0) ───
  if (action === 'addProducao')         return respond(addProducao(data));
  if (action === 'bulkAddProducao')     return respond(bulkAddProducao(data));
  if (action === 'listProducao')        return respond(listProducao(data));
  if (action === 'updateProducao')      return respond(updateProducao(data));
  if (action === 'deleteProducao')      return respond(deleteProducao(data));
  if (action === 'getProducaoKPIs')     return respond(getProducaoKPIs(data));
  if (action === 'ensureProducao')      return respond(ensureProducaoSheet());

  // ─── Central de Inteligência (V7.0) — agentes proativos + sincronia ───
  if (action === 'getDailyBriefing')    return respond(getDailyBriefing(data));
  if (action === 'getActiveAlerts')     return respond(getActiveAlerts(data));
  if (action === 'getCrossKPIs')        return respond(getCrossKPIs(data));
  if (action === 'installTriggers')     return respond(installCentralTriggers(data));
  if (action === 'uninstallTriggers')   return respond(uninstallCentralTriggers(data));
  if (action === 'getTriggersHealth')   return respond(getTriggersHealth(data));
  if (action === 'runDailyBriefNow')    return respond(_runDailyBriefingNow(data));
  if (action === 'runMondayPlanNow')    return respond(_runMondayPlanNow(data));
  if (action === 'runFridayRecapNow')   return respond(_runFridayRecapNow(data));
  if (action === 'diagEmail')           return respond(diagnosticarEmail(data));
  if (action === 'sendTestEmail')       return respond(sendTestEmail(data));

  // ─── Assistente Pessoal V7.5 (email + Meet via comando natural) ───
  if (action === 'sendEmail')           return respond(sendEmailAction(data));
  if (action === 'createMeetEvent')     return respond(createMeetEventAction(data));
  if (action === 'listMeetSuggestions') return respond(listMeetSuggestionsAction(data));
  if (action === 'listUpcomingEvents')  return respond(listUpcomingEventsAction(data));

  // ─── Fluxo de Caixa V7.8 ───
  if (action === 'getCashFlow')         return respond(getCashFlowAction(data));
  if (action === 'getCashBalance')      return respond(getCashBalanceAction(data));
  if (action === 'setCashBalance')      return respond(setCashBalanceAction(data));

  // ─── One-off: clonar template Igrejas → R3 Anita Garibaldi ───
  if (action === 'r3SetupSheet')        return r3SetupSheet(data);
  if (action === 'r3FixFormatting')     return r3FixFormatting(data);

  // ─── Aprendizados V7.12 — memoria institucional ilimitada da Rafaela ───
  if (action === 'ensureAprendizados')  return respond(ensureAprendizados());
  if (action === 'addLearning')         return respond(addLearning(data));
  if (action === 'getLearnings')        return respond(getLearnings(data));
  if (action === 'updateLearning')      return respond(updateLearning(data));
  if (action === 'deleteLearning')      return respond(deleteLearning(data));

  return respond({ ok: false, error: 'Ação desconhecida: ' + action });
}

// ─── FIND: Localizar proposta por cliente ou nº proposta ───
function agentFind(data) {
  if (!data.cliente && !data.numeroProposta) {
    return respond({ ok: false, error: 'Informe "cliente" ou "numeroProposta"' });
  }

  const searchTerm = data.cliente || data.numeroProposta;
  const results = findAllRows(searchTerm);

  if (results.length === 0) {
    return respond({ ok: false, error: 'Nenhum resultado para: ' + searchTerm });
  }

  return respond({ ok: true, total: results.length, results: results });
}

// ─── UPDATE: Atualizar campos de 1 proposta ───
function agentUpdate(data) {
  const sheet = getSheet();
  var row;

  if (data.row) {
    row = parseInt(data.row);
  } else if (data.cliente) {
    var found = findRow(data.cliente, sheet);
    if (!found) return respond({ ok: false, error: 'Cliente não encontrado: ' + data.cliente });
    row = found.row;
  } else if (data.numeroProposta) {
    var found = findRowByProposta(data.numeroProposta, sheet);
    if (!found) return respond({ ok: false, error: 'Proposta não encontrada: ' + data.numeroProposta });
    row = found.row;
  } else {
    return respond({ ok: false, error: 'Informe "row", "cliente" ou "numeroProposta"' });
  }

  var updates = data.updates || {};
  if (Object.keys(updates).length === 0) {
    return respond({ ok: false, error: 'Nenhum campo em "updates"' });
  }

  var changed = {};

  for (var field in updates) {
    if (!updates.hasOwnProperty(field)) continue;
    if (CAMPOS_INTERNOS.indexOf(field) !== -1) continue;

    var col = COLUMN_MAP[field];
    if (!col) {
      return respond({ ok: false, error: 'Campo inválido: ' + field + '. Campos válidos: ' + Object.keys(COLUMN_MAP).join(', ') });
    }

    var cell = sheet.getRange(row, col);
    var antes = cell.getValue();
    var valorFormatado = formatarValor(field, updates[field]);
    cell.setValue(sanitizar(valorFormatado));
    changed[field] = { de: String(antes), para: String(valorFormatado) };
  }

  SpreadsheetApp.flush();

  var clienteNome = sheet.getRange(row, COLUMN_MAP.cliente).getValue();

  // ─── Auto-cascata V7.0: ao virar Fechada, dispara cadeia cross-area ───
  var cascadeInfo = null;
  try {
    if (changed.status && String(changed.status.para).trim() === 'Fechada') {
      cascadeInfo = cascadeOnProposalClose(row, sheet);
    }
  } catch (e) {
    cascadeInfo = { ok: false, error: 'cascade falhou: ' + e.message };
  }

  return respond({
    ok: true,
    message: '✅ CRM atualizado com sucesso',
    row: row,
    cliente: clienteNome,
    changed: changed,
    cascade: cascadeInfo
  });
}

// ─── BULK UPDATE: Atualizar várias propostas de uma vez ───
function agentBulkUpdate(data) {
  var items = data.items || [];
  if (items.length === 0) {
    return respond({ ok: false, error: 'Nenhum item em "items"' });
  }

  var results = [];
  for (var idx = 0; idx < items.length; idx++) {
    var item = items[idx];
    item.secret = data.secret;
    try {
      var res = JSON.parse(agentUpdate(item).getContent());
      results.push(res);
    } catch (err) {
      results.push({ ok: false, error: err.message, cliente: item.cliente || item.row });
    }
  }

  var successCount = results.filter(function(r) { return r.ok; }).length;
  return respond({
    ok: true,
    message: '✅ ' + successCount + '/' + items.length + ' atualizados',
    results: results
  });
}

// ─── ADD LEAD: Adicionar nova proposta/lead ───
function agentAddLead(data) {
  var sheet = getSheet();
  var lead = data.lead || {};

  if (!lead.cliente) {
    return respond({ ok: false, error: 'Campo "cliente" é obrigatório no lead' });
  }

  // Se nenhum status foi fornecido, default = "Lead" (coluna O)
  if (!lead.status) {
    lead.status = 'Lead';
  }
  // Se nenhuma probabilidade foi fornecida, default baseado no status
  if (!lead.probabilidade) {
    var statusVal = (lead.status || 'Lead').toLowerCase();
    if (statusVal === 'lead') lead.probabilidade = '10%';
    else if (statusVal === 'enviada') lead.probabilidade = '30%';
    else if (statusVal === 'pendente') lead.probabilidade = '50%';
    else if (statusVal === 'standby') lead.probabilidade = '20%';
    else if (statusVal === 'fechada') lead.probabilidade = '100%';
    else if (statusVal === 'perdida') lead.probabilidade = '0%';
    else lead.probabilidade = '10%';
  }

  // Encontrar última linha real com dados
  var colC = sheet.getRange('C:C').getValues();
  var realLastRow = 0;
  for (var r = colC.length - 1; r >= 0; r--) {
    if (colC[r][0] && String(colC[r][0]).trim() !== '') {
      realLastRow = r + 1;
      break;
    }
  }
  var newRow = Math.max(realLastRow, 1) + 1;
  var rowData = [];
  for (var i = 0; i < NUM_COLUNAS; i++) rowData.push('');

  for (var field in lead) {
    if (!lead.hasOwnProperty(field)) continue;
    if (CAMPOS_INTERNOS.indexOf(field) !== -1) continue;
    var col = COLUMN_MAP[field];
    if (!col || col > NUM_COLUNAS) continue;
    rowData[col - 1] = sanitizar(formatarValor(field, lead[field]));
  }

  sheet.getRange(newRow, 1, 1, NUM_COLUNAS).setValues([rowData]);
  SpreadsheetApp.flush();

  // Ler a linha recém-criada para retornar dados completos
  var newRowData = sheet.getRange(newRow, 1, 1, NUM_COLUNAS).getValues()[0];
  var resultado = buildRowResult(newRowData, newRow);

  return respond({
    ok: true,
    message: '✅ Novo lead adicionado na linha ' + newRow,
    row: newRow,
    cliente: lead.cliente,
    dados: resultado
  });
}

// ─── LIST ALL: Listar todas as propostas ativas ───
function agentListAll(data) {
  var propostas = readAllData();
  var filtro = data.filtro || 'ativas';

  var filtered;
  if (filtro === 'todas') {
    filtered = propostas;
  } else if (filtro === 'fechadas') {
    filtered = propostas.filter(function(p) { return p.status === 'Fechada'; });
  } else if (filtro === 'perdidas') {
    filtered = propostas.filter(function(p) { return p.status === 'Perdida'; });
  } else {
    // ativas = tudo que não é Fechada nem Perdida
    filtered = propostas.filter(function(p) { return p.status !== 'Fechada' && p.status !== 'Perdida'; });
  }

  return respond({
    ok: true,
    total: filtered.length,
    filtro: filtro,
    propostas: filtered
  });
}


// ╔═══════════════════════════════════════════════════════════╗
// ║  PARTE 2: SYNC DO CRM FRONTEND (compatibilidade total)  ║
// ╚═══════════════════════════════════════════════════════════╝

function handleCrmSync(data, cb) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    Logger.log('Aba "' + SHEET_NAME + '" não encontrada. Usando: "' + sheet.getName() + '"');
  }

  var updated = 0;
  var added = 0;

  // 1. Processar edições de propostas existentes
  var edits = data.edits || {};
  for (var id in edits) {
    if (!edits.hasOwnProperty(id)) continue;
    var edit = edits[id];
    var rowIndex = edit.rowIndex;
    if (!rowIndex || rowIndex < 2) continue;

    for (var field in edit) {
      if (!edit.hasOwnProperty(field)) continue;
      if (CAMPOS_INTERNOS.indexOf(field) !== -1) continue;
      var colNum = COLUMN_MAP[field];
      if (!colNum) continue;
      var formatted = formatarValor(field, edit[field]);
      sheet.getRange(rowIndex, colNum).setValue(sanitizar(formatted));
      updated++;
    }
  }

  // 2. Processar novos leads
  var newLeads = data.newLeads || [];
  for (var li = 0; li < newLeads.length; li++) {
    var lead = newLeads[li];
    var colC = sheet.getRange('C:C').getValues();
    var realLastRow = 0;
    for (var r = colC.length - 1; r >= 0; r--) {
      if (colC[r][0] && String(colC[r][0]).trim() !== '') {
        realLastRow = r + 1;
        break;
      }
    }
    var lastRow = Math.max(realLastRow, 1) + 1;
    var row = [];
    for (var c = 0; c < NUM_COLUNAS; c++) row.push('');

    for (var field in lead) {
      if (!lead.hasOwnProperty(field)) continue;
      if (CAMPOS_INTERNOS.indexOf(field) !== -1) continue;
      var colNum = COLUMN_MAP[field];
      if (!colNum || colNum > NUM_COLUNAS) continue;
      row[colNum - 1] = sanitizar(formatarValor(field, lead[field]));
    }

    sheet.getRange(lastRow, 1, 1, NUM_COLUNAS).setValues([row]);
    added++;
  }

  Logger.log('CRM Sync: ' + updated + ' campos atualizados, ' + added + ' leads novos em ' + new Date().toISOString());

  return respond({
    status: 'ok',
    updated: updated,
    added: added,
    timestamp: new Date().toISOString()
  }, cb);
}


// ╔═══════════════════════════════════════════════════════════╗
// ║  PARTE 3: FUNÇÕES DE BUSCA                               ║
// ╚═══════════════════════════════════════════════════════════╝

// Busca a PRIMEIRA correspondência
function findRow(searchTerm, sheet) {
  if (!sheet) sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var term = searchTerm.toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var cliente  = String(data[i][2] || '').toLowerCase().trim();
    var proposta = String(data[i][1] || '').toLowerCase().trim();

    if (cliente.indexOf(term) !== -1 || proposta.indexOf(term) !== -1) {
      return buildRowResult(data[i], i + 1);
    }
  }
  return null;
}

// Busca por número da proposta
function findRowByProposta(searchTerm, sheet) {
  if (!sheet) sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var term = searchTerm.toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var proposta = String(data[i][1] || '').toLowerCase().trim();
    if (proposta === term || proposta.indexOf(term) !== -1) {
      return buildRowResult(data[i], i + 1);
    }
  }
  return null;
}

// Busca TODAS as correspondências (para clientes recorrentes como CB Engenharia)
function findAllRows(searchTerm, sheet) {
  if (!sheet) sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var term = searchTerm.toLowerCase().trim();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var cliente  = String(data[i][2] || '').toLowerCase().trim();
    var proposta = String(data[i][1] || '').toLowerCase().trim();
    var vendedor = String(data[i][0] || '').toLowerCase().trim();

    if (cliente.indexOf(term) !== -1 || proposta.indexOf(term) !== -1 || vendedor.indexOf(term) !== -1) {
      results.push(buildRowResult(data[i], i + 1));
    }
  }
  return results;
}

// Monta o objeto de resultado de uma linha
// row[] é 0-indexed: [0]=A(Vendedor) ... [14]=O(Status) [15]=P(Observação)
function buildRowResult(row, rowNum) {
  // Coluna O (index 14) = Status
  var statusRaw = String(row[14] || '').trim();
  var statusLower = statusRaw.toLowerCase();
  var statusValidos = ['fechada', 'pendente', 'perdida', 'lead', 'enviada', 'standby'];
  var status;

  // Coluna P (index 15) = Observação (texto livre)
  var observacaoTexto = (row.length > 15) ? String(row[15] || '').trim() : '';

  // PASSO 1: Verificar se a coluna O contém um status válido
  if (statusValidos.indexOf(statusLower) !== -1) {
    status = statusLower.charAt(0).toUpperCase() + statusLower.slice(1);
  } else {
    // PASSO 2: Coluna O tem valor não-padrão ou vazia
    // Derivar status a partir da PROBABILIDADE
    var probRaw = row[13];
    var probNum;
    if (typeof probRaw === 'number') {
      probNum = (probRaw > 0 && probRaw <= 1) ? Math.round(probRaw * 100) : Math.round(probRaw);
    } else if (typeof probRaw === 'string' && probRaw.trim() !== '') {
      probNum = parseInt(probRaw.replace('%', '').trim()) || 0;
    } else {
      probNum = -1; // Indica "sem probabilidade definida"
    }

    // Quando NÃO tem status válido E NÃO tem probabilidade → default = Lead
    if (probNum === -1 || (probNum === 0 && statusLower === '')) {
      status = 'Lead';
    } else if (probNum >= 100) {
      status = 'Fechada';
    } else if (probNum === 0) {
      status = 'Perdida';
    } else if (probNum <= 20) {
      status = 'Lead';
    } else if (probNum <= 40) {
      status = 'Enviada';
    } else {
      status = 'Pendente'; // 41-99% = Pendente
    }
  }

  // Formatar valor
  var valor = row[12];
  if (typeof valor === 'string') {
    valor = parseFloat(valor.replace(/[R$. ]/g, '').replace(',', '.')) || 0;
  } else if (typeof valor !== 'number') {
    valor = 0;
  }

  // Formatar probabilidade
  var prob = row[13];
  if (typeof prob === 'number') {
    if (prob > 0 && prob <= 1) prob = Math.round(prob * 100) + '%';
    else prob = Math.round(prob) + '%';
  } else if (typeof prob === 'string' && prob.trim() !== '') {
    if (prob.indexOf('%') === -1) prob = prob.trim() + '%';
  } else {
    prob = '';
  }

  // Formatar datas
  var dataProposta = row[10];
  var dataFechamento = row[11];
  var ultimoFollowup = row[8];
  var proximoFollowup = row[7];
  if (dataProposta instanceof Date) dataProposta = Utilities.formatDate(dataProposta, 'America/Sao_Paulo', 'dd/MM/yyyy');
  if (dataFechamento instanceof Date) dataFechamento = Utilities.formatDate(dataFechamento, 'America/Sao_Paulo', 'dd/MM/yyyy');
  if (ultimoFollowup instanceof Date) ultimoFollowup = Utilities.formatDate(ultimoFollowup, 'America/Sao_Paulo', 'dd/MM/yyyy');
  if (proximoFollowup instanceof Date) proximoFollowup = Utilities.formatDate(proximoFollowup, 'America/Sao_Paulo', 'dd/MM/yyyy');

  return {
    row: rowNum,
    vendedor: row[0] || '',
    numeroProposta: row[1] || '',
    cliente: row[2] || '',
    contato: row[3] || '',
    telefoneEmail: row[4] || '',
    email: row[5] || '',
    servico: row[6] || '',
    proximoFollowup: proximoFollowup || '',
    ultimoFollowup: ultimoFollowup || '',
    localizacao: row[9] || '',
    dataProposta: dataProposta || '',
    dataFechamento: dataFechamento || '',
    valor: valor,
    probabilidade: prob,
    status: status,
    observacao: observacaoTexto
  };
}


// ╔═══════════════════════════════════════════════════════════╗
// ║  PARTE 4: LEITURA COMPLETA (para CRM frontend)          ║
// ╚═══════════════════════════════════════════════════════════╝

function readAllData() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var propostas = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Filtrar linhas vazias
    if (!row[2] || String(row[2]).trim() === '') continue;

    var item = buildRowResult(row, i + 1);
    item.id = i;
    item.rowIndex = i + 1;
    item.isLocal = false;
    item.fechamentoPrevisto = item.dataFechamento;

    propostas.push(item);
  }
  return propostas;
}


// ╔═══════════════════════════════════════════════════════════╗
// ║  PARTE 5: UTILITÁRIOS                                    ║
// ╚═══════════════════════════════════════════════════════════╝

function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

// Formatar valor conforme o campo
function formatarValor(field, value) {
  if (field === 'valor' && typeof value === 'number') {
    return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
  if (field === 'probabilidade' && typeof value === 'string' && value.indexOf('%') === -1) {
    return value + '%';
  }
  if (field === 'probabilidade' && typeof value === 'number') {
    if (value > 0 && value <= 1) return Math.round(value * 100) + '%';
    return Math.round(value) + '%';
  }
  return value !== null && value !== undefined ? String(value) : '';
}

// Sanitizar entrada
function sanitizar(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/<script[^>]*>.*?<\/script>/gi, '').substring(0, 1000);
}

// Resposta: suporta JSONP e JSON puro
function respond(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// MODULO FINANCEIRO V4.0 - Adicionado por Claude em 2026-05-19
// ============================================================

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
    .filter(p => p.cliente && String(p.cliente).trim() !== '');

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
  // Estado ANTES (idempotencia do auto-saldo: so soma no caixa na transicao p/ Pago)
  var statusAntes = String(sheet.getRange(body.rowIndex, FIN_COL.status).getValue() || '');
  var valorParcela = Number(sheet.getRange(body.rowIndex, FIN_COL.valor).getValue()) || 0;
  var clienteParcela = String(sheet.getRange(body.rowIndex, FIN_COL.cliente).getValue() || '');
  const dataPagto = body.dataPagamento || _today();
  sheet.getRange(body.rowIndex, FIN_COL.dataPagamento).setValue(dataPagto);
  sheet.getRange(body.rowIndex, FIN_COL.status).setValue('Pago');
  sheet.getRange(body.rowIndex, FIN_COL.atualizadoEm).setValue(_now());
  if (body.comprovante) sheet.getRange(body.rowIndex, FIN_COL.comprovante).setValue(body.comprovante);
  // Auto-saldo: entrada recebida soma no caixa, 1x, em qualquer canal (site/IA). Ver E031.
  var saldoAtualizado = null;
  if (statusAntes !== 'Pago' && valorParcela > 0) {
    saldoAtualizado = _ajustaCaixa(valorParcela, 'Auto: +' + clienteParcela + ' (parcela rowIndex ' + body.rowIndex + ')');
  }
  return { ok: true, rowIndex: body.rowIndex, dataPagamento: dataPagto, saldoAtualizado: saldoAtualizado };
}

function getFinanceKPIs(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _finSheet();
  const last = sheet.getLastRow();
  if (last < 2) return { ok: true, kpis: _zeroKPIs() };

  const data = sheet.getRange(2, 1, last - 1, FIN_HEADERS.length).getValues();
  let parcelas = data.map((row, i) => _rowToObj(row, i + 2))
    .filter(p => p.cliente && String(p.cliente).trim() !== '');
  if (body.vendedor) parcelas = parcelas.filter(p => p.vendedor === body.vendedor);

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const em30 = new Date(hoje); em30.setDate(hoje.getDate() + 30);
  const em90 = new Date(hoje); em90.setDate(hoje.getDate() + 90);
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let aReceber30 = 0, recebidoMes = 0, atrasado = 0, previsto90d = 0;
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
    // Previsto 90d = TUDO pendente nos proximos 90 dias (inclui o intervalo 30d)
    if (p.status === 'Pendente' && venc && venc >= hoje && venc <= em90) previsto90d += v;
  });

  return {
    ok: true,
    kpis: {
      aReceber30: aReceber30, recebidoMes: recebidoMes,
      atrasado: atrasado, previsto90d: previsto90d,
      previstoProxMes: previsto90d, // alias para retro-compatibilidade
      totalParcelas: parcelas.length, porStatus: porStatus, porFormaPagto: porFormaPagto
    }
  };
}

function _zeroKPIs() {
  return {
    aReceber30: 0, recebidoMes: 0, atrasado: 0, previsto90d: 0, previstoProxMes: 0,
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

// ============================================================
// MODULO TOPOPARTNERS V5.0 - Adicionado por Claude em 2026-05-20
// ============================================================

const TP_SHEET_NAME = 'TopoPartners';
const TP_HEADERS = [
  'id', 'parceiro', 'servico', 'projeto', 'descricao',
  'dataOperacao', 'valorAcordado', 'valorPago', 'valorRestante',
  'previsaoPagamento', 'status', 'avaliacao', 'observacoes',
  'criadoEm', 'atualizadoEm', 'categoria'
];
const TP_COL = {
  id: 1, parceiro: 2, servico: 3, projeto: 4, descricao: 5,
  dataOperacao: 6, valorAcordado: 7, valorPago: 8, valorRestante: 9,
  previsaoPagamento: 10, status: 11, avaliacao: 12, observacoes: 13,
  criadoEm: 14, atualizadoEm: 15, categoria: 16
};
const TP_CATEGORIAS = ['Parceiro/Serviço', 'Equipamento', 'Veículo', 'Cartão de Crédito', 'Outros'];

function ensureTopoPartnersSheet() {
  const ss = SpreadsheetApp.openById(FIN_SHEET_ID);
  let sheet = ss.getSheetByName(TP_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TP_SHEET_NAME);
    sheet.getRange(1, 1, 1, TP_HEADERS.length).setValues([TP_HEADERS]);
    sheet.getRange(1, 1, 1, TP_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0f766e')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, TP_HEADERS.length, 130);
    return { ok: true, created: true, sheet: TP_SHEET_NAME };
  }
  // Migracao: se a aba existe mas faltam colunas novas (ex: 'categoria'), adiciona
  const currentCols = sheet.getLastColumn();
  if (currentCols < TP_HEADERS.length) {
    for (let i = currentCols; i < TP_HEADERS.length; i++) {
      sheet.getRange(1, i + 1).setValue(TP_HEADERS[i])
        .setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    }
  }
  return { ok: true, created: false, sheet: TP_SHEET_NAME, migrated: currentCols < TP_HEADERS.length };
}

function _tpSheet() {
  ensureTopoPartnersSheet();
  return SpreadsheetApp.openById(FIN_SHEET_ID).getSheetByName(TP_SHEET_NAME);
}

function _tpDerivarStatus(valorAcordado, valorPago) {
  const ac = parseFloat(valorAcordado) || 0;
  const pg = parseFloat(valorPago) || 0;
  if (ac === 0) return 'Pendente';
  if (pg >= ac) return 'Pago';
  if (pg > 0) return 'Parcial';
  return 'Pendente';
}

function _tpRowToObj(row, rowIndex) {
  const o = { rowIndex: rowIndex };
  TP_HEADERS.forEach((h, i) => {
    let v = row[i];
    if (v instanceof Date) v = Utilities.formatDate(v, 'America/Sao_Paulo', 'dd/MM/yyyy');
    o[h] = v;
  });
  // Derivar restante e status
  const ac = parseFloat(o.valorAcordado) || 0;
  const pg = parseFloat(o.valorPago) || 0;
  o.valorRestante = Math.max(0, ac - pg);
  o.status = _tpDerivarStatus(ac, pg);
  // Categoria default para linhas antigas (sem coluna categoria preenchida)
  if (!o.categoria || String(o.categoria).trim() === '') o.categoria = 'Parceiro/Serviço';
  return o;
}

function addTopoPartner(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.parceiro || !body.servico) return { ok: false, error: 'parceiro e servico sao obrigatorios' };

  const sheet = _tpSheet();
  const id = body.id || (Date.now() + '');
  const ac = parseFloat(body.valorAcordado) || 0;
  const pg = parseFloat(body.valorPago) || 0;
  const status = _tpDerivarStatus(ac, pg);
  const restante = Math.max(0, ac - pg);

  const row = new Array(TP_HEADERS.length).fill('');
  row[TP_COL.id - 1] = id;
  row[TP_COL.parceiro - 1] = body.parceiro || '';
  row[TP_COL.servico - 1] = body.servico || '';
  row[TP_COL.projeto - 1] = body.projeto || '';
  row[TP_COL.descricao - 1] = body.descricao || '';
  row[TP_COL.dataOperacao - 1] = body.dataOperacao || '';
  row[TP_COL.valorAcordado - 1] = ac;
  row[TP_COL.valorPago - 1] = pg;
  row[TP_COL.valorRestante - 1] = restante;
  row[TP_COL.previsaoPagamento - 1] = body.previsaoPagamento || '';
  row[TP_COL.status - 1] = status;
  row[TP_COL.avaliacao - 1] = body.avaliacao || '';
  row[TP_COL.observacoes - 1] = body.observacoes || '';
  row[TP_COL.criadoEm - 1] = _now();
  row[TP_COL.atualizadoEm - 1] = _now();
  row[TP_COL.categoria - 1] = body.categoria || 'Parceiro/Serviço';

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, 1, TP_HEADERS.length).setValues([row]);
  return { ok: true, id: id, rowIndex: startRow };
}

function listTopoPartners(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _tpSheet();
  const last = sheet.getLastRow();
  if (last < 2) return { ok: true, total: 0, items: [] };

  const data = sheet.getRange(2, 1, last - 1, TP_HEADERS.length).getValues();
  let items = data.map((row, i) => _tpRowToObj(row, i + 2))
    .filter(r => r.parceiro && String(r.parceiro).trim() !== '');

  if (body.parceiro) {
    const p = String(body.parceiro).toLowerCase();
    items = items.filter(r => String(r.parceiro).toLowerCase().includes(p));
  }
  if (body.status && body.status !== 'todos') {
    items = items.filter(r => r.status === body.status);
  }
  if (body.projeto) {
    const pj = String(body.projeto).toLowerCase();
    items = items.filter(r => String(r.projeto).toLowerCase().includes(pj));
  }
  if (body.categoria && body.categoria !== 'todas') {
    items = items.filter(r => r.categoria === body.categoria);
  }
  return { ok: true, total: items.length, items: items };
}

function updateTopoPartner(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.rowIndex || body.rowIndex < 2) return { ok: false, error: 'rowIndex invalido' };
  const sheet = _tpSheet();
  const fields = body.fields || {};
  let updated = 0;
  // valorPago ANTES — pra ajustar o caixa pelo delta efetivamente pago (auto-saldo, ver E031)
  var pagoAntes = parseFloat(sheet.getRange(body.rowIndex, TP_COL.valorPago).getValue()) || 0;

  for (const [field, value] of Object.entries(fields)) {
    const col = TP_COL[field];
    if (!col) continue;
    if (field === 'id' || field === 'criadoEm' || field === 'valorRestante' || field === 'status') continue;
    sheet.getRange(body.rowIndex, col).setValue(value);
    updated++;
  }

  // Recalcular restante e status se valores mudaram
  if ('valorAcordado' in fields || 'valorPago' in fields) {
    const ac = parseFloat(sheet.getRange(body.rowIndex, TP_COL.valorAcordado).getValue()) || 0;
    const pg = parseFloat(sheet.getRange(body.rowIndex, TP_COL.valorPago).getValue()) || 0;
    sheet.getRange(body.rowIndex, TP_COL.valorRestante).setValue(Math.max(0, ac - pg));
    sheet.getRange(body.rowIndex, TP_COL.status).setValue(_tpDerivarStatus(ac, pg));
    // Auto-saldo: custo pago sai do caixa pelo delta efetivamente pago, 1x, em qualquer canal. Ver E031.
    if ('valorPago' in fields) {
      var deltaPago = pg - pagoAntes;
      if (deltaPago !== 0) {
        var parceiroNome = String(sheet.getRange(body.rowIndex, TP_COL.parceiro).getValue() || '');
        _ajustaCaixa(-deltaPago, 'Auto: -' + parceiroNome + ' (custo rowIndex ' + body.rowIndex + ')');
      }
    }
  }

  if (updated > 0) {
    sheet.getRange(body.rowIndex, TP_COL.atualizadoEm).setValue(_now());
  }

  return { ok: true, updated: updated, rowIndex: body.rowIndex };
}

function deleteTopoPartner(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.rowIndex || body.rowIndex < 2) return { ok: false, error: 'rowIndex invalido' };
  const sheet = _tpSheet();
  sheet.deleteRow(body.rowIndex);
  return { ok: true, deleted: true };
}

function getTopoPartnersKPIs(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _tpSheet();
  const last = sheet.getLastRow();
  if (last < 2) return {
    ok: true,
    kpis: { totalAcordado: 0, totalPago: 0, totalRestante: 0, totalRegistros: 0, porStatus: { Pago: 0, Parcial: 0, Pendente: 0 }, avaliacaoMedia: 0 }
  };

  const data = sheet.getRange(2, 1, last - 1, TP_HEADERS.length).getValues();
  let items = data.map((row, i) => _tpRowToObj(row, i + 2))
    .filter(r => r.parceiro && String(r.parceiro).trim() !== '');

  let totalAcordado = 0, totalPago = 0, totalRestante = 0;
  let porStatus = { Pago: 0, Parcial: 0, Pendente: 0 };
  let porParceiro = {};
  let avaSum = 0, avaCount = 0;

  items.forEach(r => {
    const ac = parseFloat(r.valorAcordado) || 0;
    const pg = parseFloat(r.valorPago) || 0;
    totalAcordado += ac;
    totalPago += pg;
    totalRestante += Math.max(0, ac - pg);
    porStatus[r.status] = (porStatus[r.status] || 0) + 1;
    porParceiro[r.parceiro] = (porParceiro[r.parceiro] || 0) + ac;
    const av = parseFloat(r.avaliacao);
    if (!isNaN(av) && av > 0) { avaSum += av; avaCount++; }
  });

  return {
    ok: true,
    kpis: {
      totalAcordado: totalAcordado,
      totalPago: totalPago,
      totalRestante: totalRestante,
      totalRegistros: items.length,
      porStatus: porStatus,
      porParceiro: porParceiro,
      avaliacaoMedia: avaCount > 0 ? Math.round((avaSum / avaCount) * 10) / 10 : 0
    }
  };
}

// ============================================================
// MODULO ENGENHARIA / PRODUCAO V6.0 - Adicionado por Claude em 2026-05-21
// ============================================================
const PR_SHEET_NAME = 'Producao';
const PR_HEADERS = [
  'id', 'projeto', 'numeroProposta', 'subitem', 'fase',
  'responsavel', 'status', 'percentual',
  'dataInicio', 'previsaoEntrega', 'dataConclusao',
  'observacao', 'ordemSubitem', 'ordemFase',
  'criadoEm', 'atualizadoEm'
];
const PR_COL = {
  id: 1, projeto: 2, numeroProposta: 3, subitem: 4, fase: 5,
  responsavel: 6, status: 7, percentual: 8,
  dataInicio: 9, previsaoEntrega: 10, dataConclusao: 11,
  observacao: 12, ordemSubitem: 13, ordemFase: 14,
  criadoEm: 15, atualizadoEm: 16
};
const PR_STATUS_VALIDOS = ['Não iniciado', 'Em andamento', 'Em revisão', 'Concluído', 'Bloqueado', 'Retirada', 'N/A'];

function ensureProducaoSheet() {
  const ss = SpreadsheetApp.openById(FIN_SHEET_ID);
  let sheet = ss.getSheetByName(PR_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PR_SHEET_NAME);
    sheet.getRange(1, 1, 1, PR_HEADERS.length).setValues([PR_HEADERS]);
    sheet.getRange(1, 1, 1, PR_HEADERS.length)
      .setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, PR_HEADERS.length, 120);
    return { ok: true, created: true, sheet: PR_SHEET_NAME };
  }
  // Migracao automatica de colunas novas
  const currentCols = sheet.getLastColumn();
  if (currentCols < PR_HEADERS.length) {
    for (let i = currentCols; i < PR_HEADERS.length; i++) {
      sheet.getRange(1, i + 1).setValue(PR_HEADERS[i])
        .setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    }
  }
  return { ok: true, created: false, sheet: PR_SHEET_NAME };
}

function _prSheet() {
  ensureProducaoSheet();
  return SpreadsheetApp.openById(FIN_SHEET_ID).getSheetByName(PR_SHEET_NAME);
}

function _prRowToObj(row, rowIndex) {
  const o = { rowIndex: rowIndex };
  PR_HEADERS.forEach((h, i) => {
    let v = row[i];
    if (v instanceof Date) v = Utilities.formatDate(v, 'America/Sao_Paulo', 'dd/MM/yyyy');
    o[h] = v;
  });
  // Default status
  if (!o.status || String(o.status).trim() === '') o.status = 'Não iniciado';
  // Percentual: garante numero 0-100
  let pct = parseFloat(o.percentual);
  if (isNaN(pct)) pct = (o.status === 'Concluído' ? 100 : (o.status === 'Não iniciado' ? 0 : 50));
  o.percentual = Math.max(0, Math.min(100, pct));
  return o;
}

function _prMontarRow(body) {
  const row = new Array(PR_HEADERS.length).fill('');
  row[PR_COL.id - 1] = body.id || (Date.now() + Math.floor(Math.random() * 1000));
  row[PR_COL.projeto - 1] = body.projeto || '';
  row[PR_COL.numeroProposta - 1] = body.numeroProposta || '';
  row[PR_COL.subitem - 1] = body.subitem || '';
  row[PR_COL.fase - 1] = body.fase || '';
  row[PR_COL.responsavel - 1] = body.responsavel || '';
  row[PR_COL.status - 1] = body.status || 'Não iniciado';
  let pct = parseFloat(body.percentual);
  if (isNaN(pct)) {
    if (body.status === 'Concluído') pct = 100;
    else if (body.status === 'Não iniciado' || !body.status) pct = 0;
    else pct = 50;
  }
  row[PR_COL.percentual - 1] = Math.max(0, Math.min(100, pct));
  row[PR_COL.dataInicio - 1] = body.dataInicio || '';
  row[PR_COL.previsaoEntrega - 1] = body.previsaoEntrega || '';
  row[PR_COL.dataConclusao - 1] = body.dataConclusao || '';
  row[PR_COL.observacao - 1] = body.observacao || '';
  row[PR_COL.ordemSubitem - 1] = parseInt(body.ordemSubitem) || 0;
  row[PR_COL.ordemFase - 1] = parseInt(body.ordemFase) || 0;
  row[PR_COL.criadoEm - 1] = _now();
  row[PR_COL.atualizadoEm - 1] = _now();
  return row;
}

function addProducao(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.projeto && !body.numeroProposta) return { ok: false, error: 'projeto ou numeroProposta obrigatorio' };
  if (!body.fase) return { ok: false, error: 'fase obrigatorio' };
  const sheet = _prSheet();
  const row = _prMontarRow(body);
  const start = sheet.getLastRow() + 1;
  sheet.getRange(start, 1, 1, PR_HEADERS.length).setValues([row]);
  return { ok: true, id: row[PR_COL.id - 1], rowIndex: start };
}

function bulkAddProducao(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const itens = body.itens || [];
  if (!Array.isArray(itens) || itens.length === 0) return { ok: false, error: 'itens vazios' };
  const sheet = _prSheet();
  const rows = itens.map(it => _prMontarRow(it));
  const start = sheet.getLastRow() + 1;
  sheet.getRange(start, 1, rows.length, PR_HEADERS.length).setValues(rows);
  return { ok: true, inserted: rows.length, startRow: start };
}

function listProducao(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _prSheet();
  const last = sheet.getLastRow();
  if (last < 2) return { ok: true, total: 0, itens: [] };
  const data = sheet.getRange(2, 1, last - 1, PR_HEADERS.length).getValues();
  let itens = data.map((row, i) => _prRowToObj(row, i + 2))
    .filter(r => (r.projeto && String(r.projeto).trim() !== '') || (r.numeroProposta && String(r.numeroProposta).trim() !== ''));
  if (body.projeto) {
    const pj = String(body.projeto).toLowerCase();
    itens = itens.filter(r => String(r.projeto || '').toLowerCase().includes(pj));
  }
  if (body.numeroProposta) {
    itens = itens.filter(r => String(r.numeroProposta || '').trim() === String(body.numeroProposta).trim());
  }
  if (body.status && body.status !== 'todos') {
    itens = itens.filter(r => r.status === body.status);
  }
  if (body.responsavel) {
    const rs = String(body.responsavel).toLowerCase();
    itens = itens.filter(r => String(r.responsavel || '').toLowerCase().includes(rs));
  }
  return { ok: true, total: itens.length, itens: itens };
}

function updateProducao(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.rowIndex || body.rowIndex < 2) return { ok: false, error: 'rowIndex invalido' };
  const sheet = _prSheet();
  const fields = body.fields || {};
  let updated = 0;
  for (const [field, value] of Object.entries(fields)) {
    if (field === 'id' || field === 'criadoEm') continue;
    const col = PR_COL[field];
    if (!col) continue;
    sheet.getRange(body.rowIndex, col).setValue(value);
    updated++;
  }
  // Auto: se status virou Concluído, marcar % = 100 e dataConclusao = hoje (se vazia)
  if (fields.status === 'Concluído') {
    if (!('percentual' in fields)) sheet.getRange(body.rowIndex, PR_COL.percentual).setValue(100);
    const dc = sheet.getRange(body.rowIndex, PR_COL.dataConclusao).getValue();
    if (!dc || String(dc).trim() === '') sheet.getRange(body.rowIndex, PR_COL.dataConclusao).setValue(_today());
  }
  if (fields.status === 'Não iniciado' && !('percentual' in fields)) {
    sheet.getRange(body.rowIndex, PR_COL.percentual).setValue(0);
  }
  if (updated > 0) sheet.getRange(body.rowIndex, PR_COL.atualizadoEm).setValue(_now());
  return { ok: true, updated: updated, rowIndex: body.rowIndex };
}

function deleteProducao(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.rowIndex || body.rowIndex < 2) return { ok: false, error: 'rowIndex invalido' };
  const sheet = _prSheet();
  sheet.deleteRow(body.rowIndex);
  return { ok: true, deleted: true };
}

function getProducaoKPIs(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _prSheet();
  const last = sheet.getLastRow();
  const zero = { totalTarefas: 0, totalProjetos: 0, concluidas: 0, emAndamento: 0, naoIniciadas: 0, bloqueadas: 0, mediaProgressoPct: 0 };
  if (last < 2) return { ok: true, kpis: zero };
  const data = sheet.getRange(2, 1, last - 1, PR_HEADERS.length).getValues();
  const itens = data.map((row, i) => _prRowToObj(row, i + 2))
    .filter(r => (r.projeto && String(r.projeto).trim() !== '') || (r.numeroProposta && String(r.numeroProposta).trim() !== ''));
  const projetos = new Set();
  let concluidas = 0, emAndamento = 0, naoIniciadas = 0, bloqueadas = 0;
  let somaPct = 0, validasPct = 0;
  itens.forEach(r => {
    projetos.add(r.projeto || r.numeroProposta);
    if (r.status === 'Concluído') concluidas++;
    else if (r.status === 'Em andamento' || r.status === 'Em revisão') emAndamento++;
    else if (r.status === 'Bloqueado') bloqueadas++;
    else if (r.status === 'Retirada' || r.status === 'N/A') { /* nao conta */ }
    else naoIniciadas++;
    if (r.status !== 'Retirada' && r.status !== 'N/A') {
      somaPct += r.percentual; validasPct++;
    }
  });
  return {
    ok: true,
    kpis: {
      totalTarefas: itens.length,
      totalProjetos: projetos.size,
      concluidas: concluidas,
      emAndamento: emAndamento,
      naoIniciadas: naoIniciadas,
      bloqueadas: bloqueadas,
      mediaProgressoPct: validasPct > 0 ? Math.round(somaPct / validasPct) : 0
    }
  };
}

// ════════════════════════════════════════════════════════════════════
// CENTRAL DE INTELIGÊNCIA V7.0 — Agentes proativos + sincronia cross-area
// ════════════════════════════════════════════════════════════════════
//
// Modules:
//  - getDailyBriefing(body)      → snapshot consolidado para dashboard
//  - getActiveAlerts(body)       → lista de alertas cross-funcionais
//  - getCrossKPIs(body)          → métricas consolidadas (todas as áreas)
//  - cascadeOnProposalClose(row) → dispara cadeia ao fechar proposta
//  - dailyMorningBrief()         → trigger 8h, envia email com briefing
//  - detectInadimplencia()       → trigger 10h+16h, alerta cobranças
//  - weeklyStrategicReport()     → trigger seg 9h, análise estratégica
//  - installCentralTriggers()    → instala os triggers (chamada única)
//
// Email de notificação: toposcan.send@gmail.com (editar `_centralEmail()`)
// ════════════════════════════════════════════════════════════════════

function _centralEmail() {
  // Emails para receber briefings + alertas. Suporta múltiplos separados por vírgula.
  // Pode ser sobrescrito via PropertiesService.setProperty('CENTRAL_EMAIL', 'a@x.com,b@y.com')
  try {
    var custom = PropertiesService.getScriptProperties().getProperty('CENTRAL_EMAIL');
    if (custom) return custom;
  } catch (e) {}
  // Default: Guilherme (dono) + Marcelo (vendedor pleno)
  return 'guilherme@toposcan.com.br,marcelo@toposcan.com.br';
}

function _centralDateBr(d) {
  d = d || new Date();
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var yy = d.getFullYear();
  return dd + '/' + mm + '/' + yy;
}

function _centralDiasEntre(d1, d2) {
  if (!d1 || !d2) return 0;
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

function _centralBRL(n) {
  return 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Coleta dados consolidados das 4 áreas ───
function _centralColetarTudo() {
  var hoje = new Date();
  hoje.setHours(0,0,0,0);

  // 1) PROPOSTAS (CRM Consolidado)
  var crmSheet = getSheet();
  var crmData = readAllData(); // já trata
  var propostas = (crmData && crmData.rows) ? crmData.rows : [];

  // 2) FINANCEIRO
  var finSheet = _finSheet();
  var finRows = [];
  if (finSheet.getLastRow() >= 2) {
    var rawFin = finSheet.getRange(2, 1, finSheet.getLastRow() - 1, 14).getValues();
    rawFin.forEach(function(row, i) {
      if (!row[0] && !row[1]) return; // linha vazia
      var venc = _parseDataBR(row[7]);
      var dataPag = row[8] ? _parseDataBR(row[8]) : null;
      var status = _derivarStatus({ dataPagamento: row[8], vencimento: row[7] });
      finRows.push({
        rowIndex: i + 2,
        numeroProposta: String(row[0] || '').trim(),
        cliente: String(row[1] || '').trim(),
        vendedor: String(row[2] || '').trim(),
        parcelaNum: row[3], totalParcelas: row[4],
        valor: Number(row[5]) || 0,
        formaPagamento: row[6],
        vencimento: row[7], dataPagamento: row[8],
        status: status,
        diasAtraso: (status === 'Atrasado' && venc) ? _centralDiasEntre(venc, hoje) : 0
      });
    });
  }

  // 3) CUSTOS (TopoPartners)
  var tpSheet = _tpSheet();
  var tpRows = [];
  if (tpSheet.getLastRow() >= 2) {
    var rawTp = tpSheet.getRange(2, 1, tpSheet.getLastRow() - 1, 16).getValues();
    rawTp.forEach(function(row, i) {
      if (!row[1] && !row[2]) return;
      var acordado = Number(row[6]) || 0;
      var pago = Number(row[7]) || 0;
      var prev = _parseDataBR(row[9]);
      var status = _tpDerivarStatus(acordado, pago);
      tpRows.push({
        rowIndex: i + 2,
        parceiro: row[1], servico: row[2], projeto: row[3],
        dataOperacao: row[5], valorAcordado: acordado, valorPago: pago,
        valorRestante: acordado - pago,
        previsaoPagamento: row[9], status: status,
        avaliacao: row[11], categoria: row[15] || 'Outros',
        diasAtrasoPagamento: (status !== 'Pago' && prev && prev < hoje) ? _centralDiasEntre(prev, hoje) : 0
      });
    });
  }

  // 4) PRODUÇÃO
  var prSheet = _prSheet();
  var prRows = [];
  if (prSheet.getLastRow() >= 2) {
    var rawPr = prSheet.getRange(2, 1, prSheet.getLastRow() - 1, 16).getValues();
    rawPr.forEach(function(row, i) {
      if (!row[1] && !row[2]) return;
      var obj = _prRowToObj(row, i + 2);
      var prevEnt = _parseDataBR(obj.previsaoEntrega);
      obj.diasAtraso = (obj.status === 'Em andamento' || obj.status === 'Em revisão' || obj.status === 'Não iniciado')
        && prevEnt && prevEnt < hoje ? _centralDiasEntre(prevEnt, hoje) : 0;
      prRows.push(obj);
    });
  }

  return { propostas: propostas, financeiro: finRows, custos: tpRows, producao: prRows, hoje: hoje };
}

// ─── ALERTAS PROATIVOS — escaneia tudo e gera lista priorizada ───
function getActiveAlerts(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  var d = _centralColetarTudo();
  var hoje = d.hoje;
  var alertas = [];

  // ─── COMERCIAL ───
  d.propostas.forEach(function(p) {
    if (!p.status || p.status === 'Fechada' || p.status === 'Perdida') return;
    // 1) Deal travado >14d sem update
    var atualizadoEm = p.atualizadoEm ? new Date(p.atualizadoEm) : null;
    if (atualizadoEm && _centralDiasEntre(atualizadoEm, hoje) > 14) {
      alertas.push({
        area: 'Comercial', severity: 'alta',
        emoji: '🔴', tipo: 'Deal travado',
        texto: p.cliente + ' (' + (p.vendedor || '?') + ') · ' + p.status + ' há ' + _centralDiasEntre(atualizadoEm, hoje) + 'd · ' + _centralBRL(p.valorTotal),
        valor: Number(p.valorTotal) || 0,
        sugestao: 'Follow-up imediato. Se não responder em 48h, considerar como perdido.',
        relacionado: { numeroProposta: p.numeroProposta }
      });
    }
    // 2) Próximo do fechamento (>=80% e Negociação)
    if (p.status === 'Negociação' && Number(p.percentual) >= 80 && atualizadoEm && _centralDiasEntre(atualizadoEm, hoje) > 5) {
      alertas.push({
        area: 'Comercial', severity: 'media',
        emoji: '🎯', tipo: 'Pronto pra fechar',
        texto: p.cliente + ' (' + p.vendedor + ') · ' + p.percentual + '% · ' + _centralBRL(p.valorTotal),
        valor: Number(p.valorTotal) || 0,
        sugestao: 'Marcar reunião de fechamento essa semana.',
        relacionado: { numeroProposta: p.numeroProposta }
      });
    }
  });

  // ─── FINANCEIRO ───
  d.financeiro.forEach(function(f) {
    if (f.status === 'Atrasado') {
      alertas.push({
        area: 'Financeiro', severity: f.diasAtraso > 14 ? 'alta' : 'media',
        emoji: f.diasAtraso > 14 ? '🔴' : '⚠️',
        tipo: 'Inadimplência',
        texto: f.cliente + ' (' + f.vendedor + ') · parc. ' + f.parcelaNum + '/' + f.totalParcelas + ' · ' + _centralBRL(f.valor) + ' · ' + f.diasAtraso + 'd atraso',
        valor: f.valor,
        sugestao: 'Cobrar HOJE. Considerar suspender próximos serviços se >30d.',
        relacionado: { numeroProposta: f.numeroProposta, rowIndex: f.rowIndex }
      });
    }
    // Vence em 3d
    var venc = _parseDataBR(f.vencimento);
    if (f.status === 'Pendente' && venc) {
      var d3 = _centralDiasEntre(hoje, venc);
      if (d3 >= 0 && d3 <= 3) {
        alertas.push({
          area: 'Financeiro', severity: 'media',
          emoji: '🟡', tipo: 'Vence em ' + d3 + 'd',
          texto: f.cliente + ' (' + f.vendedor + ') · parc. ' + f.parcelaNum + '/' + f.totalParcelas + ' · ' + _centralBRL(f.valor) + ' · venc ' + f.vencimento,
          valor: f.valor,
          sugestao: 'Enviar lembrete amigável ao cliente.',
          relacionado: { numeroProposta: f.numeroProposta, rowIndex: f.rowIndex }
        });
      }
    }
  });

  // ─── OPERAÇÃO ───
  d.custos.forEach(function(c) {
    if (c.diasAtrasoPagamento > 0 && c.status !== 'Pago') {
      alertas.push({
        area: 'Operação', severity: c.diasAtrasoPagamento > 15 ? 'alta' : 'media',
        emoji: c.diasAtrasoPagamento > 15 ? '🔴' : '⚠️',
        tipo: 'Pagamento parceiro atrasado',
        texto: c.parceiro + ' · ' + c.servico + ' · ' + _centralBRL(c.valorRestante) + ' restantes · ' + c.diasAtrasoPagamento + 'd atraso',
        valor: c.valorRestante,
        sugestao: 'Quitar ou negociar nova data com o parceiro.',
        relacionado: { rowIndex: c.rowIndex }
      });
    }
  });

  // ─── ENGENHARIA ───
  d.producao.forEach(function(t) {
    if (t.diasAtraso > 0) {
      alertas.push({
        area: 'Engenharia', severity: t.diasAtraso > 5 ? 'alta' : 'media',
        emoji: t.diasAtraso > 5 ? '🔴' : '⚠️',
        tipo: 'Tarefa atrasada',
        texto: (t.projeto || '?') + ' · ' + (t.subitem ? t.subitem + ' / ' : '') + t.fase + ' (' + (t.responsavel || '?') + ') · prev ' + t.previsaoEntrega + ' · ' + t.diasAtraso + 'd atraso',
        valor: 0,
        sugestao: 'Realocar recurso ou renegociar prazo com cliente.',
        relacionado: { rowIndex: t.rowIndex }
      });
    }
    if (t.status === 'Bloqueado') {
      alertas.push({
        area: 'Engenharia', severity: 'alta',
        emoji: '🔴', tipo: 'Tarefa bloqueada',
        texto: (t.projeto || '?') + ' · ' + (t.subitem ? t.subitem + ' / ' : '') + t.fase + ' (' + (t.responsavel || '?') + ') · ' + (t.observacao || 'sem motivo registrado'),
        valor: 0,
        sugestao: 'Identificar dependência e desbloquear ou escalar.',
        relacionado: { rowIndex: t.rowIndex }
      });
    }
  });

  // Sobrecarga modelista (>5 Em andamento paralelas)
  var cargaPorResp = {};
  d.producao.forEach(function(t) {
    if (t.status === 'Em andamento' || t.status === 'Em revisão') {
      cargaPorResp[t.responsavel || 'sem responsável'] = (cargaPorResp[t.responsavel || 'sem responsável'] || 0) + 1;
    }
  });
  Object.keys(cargaPorResp).forEach(function(r) {
    if (cargaPorResp[r] > 5) {
      alertas.push({
        area: 'Engenharia', severity: 'media',
        emoji: '⚠️', tipo: 'Modelista sobrecarregado',
        texto: r + ' tem ' + cargaPorResp[r] + ' tarefas em paralelo',
        valor: 0,
        sugestao: 'Redistribuir parte da carga para outro modelista.',
        relacionado: {}
      });
    }
  });

  // ─── CROSS: conclusão libera parcela ───
  d.producao.forEach(function(t) {
    if (t.status === 'Concluído' && t.dataConclusao) {
      var dataConcl = _parseDataBR(t.dataConclusao);
      if (dataConcl && _centralDiasEntre(dataConcl, hoje) <= 1) {
        // Achar parcela pendente do mesmo projeto
        var parcelaLib = d.financeiro.find(function(f) { return f.numeroProposta === t.numeroProposta && f.status === 'Pendente'; });
        if (parcelaLib) {
          alertas.push({
            area: 'Cross', severity: 'media',
            emoji: '💡', tipo: 'Concluir libera parcela',
            texto: (t.projeto || t.numeroProposta) + ' · fase ' + t.fase + ' concluída · libera parc. ' + parcelaLib.parcelaNum + '/' + parcelaLib.totalParcelas + ' (' + _centralBRL(parcelaLib.valor) + ')',
            valor: parcelaLib.valor,
            sugestao: 'Validar entrega com cliente e enviar cobrança da parcela.',
            relacionado: { numeroProposta: t.numeroProposta, rowIndex: parcelaLib.rowIndex }
          });
        }
      }
    }
  });

  // Ordena por severidade (alta primeiro) depois por valor
  var ordemSev = { alta: 0, media: 1, baixa: 2 };
  alertas.sort(function(a, b) {
    var s = (ordemSev[a.severity] || 9) - (ordemSev[b.severity] || 9);
    if (s !== 0) return s;
    return (b.valor || 0) - (a.valor || 0);
  });

  return { ok: true, total: alertas.length, alertas: alertas };
}

// ─── KPIs CONSOLIDADOS (todas as áreas) ───
function getCrossKPIs(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  var d = _centralColetarTudo();
  var hoje = d.hoje;
  var inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  var fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  var em30d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30);
  var em90d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 90);

  // COMERCIAL
  var pipelineAtivo = 0, pipelinePonderado = 0, fechadasMes = 0, valorFechadoMes = 0;
  var dealsTravados = 0;
  d.propostas.forEach(function(p) {
    if (p.status === 'Fechada') {
      var dataFech = p.dataFechamento ? _parseDataBR(p.dataFechamento) : null;
      if (dataFech && dataFech >= inicioMes && dataFech <= fimMes) {
        fechadasMes++;
        valorFechadoMes += Number(p.valorTotal) || 0;
      }
    } else if (p.status !== 'Perdida') {
      var v = Number(p.valorTotal) || 0;
      var pct = Number(p.percentual) || 0;
      pipelineAtivo += v;
      pipelinePonderado += v * pct / 100;
      var atualizadoEm = p.atualizadoEm ? new Date(p.atualizadoEm) : null;
      if (atualizadoEm && _centralDiasEntre(atualizadoEm, hoje) > 14) dealsTravados++;
    }
  });

  // FINANCEIRO
  var recebidoMes = 0, aReceber30 = 0, aReceber90 = 0, atrasado = 0;
  d.financeiro.forEach(function(f) {
    if (f.status === 'Pago') {
      var dataPag = f.dataPagamento ? _parseDataBR(f.dataPagamento) : null;
      if (dataPag && dataPag >= inicioMes && dataPag <= fimMes) recebidoMes += f.valor;
    } else if (f.status === 'Atrasado') {
      atrasado += f.valor;
    } else if (f.status === 'Pendente') {
      var venc = _parseDataBR(f.vencimento);
      if (venc && venc >= hoje && venc <= em30d) aReceber30 += f.valor;
      else if (venc && venc > em30d && venc <= em90d) aReceber90 += f.valor;
    }
  });

  // OPERAÇÃO
  var custoMesTotal = 0, custoMesPendente = 0;
  d.custos.forEach(function(c) {
    var dt = _parseDataBR(c.dataOperacao);
    if (dt && dt >= inicioMes && dt <= fimMes) custoMesTotal += c.valorAcordado;
    if (c.status !== 'Pago') custoMesPendente += c.valorRestante;
  });

  // ENGENHARIA
  var projetosAtivos = {};
  var concluidasMes = 0, atrasadas = 0, bloqueadas = 0, emAndamento = 0;
  d.producao.forEach(function(t) {
    if (t.projeto) projetosAtivos[t.projeto] = (projetosAtivos[t.projeto] || 0) + 1;
    if (t.status === 'Concluído') {
      var dataConcl = t.dataConclusao ? _parseDataBR(t.dataConclusao) : null;
      if (dataConcl && dataConcl >= inicioMes && dataConcl <= fimMes) concluidasMes++;
    } else if (t.status === 'Em andamento' || t.status === 'Em revisão') {
      emAndamento++;
      if (t.diasAtraso > 0) atrasadas++;
    } else if (t.status === 'Bloqueado') bloqueadas++;
  });

  // SAÚDE GERAL (score 0-100)
  var saude = 100;
  if (atrasado > 0) saude -= Math.min(20, atrasado / 1000);
  if (dealsTravados > 0) saude -= dealsTravados * 2;
  if (bloqueadas > 0) saude -= bloqueadas * 3;
  if (atrasadas > 0) saude -= atrasadas * 2;
  saude = Math.max(0, Math.round(saude));

  // MARGEM REAL DO MÊS
  var liquidoMes = valorFechadoMes * 0.89;
  var margemRealMes = liquidoMes - custoMesTotal;

  return {
    ok: true,
    kpis: {
      data: _centralDateBr(hoje),
      saude: saude,
      comercial: {
        pipelineAtivo: pipelineAtivo,
        pipelinePonderado: Math.round(pipelinePonderado),
        fechadasMes: fechadasMes,
        valorFechadoMes: valorFechadoMes,
        dealsTravados: dealsTravados
      },
      financeiro: {
        recebidoMes: recebidoMes,
        aReceber30: aReceber30,
        aReceber90: aReceber90,
        atrasado: atrasado
      },
      operacao: {
        custoMesTotal: custoMesTotal,
        custoMesPendente: custoMesPendente
      },
      engenharia: {
        projetosAtivos: Object.keys(projetosAtivos).length,
        emAndamento: emAndamento,
        concluidasMes: concluidasMes,
        atrasadas: atrasadas,
        bloqueadas: bloqueadas
      },
      margem: {
        valorFechadoMes: valorFechadoMes,
        impostoEstimado: Math.round(valorFechadoMes * 0.11),
        liquidoMes: Math.round(liquidoMes),
        custoMesTotal: Math.round(custoMesTotal),
        margemRealMes: Math.round(margemRealMes),
        margemPct: valorFechadoMes > 0 ? Math.round(margemRealMes / valorFechadoMes * 100) : 0
      }
    }
  };
}

// ─── DAILY BRIEFING — texto pronto para email/dashboard ───
function getDailyBriefing(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  var kpis = getCrossKPIs(body).kpis;
  var alertas = getActiveAlerts(body).alertas;
  var top5 = alertas.slice(0, 5);

  var partes = [];
  partes.push('🌅 BRIEFING TOPOSCAN — ' + kpis.data);
  partes.push('');
  partes.push('💚 Saúde geral: ' + kpis.saude + '/100');
  partes.push('');
  partes.push('═══ COMERCIAL ═══');
  partes.push('  Pipeline ativo: ' + _centralBRL(kpis.comercial.pipelineAtivo) + ' (ponderado: ' + _centralBRL(kpis.comercial.pipelinePonderado) + ')');
  partes.push('  Fechadas no mês: ' + kpis.comercial.fechadasMes + ' deals · ' + _centralBRL(kpis.comercial.valorFechadoMes));
  if (kpis.comercial.dealsTravados > 0) partes.push('  ⚠️ Deals travados >14d: ' + kpis.comercial.dealsTravados);
  partes.push('');
  partes.push('═══ FINANCEIRO ═══');
  partes.push('  Recebido no mês: ' + _centralBRL(kpis.financeiro.recebidoMes));
  partes.push('  A receber 30d: ' + _centralBRL(kpis.financeiro.aReceber30) + ' · 90d: ' + _centralBRL(kpis.financeiro.aReceber90));
  if (kpis.financeiro.atrasado > 0) partes.push('  🔴 Inadimplência: ' + _centralBRL(kpis.financeiro.atrasado));
  partes.push('');
  partes.push('═══ OPERAÇÃO ═══');
  partes.push('  Custo do mês: ' + _centralBRL(kpis.operacao.custoMesTotal));
  partes.push('  Pendente p/ pagar: ' + _centralBRL(kpis.operacao.custoMesPendente));
  partes.push('');
  partes.push('═══ ENGENHARIA ═══');
  partes.push('  Projetos ativos: ' + kpis.engenharia.projetosAtivos + ' · em andamento: ' + kpis.engenharia.emAndamento);
  partes.push('  Concluídas no mês: ' + kpis.engenharia.concluidasMes);
  if (kpis.engenharia.atrasadas > 0) partes.push('  ⚠️ Tarefas atrasadas: ' + kpis.engenharia.atrasadas);
  if (kpis.engenharia.bloqueadas > 0) partes.push('  🔴 Tarefas bloqueadas: ' + kpis.engenharia.bloqueadas);
  partes.push('');
  partes.push('═══ MARGEM REAL DO MÊS ═══');
  partes.push('  Venda bruta: ' + _centralBRL(kpis.margem.valorFechadoMes) + ' · Imposto 11%: -' + _centralBRL(kpis.margem.impostoEstimado));
  partes.push('  Líquido: ' + _centralBRL(kpis.margem.liquidoMes) + ' · Custo: -' + _centralBRL(kpis.margem.custoMesTotal));
  partes.push('  💰 MARGEM REAL: ' + _centralBRL(kpis.margem.margemRealMes) + ' (' + kpis.margem.margemPct + '%)');
  partes.push('');
  if (top5.length > 0) {
    partes.push('═══ TOP 5 ALERTAS PRIORITÁRIOS ═══');
    top5.forEach(function(a, i) {
      partes.push((i+1) + '. ' + a.emoji + ' [' + a.area + '] ' + a.tipo + ' — ' + a.texto);
      partes.push('   💡 ' + a.sugestao);
    });
    partes.push('');
  }
  partes.push('Total de alertas ativos: ' + alertas.length);
  partes.push('CRM: https://toposcansend-cmyk.github.io/CRM/');

  return { ok: true, texto: partes.join('\n'), kpis: kpis, totalAlertas: alertas.length, top5: top5 };
}

// ─── CASCATA: ao virar Fechada, dispara avisos cross-area ───
function cascadeOnProposalClose(rowIndex, crmSheet) {
  crmSheet = crmSheet || getSheet();
  var row = crmSheet.getRange(rowIndex, 1, 1, 16).getValues()[0];
  var numeroProposta = String(row[0] || '').trim();
  var cliente = String(row[2] || '').trim();
  var vendedor = String(row[3] || '').trim();
  var servico = String(row[4] || '').trim();
  var valor = Number(row[6]) || 0;

  // Registra observação automática
  var obs = String(row[12] || '');
  var stamp = '\n[V7 Auto-cascata ' + _centralDateBr() + '] Proposta fechada. Próximos passos: Financeiro (cadastrar parcelas), Engenharia (criar produção), Operação (definir parceiros se necessário).';
  if (obs.indexOf('[V7 Auto-cascata') === -1) {
    crmSheet.getRange(rowIndex, 13).setValue(obs + stamp);
  }

  // Envia email (best-effort)
  var emailBody = '';
  try {
    emailBody = '🎉 PROPOSTA FECHADA — ' + cliente + ' (' + numeroProposta + ')\n\n' +
                'Vendedor: ' + vendedor + '\n' +
                'Serviço: ' + servico + '\n' +
                'Valor: ' + _centralBRL(valor) + '\n\n' +
                'PRÓXIMOS PASSOS:\n' +
                '💰 FINANCEIRO: cadastrar plano de parcelas no CRM\n' +
                '🛠️ ENGENHARIA: criar matriz de produção (template + prazo)\n' +
                '💼 OPERAÇÃO: confirmar parceiros/recursos necessários\n\n' +
                'Margem real esperada (líquida 89%): ' + _centralBRL(valor * 0.89) + '\n' +
                'Abrir no CRM: https://toposcansend-cmyk.github.io/CRM/';
    MailApp.sendEmail({
      to: _centralEmail(),
      subject: '🎉 Fechou! ' + cliente + ' · ' + _centralBRL(valor),
      body: emailBody
    });
  } catch (e) {
    // ignora
  }

  return {
    ok: true,
    numeroProposta: numeroProposta,
    cliente: cliente,
    valor: valor,
    proximoPassos: [
      '💰 Financeiro: cadastrar plano de parcelas',
      '🛠️ Engenharia: criar matriz de produção',
      '💼 Operação: confirmar parceiros'
    ],
    emailEnviado: emailBody !== ''
  };
}

// ─── ROTINAS DE TRIGGER (chamadas pelo Google a cada X horas) ───

// Instrumentação: grava timestamp + status de cada execução de trigger no PropertiesService
function _recordTriggerRun(name, status, errorMsg) {
  try {
    var props = PropertiesService.getScriptProperties();
    var record = {
      lastRun: new Date().toISOString(),
      status: status || 'ok',
      error: errorMsg || null
    };
    props.setProperty('TRIGGER_RUN_' + name, JSON.stringify(record));
  } catch (e) {
    Logger.log('Falha ao gravar trigger run de ' + name + ': ' + e.message);
  }
}

function dailyMorningBrief() {
  var dummy = { secret: AGENT_SECRET };
  var brief = getDailyBriefing(dummy);
  try {
    MailApp.sendEmail({
      to: _centralEmail(),
      subject: '☀️ Briefing Toposcan — ' + _centralDateBr(),
      body: brief.texto + '\n\n— Enviado automaticamente pela Central de Inteligência V7.0'
    });
    _recordTriggerRun('dailyMorningBrief', 'ok');
  } catch (e) {
    Logger.log('Erro briefing: ' + e.message);
    _recordTriggerRun('dailyMorningBrief', 'error', e.message);
  }
}

function detectInadimplencia() {
  var dummy = { secret: AGENT_SECRET };
  var alertas = getActiveAlerts(dummy).alertas;
  var financ = alertas.filter(function(a) { return a.area === 'Financeiro' && (a.tipo === 'Inadimplência' || a.tipo.indexOf('Vence') === 0); });
  if (financ.length === 0) {
    _recordTriggerRun('detectInadimplencia', 'ok-no-alerts');
    return;
  }

  var corpo = '🔔 ALERTA FINANCEIRO — ' + _centralDateBr() + '\n\n' +
              financ.length + ' parcelas merecem atenção:\n\n';
  financ.forEach(function(a, i) {
    corpo += (i+1) + '. ' + a.emoji + ' ' + a.tipo + ' — ' + a.texto + '\n   💡 ' + a.sugestao + '\n\n';
  });
  corpo += 'Abrir Financeiro: https://toposcansend-cmyk.github.io/CRM/#financeiro';

  try {
    MailApp.sendEmail({
      to: _centralEmail(),
      subject: '🔔 ' + financ.length + ' alertas financeiros — ' + _centralDateBr(),
      body: corpo
    });
    _recordTriggerRun('detectInadimplencia', 'ok');
  } catch (e) {
    Logger.log('Erro inadimplencia: ' + e.message);
    _recordTriggerRun('detectInadimplencia', 'error', e.message);
  }
}

function weeklyStrategicReport() {
  // [DEPRECATED em V7.7] - substituído por mondayPlanningBrief + fridayWeekRecap
  // Mantido pra retrocompat — não há trigger ativo chamando.
  var dummy = { secret: AGENT_SECRET };
  var brief = getDailyBriefing(dummy);
  try {
    MailApp.sendEmail({
      to: _centralEmail(),
      subject: '📊 Relatório Semanal Toposcan — ' + _centralDateBr(),
      body: '📊 RELATÓRIO ESTRATÉGICO SEMANAL\n\n' + brief.texto +
            '\n\n— Central de Inteligência V7.0'
    });
    _recordTriggerRun('weeklyStrategicReport', 'ok');
  } catch (e) {
    Logger.log('Erro semanal: ' + e.message);
    _recordTriggerRun('weeklyStrategicReport', 'error', e.message);
  }
}

// ─── V7.7: SEGUNDA 9h — PLANO DA SEMANA (priorizado por valor) ───
function mondayPlanningBrief() {
  var dummy = { secret: AGENT_SECRET };
  var kpis = getCrossKPIs(dummy).kpis;
  var alertas = getActiveAlerts(dummy).alertas;
  var top10 = alertas.slice(0, 10);

  var partes = [];
  partes.push('🎯 PLANO DA SEMANA — Toposcan');
  partes.push('Segunda, ' + kpis.data);
  partes.push('');
  partes.push('💚 Saúde geral: ' + kpis.saude + '/100');
  partes.push('');

  // 1. Foco financeiro da semana
  partes.push('═══ FOCO FINANCEIRO ═══');
  partes.push('  A receber 30d: ' + _centralBRL(kpis.financeiro.aReceber30));
  if (kpis.financeiro.atrasado > 0) {
    partes.push('  🔴 INADIMPLÊNCIA: ' + _centralBRL(kpis.financeiro.atrasado) + ' — AGIR ESTA SEMANA');
  } else {
    partes.push('  ✅ Sem inadimplência');
  }
  partes.push('');

  // 2. Pipeline da semana
  partes.push('═══ PIPELINE COMERCIAL ═══');
  partes.push('  Ativo: ' + _centralBRL(kpis.comercial.pipelineAtivo) + ' (ponderado: ' + _centralBRL(kpis.comercial.pipelinePonderado) + ')');
  if (kpis.comercial.dealsTravados > 0) {
    partes.push('  ⚠️ ' + kpis.comercial.dealsTravados + ' deals travados >14d — DESBLOQUEAR');
  }
  partes.push('');

  // 3. Produção da semana
  partes.push('═══ PRODUÇÃO (Engenharia) ═══');
  partes.push('  Projetos ativos: ' + kpis.engenharia.projetosAtivos + ' · em andamento: ' + kpis.engenharia.emAndamento);
  if (kpis.engenharia.atrasadas > 0) partes.push('  ⚠️ Tarefas atrasadas: ' + kpis.engenharia.atrasadas);
  if (kpis.engenharia.bloqueadas > 0) partes.push('  🔴 Tarefas bloqueadas: ' + kpis.engenharia.bloqueadas);
  partes.push('');

  // 4. Top 10 ações priorizadas
  if (top10.length > 0) {
    partes.push('═══ TOP ' + top10.length + ' AÇÕES DA SEMANA (priorizadas) ═══');
    top10.forEach(function(a, i) {
      partes.push((i+1) + '. ' + a.emoji + ' [' + a.area + '] ' + a.tipo + ' — ' + a.texto);
      partes.push('   💡 ' + a.sugestao);
    });
    partes.push('');
  } else {
    partes.push('═══ AÇÕES PRIORITÁRIAS ═══');
    partes.push('  ✅ Nenhum alerta crítico — semana tranquila');
    partes.push('');
  }

  partes.push('Total de alertas ativos: ' + alertas.length);
  partes.push('CRM: https://toposcansend-cmyk.github.io/CRM/');
  partes.push('');
  partes.push('— Central de Inteligência V7.7 (plano de segunda)');

  try {
    MailApp.sendEmail({
      to: _centralEmail(),
      subject: '🎯 Plano da Semana — ' + _centralDateBr(),
      body: partes.join('\n')
    });
    _recordTriggerRun('mondayPlanningBrief', 'ok');
  } catch (e) {
    Logger.log('Erro mondayPlan: ' + e.message);
    _recordTriggerRun('mondayPlanningBrief', 'error', e.message);
  }
}

// ─── V7.7: SEXTA 16h — RECAP DA SEMANA (retrospectiva) ───
function fridayWeekRecap() {
  var dummy = { secret: AGENT_SECRET };
  var kpis = getCrossKPIs(dummy).kpis;
  var alertas = getActiveAlerts(dummy).alertas;

  // Calcular janela: últimos 7 dias
  var hoje = new Date();
  var seteDias = new Date(hoje.getTime() - 7*24*60*60*1000);

  // Acessar planilhas para contar atividade da semana
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var producao = ss.getSheetByName('Producao');
  var financeiro = ss.getSheetByName('Financeiro');
  var partners = ss.getSheetByName('TopoPartners');

  // Contar tarefas concluídas na semana
  var tarefasConcluidasSemana = 0;
  if (producao && producao.getLastRow() > 1) {
    var prodData = producao.getRange(2, 1, producao.getLastRow()-1, 16).getValues();
    prodData.forEach(function(r) {
      var status = String(r[6] || '').trim();
      var dataConcl = _parseDataBR(r[10]);
      if (status === 'Concluído' && dataConcl && dataConcl >= seteDias) tarefasConcluidasSemana++;
    });
  }

  // Parcelas recebidas na semana
  var parcelasRecebidasSemana = 0;
  var valorRecebidoSemana = 0;
  if (financeiro && financeiro.getLastRow() > 1) {
    var finData = financeiro.getRange(2, 1, financeiro.getLastRow()-1, 14).getValues();
    finData.forEach(function(r) {
      var dataPg = _parseDataBR(r[9]);
      var valor = Number(r[5]) || 0;
      if (dataPg && dataPg >= seteDias) {
        parcelasRecebidasSemana++;
        valorRecebidoSemana += valor;
      }
    });
  }

  // Custos pagos na semana
  var custosPagosSemana = 0;
  if (partners && partners.getLastRow() > 1) {
    var partData = partners.getRange(2, 1, partners.getLastRow()-1, 16).getValues();
    partData.forEach(function(r) {
      var dataPg = _parseDataBR(r[8]);
      var valor = Number(r[5]) || 0;
      if (dataPg && dataPg >= seteDias) custosPagosSemana += valor;
    });
  }

  var partes = [];
  partes.push('📅 RECAP DA SEMANA — Toposcan');
  partes.push('Sexta, ' + kpis.data);
  partes.push('');
  partes.push('💚 Saúde geral: ' + kpis.saude + '/100');
  partes.push('');

  partes.push('═══ ✅ O QUE ACONTECEU (últimos 7 dias) ═══');
  partes.push('  💰 Parcelas recebidas: ' + parcelasRecebidasSemana + ' (' + _centralBRL(valorRecebidoSemana) + ')');
  partes.push('  🛠️ Tarefas concluídas: ' + tarefasConcluidasSemana);
  partes.push('  💼 Custos pagos: ' + _centralBRL(custosPagosSemana));
  partes.push('');

  partes.push('═══ 📊 MÊS ATUAL (até hoje) ═══');
  partes.push('  Recebido no mês: ' + _centralBRL(kpis.financeiro.recebidoMes));
  partes.push('  Fechadas: ' + kpis.comercial.fechadasMes + ' deals · ' + _centralBRL(kpis.comercial.valorFechadoMes));
  partes.push('  Custo do mês: ' + _centralBRL(kpis.operacao.custoMesTotal));
  partes.push('  💰 Margem real: ' + _centralBRL(kpis.margem.margemRealMes) + ' (' + kpis.margem.margemPct + '%)');
  partes.push('');

  partes.push('═══ ⚠️ EM ABERTO PRA PRÓXIMA SEMANA ═══');
  if (kpis.financeiro.atrasado > 0) partes.push('  🔴 Inadimplência: ' + _centralBRL(kpis.financeiro.atrasado));
  if (kpis.comercial.dealsTravados > 0) partes.push('  ⚠️ ' + kpis.comercial.dealsTravados + ' deals travados >14d');
  if (kpis.engenharia.atrasadas > 0) partes.push('  ⚠️ ' + kpis.engenharia.atrasadas + ' tarefas atrasadas');
  if (kpis.engenharia.bloqueadas > 0) partes.push('  🔴 ' + kpis.engenharia.bloqueadas + ' tarefas bloqueadas');
  partes.push('  📋 Total de alertas ativos: ' + alertas.length);
  partes.push('');

  partes.push('═══ 🎯 TOP 5 ALERTAS PRA RESOLVER ═══');
  alertas.slice(0, 5).forEach(function(a, i) {
    partes.push((i+1) + '. ' + a.emoji + ' [' + a.area + '] ' + a.texto);
  });
  partes.push('');

  partes.push('Bom fim de semana! Plano completo da próxima segunda chega às 9h.');
  partes.push('CRM: https://toposcansend-cmyk.github.io/CRM/');
  partes.push('— Central de Inteligência V7.7 (recap de sexta)');

  try {
    MailApp.sendEmail({
      to: _centralEmail(),
      subject: '📅 Recap da Semana — ' + _centralDateBr(),
      body: partes.join('\n')
    });
    _recordTriggerRun('fridayWeekRecap', 'ok');
  } catch (e) {
    Logger.log('Erro fridayRecap: ' + e.message);
    _recordTriggerRun('fridayWeekRecap', 'error', e.message);
  }
}

// ─── HEALTH CHECK DOS 3 TRIGGERS (V7.6) ───
function getTriggersHealth(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };

  // V7.7: apenas 2 triggers ativos (segunda + sexta)
  var expected = [
    { name: 'mondayPlanningBrief', maxIdleHours: 8*24 },   // segunda 9h → tolera 8 dias
    { name: 'fridayWeekRecap',     maxIdleHours: 8*24 }    // sexta 16h → tolera 8 dias
  ];

  var props = PropertiesService.getScriptProperties();
  var installed = ScriptApp.getProjectTriggers();
  var now = new Date();

  var report = expected.map(function(t) {
    var installed_matches = installed.filter(function(it) {
      return it.getHandlerFunction() === t.name;
    });

    var lastRunRaw = props.getProperty('TRIGGER_RUN_' + t.name);
    var lastRun = null, lastStatus = null, lastError = null, idleHours = null, healthy = false;

    if (lastRunRaw) {
      try {
        var rec = JSON.parse(lastRunRaw);
        lastRun = rec.lastRun;
        lastStatus = rec.status;
        lastError = rec.error;
        idleHours = (now - new Date(rec.lastRun)) / 3600000;
        healthy = (idleHours <= t.maxIdleHours) && (lastStatus !== 'error');
      } catch (e) { /* parse fail */ }
    }

    return {
      name: t.name,
      installed: installed_matches.length,
      lastRun: lastRun,
      lastStatus: lastStatus,
      lastError: lastError,
      idleHours: idleHours ? Math.round(idleHours * 10) / 10 : null,
      maxIdleHours: t.maxIdleHours,
      healthy: healthy,
      neverRan: lastRun === null
    };
  });

  var allHealthy = report.every(function(r) { return r.healthy || r.neverRan; });
  var problems = report.filter(function(r) { return !r.healthy && !r.neverRan; });

  return {
    ok: true,
    allHealthy: allHealthy,
    problemCount: problems.length,
    totalInstalledTriggers: installed.length,
    triggers: report
  };
}

// ─── V7.7: SETUP DE TRIGGERS (apenas 2 — segunda planejamento + sexta recap) ───
function installCentralTriggers(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };

  // Remove TODOS os triggers conhecidos (V7.0-V7.6 antigos + V7.7 novos pra reinstall limpo)
  uninstallCentralTriggers(body);

  var triggers = [];
  // 1) Plano da semana — SEGUNDA 9h
  ScriptApp.newTrigger('mondayPlanningBrief').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
  triggers.push('mondayPlanningBrief @ segunda 9h');

  // 2) Recap da semana — SEXTA 16h
  ScriptApp.newTrigger('fridayWeekRecap').timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(16).create();
  triggers.push('fridayWeekRecap @ sexta 16h');

  return {
    ok: true,
    message: '✅ Triggers V7.7 instalados (2 emails/semana)',
    triggersInstalados: triggers,
    emailDestino: _centralEmail(),
    nota: 'Para mudar email destino: PropertiesService.getScriptProperties().setProperty("CENTRAL_EMAIL", "novo@email.com")'
  };
}

function uninstallCentralTriggers(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  // Inclui V7.0-V7.6 antigos (dailyMorningBrief, detectInadimplencia, weeklyStrategicReport)
  // E V7.7 novos (mondayPlanningBrief, fridayWeekRecap) — pra reinstall limpo
  var nomes = [
    'dailyMorningBrief', 'detectInadimplencia', 'weeklyStrategicReport',
    'mondayPlanningBrief', 'fridayWeekRecap'
  ];
  var removidos = 0;
  var removidosPorNome = {};
  var todos = ScriptApp.getProjectTriggers();
  todos.forEach(function(t) {
    var name = t.getHandlerFunction();
    if (nomes.indexOf(name) !== -1) {
      ScriptApp.deleteTrigger(t);
      removidos++;
      removidosPorNome[name] = (removidosPorNome[name] || 0) + 1;
    }
  });
  return { ok: true, removidos: removidos, porNome: removidosPorNome };
}

function _runDailyBriefingNow(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  dailyMorningBrief();
  return { ok: true, message: '✅ Briefing enviado por email para ' + _centralEmail() };
}

function _runMondayPlanNow(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  mondayPlanningBrief();
  return { ok: true, message: '✅ Plano de segunda enviado pra ' + _centralEmail() };
}

function _runFridayRecapNow(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  fridayWeekRecap();
  return { ok: true, message: '✅ Recap de sexta enviado pra ' + _centralEmail() };
}

// ─── DIAGNÓSTICO: testa envio + reporta tudo que pode estar errado ───
function diagnosticarEmail(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  var diag = {
    ok: true,
    contaDonaDoScript: '',
    emailEffectiveUser: '',
    emailDestinoConfigurado: _centralEmail(),
    quotaRestanteMailApp: -1,
    podeUsarGmailApp: false,
    testes: []
  };
  try { diag.contaDonaDoScript = Session.getActiveUser().getEmail(); } catch (e) { diag.contaDonaDoScript = 'erro: ' + e.message; }
  try { diag.emailEffectiveUser = Session.getEffectiveUser().getEmail(); } catch (e) { diag.emailEffectiveUser = 'erro: ' + e.message; }
  try { diag.quotaRestanteMailApp = MailApp.getRemainingDailyQuota(); } catch (e) { diag.quotaRestanteMailApp = 'erro: ' + e.message; }
  try { diag.podeUsarGmailApp = typeof GmailApp !== 'undefined' && typeof GmailApp.sendEmail === 'function'; } catch (e) {}

  // Teste 1: MailApp para guilherme@
  try {
    MailApp.sendEmail({
      to: 'guilherme@toposcan.com.br',
      subject: '🧪 TESTE Central V7.1 — MailApp para Guilherme — ' + _centralDateBr() + ' ' + new Date().toLocaleTimeString('pt-BR'),
      body: 'Email de TESTE via MailApp.sendEmail. Se você está vendo isso, MailApp está funcionando.\n\nHorário: ' + new Date().toISOString() + '\nQuota restante: ' + diag.quotaRestanteMailApp
    });
    diag.testes.push({ tipo: 'MailApp', destino: 'guilherme@toposcan.com.br', resultado: 'OK (não significa que chegou — verifique spam/promoções)' });
  } catch (e) {
    diag.testes.push({ tipo: 'MailApp', destino: 'guilherme@toposcan.com.br', resultado: 'ERRO: ' + e.message });
  }

  // Teste 2: MailApp para marcelo@
  try {
    MailApp.sendEmail({
      to: 'marcelo@toposcan.com.br',
      subject: '🧪 TESTE Central V7.1 — MailApp para Marcelo — ' + _centralDateBr() + ' ' + new Date().toLocaleTimeString('pt-BR'),
      body: 'Email de TESTE via MailApp.sendEmail.\nHorário: ' + new Date().toISOString()
    });
    diag.testes.push({ tipo: 'MailApp', destino: 'marcelo@toposcan.com.br', resultado: 'OK' });
  } catch (e) {
    diag.testes.push({ tipo: 'MailApp', destino: 'marcelo@toposcan.com.br', resultado: 'ERRO: ' + e.message });
  }

  // Teste 3: MailApp para a própria conta (sanity check)
  try {
    var ownEmail = diag.contaDonaDoScript;
    if (ownEmail && ownEmail.indexOf('@') > 0) {
      MailApp.sendEmail({
        to: ownEmail,
        subject: '🧪 TESTE Central V7.1 — Self-test (' + ownEmail + ') — ' + _centralDateBr(),
        body: 'Email enviado pra mim mesmo (' + ownEmail + ') pra confirmar que o GAS consegue mandar email.\nHorário: ' + new Date().toISOString()
      });
      diag.testes.push({ tipo: 'MailApp-self', destino: ownEmail, resultado: 'OK' });
    }
  } catch (e) {
    diag.testes.push({ tipo: 'MailApp-self', resultado: 'ERRO: ' + e.message });
  }

  // Teste 4: GmailApp (mais robusto que MailApp, requer scope diferente)
  if (diag.podeUsarGmailApp) {
    try {
      GmailApp.sendEmail(
        'guilherme@toposcan.com.br',
        '🧪 TESTE Central V7.1 — via GmailApp — ' + _centralDateBr() + ' ' + new Date().toLocaleTimeString('pt-BR'),
        'Email de TESTE via GmailApp.sendEmail (alternativa ao MailApp). Se MailApp não chega mas GmailApp chega, é problema de delivery do MailApp.',
        { cc: 'marcelo@toposcan.com.br' }
      );
      diag.testes.push({ tipo: 'GmailApp', destino: 'guilherme + marcelo', resultado: 'OK' });
    } catch (e) {
      diag.testes.push({ tipo: 'GmailApp', resultado: 'ERRO: ' + e.message + ' (provavelmente falta autorizar scope gmail.send)' });
    }
  }

  diag.recomendacao = 'Se TODOS os envios deram OK mas NENHUM chegou: 1) verifique Spam/Promoções nos 2 inboxes; 2) adicione ' + diag.contaDonaDoScript + ' aos contatos confiáveis; 3) verifique no Workspace Admin se há filtro bloqueando emails de @gmail.com';
  return diag;
}

// ─── ENVIO SIMPLES DE TESTE (param: to, assunto livre) ───
function sendTestEmail(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  var to = body.to || _centralEmail();
  var assunto = body.subject || '🧪 Teste direto Central V7.1';
  var conteudo = body.text || 'Teste de envio direto. Hora: ' + new Date().toISOString();
  try {
    MailApp.sendEmail({ to: to, subject: assunto, body: conteudo });
    return { ok: true, enviado: true, to: to, quotaRestante: MailApp.getRemainingDailyQuota() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── FORCE AUTH: Executar manualmente do editor para autorizar o scope de email ───
// SEM try/catch, para o Apps Script EXIBIR o popup de autorização quando precisar.
// Roda 1x → popup aparece → você clica Permitir → MailApp + GmailApp ficam autorizados pra sempre.
// ════════════════════════════════════════════════════════════════════
// ASSISTENTE PESSOAL V7.5 — Email manual + Reuniões Meet via comando
// ════════════════════════════════════════════════════════════════════

// ─── sendEmail: envia 1 email arbitrário (param: to, subject, body|htmlBody, cc?) ───
function sendEmailAction(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  if (!body.to)      return { ok: false, error: 'Faltou: to' };
  if (!body.subject) return { ok: false, error: 'Faltou: subject' };
  if (!body.body && !body.htmlBody) return { ok: false, error: 'Faltou: body ou htmlBody' };
  var opts = { to: body.to, subject: body.subject };
  if (body.body) opts.body = body.body;
  if (body.htmlBody) opts.htmlBody = body.htmlBody;
  if (body.cc) opts.cc = body.cc;
  if (body.bcc) opts.bcc = body.bcc;
  if (body.replyTo) opts.replyTo = body.replyTo;
  if (body.name) opts.name = body.name;
  try {
    MailApp.sendEmail(opts);
    return { ok: true, enviado: true, to: body.to, cc: body.cc || '', subject: body.subject, quotaRestante: MailApp.getRemainingDailyQuota() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── createMeetEvent: cria evento no Calendar com link Google Meet ───
//   Params: title, startISO ("2026-05-23T14:00:00-03:00"), endISO, attendees[], description?, location?
function createMeetEventAction(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  if (!body.title)   return { ok: false, error: 'Faltou: title' };
  if (!body.startISO) return { ok: false, error: 'Faltou: startISO (formato ISO 8601 com timezone)' };
  if (!body.endISO)   return { ok: false, error: 'Faltou: endISO' };
  if (!body.attendees || !Array.isArray(body.attendees) || body.attendees.length === 0) {
    return { ok: false, error: 'Faltou: attendees (array de emails)' };
  }
  try {
    var ev = {
      summary: body.title,
      description: body.description || '',
      location: body.location || '',
      start: { dateTime: body.startISO, timeZone: body.timeZone || 'America/Sao_Paulo' },
      end:   { dateTime: body.endISO,   timeZone: body.timeZone || 'America/Sao_Paulo' },
      attendees: body.attendees.map(function(e) { return { email: e }; }),
      conferenceData: {
        createRequest: {
          requestId: 'meet-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1e6),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 }
        ]
      }
    };
    var created = Calendar.Events.insert(ev, 'primary', { conferenceDataVersion: 1, sendUpdates: 'all' });
    var meetLink = '';
    if (created.conferenceData && created.conferenceData.entryPoints) {
      var vid = created.conferenceData.entryPoints.find(function(p) { return p.entryPointType === 'video'; });
      if (vid) meetLink = vid.uri;
    }
    return {
      ok: true,
      eventId: created.id,
      meetLink: meetLink,
      htmlLink: created.htmlLink,
      summary: created.summary,
      start: created.start.dateTime,
      end: created.end.dateTime,
      attendees: (created.attendees || []).map(function(a) { return a.email; })
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── listMeetSuggestions: sugere horários livres entre N participantes ───
//   Params: attendees[], startISO, endISO, durationMinutes (default 30)
function listMeetSuggestionsAction(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  if (!body.attendees || !Array.isArray(body.attendees)) return { ok: false, error: 'Faltou: attendees' };
  if (!body.startISO || !body.endISO) return { ok: false, error: 'Faltou: startISO / endISO' };
  var durMin = parseInt(body.durationMinutes) || 30;
  try {
    var freebusy = Calendar.Freebusy.query({
      timeMin: body.startISO,
      timeMax: body.endISO,
      items: body.attendees.map(function(e) { return { id: e }; }),
      timeZone: body.timeZone || 'America/Sao_Paulo'
    });
    // Junta todos os busy de todos os calendars
    var allBusy = [];
    Object.keys(freebusy.calendars || {}).forEach(function(cal) {
      (freebusy.calendars[cal].busy || []).forEach(function(b) {
        allBusy.push({ start: new Date(b.start), end: new Date(b.end) });
      });
    });
    allBusy.sort(function(a, b) { return a.start - b.start; });
    // Encontra gaps maiores que durMin em horário comercial (9-18)
    var inicio = new Date(body.startISO);
    var fim = new Date(body.endISO);
    var preferStart = body.startHour != null ? body.startHour : 9;
    var preferEnd = body.endHour != null ? body.endHour : 18;
    var slots = [];
    var cursor = new Date(inicio);
    var iter = 0;
    while (cursor < fim && slots.length < (body.maxSlots || 8) && iter < 1000) {
      iter++;
      var dow = cursor.getDay();
      var hour = cursor.getHours();
      // Pula fim de semana e fora do horário comercial
      if ((body.excludeWeekends !== false) && (dow === 0 || dow === 6)) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(preferStart, 0, 0, 0);
        continue;
      }
      if (hour < preferStart) { cursor.setHours(preferStart, 0, 0, 0); continue; }
      if (hour >= preferEnd) { cursor.setDate(cursor.getDate() + 1); cursor.setHours(preferStart, 0, 0, 0); continue; }
      var tryEnd = new Date(cursor.getTime() + durMin * 60000);
      var conflito = allBusy.some(function(b) { return b.start < tryEnd && b.end > cursor; });
      if (!conflito && tryEnd <= fim) {
        slots.push({ start: cursor.toISOString(), end: tryEnd.toISOString() });
        cursor = new Date(tryEnd.getTime() + 15 * 60000); // gap de 15min entre sugestões
      } else {
        // Avança até depois do próximo busy
        var prox = allBusy.find(function(b) { return b.end > cursor; });
        if (prox) cursor = new Date(prox.end.getTime() + 1000);
        else cursor = new Date(cursor.getTime() + 30 * 60000);
      }
    }
    return { ok: true, slots: slots, durationMinutes: durMin, attendees: body.attendees };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── listUpcomingEvents: lista próximos eventos do calendário ───
function listUpcomingEventsAction(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret inválido' };
  var dias = parseInt(body.days) || 7;
  var max = parseInt(body.max) || 20;
  try {
    var agora = new Date();
    var depois = new Date(agora.getTime() + dias * 86400000);
    var resp = Calendar.Events.list('primary', {
      timeMin: agora.toISOString(),
      timeMax: depois.toISOString(),
      maxResults: max,
      singleEvents: true,
      orderBy: 'startTime'
    });
    var eventos = (resp.items || []).map(function(e) {
      var meet = '';
      if (e.conferenceData && e.conferenceData.entryPoints) {
        var vid = e.conferenceData.entryPoints.find(function(p) { return p.entryPointType === 'video'; });
        if (vid) meet = vid.uri;
      }
      return {
        id: e.id,
        titulo: e.summary || '(sem título)',
        inicio: e.start ? (e.start.dateTime || e.start.date) : '',
        fim: e.end ? (e.end.dateTime || e.end.date) : '',
        organizador: e.organizer ? e.organizer.email : '',
        attendees: (e.attendees || []).map(function(a) { return a.email; }),
        meetLink: meet,
        htmlLink: e.htmlLink,
        descricao: e.description || ''
      };
    });
    return { ok: true, total: eventos.length, eventos: eventos };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── FORCE AUTH Calendar: roda do editor pra autorizar scope calendar ───
function forceAuthCalendar() {
  // Sem try/catch — força popup OAuth na 1ª execução
  var cals = CalendarApp.getAllCalendars();
  Logger.log('Calendários acessíveis: ' + cals.length);
  // Cria evento teste (1h a partir de agora, 30min)
  var inicio = new Date(Date.now() + 3600000);
  var fim = new Date(inicio.getTime() + 30 * 60000);
  var ev = Calendar.Events.insert({
    summary: '🧪 Teste Calendar V7.5 (pode apagar)',
    description: 'Evento de teste criado para autorizar scope Calendar.\nPode deletar.',
    start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
    end:   { dateTime: fim.toISOString(),    timeZone: 'America/Sao_Paulo' },
    conferenceData: {
      createRequest: {
        requestId: 'auth-test-' + Date.now(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  }, 'primary', { conferenceDataVersion: 1 });
  Logger.log('✅ Evento teste criado: ' + ev.id + ' / Meet: ' + (ev.conferenceData ? ev.conferenceData.entryPoints[0].uri : 'n/a'));
  return 'OK — Calendar autorizado. Evento teste em 1h. Pode apagar.';
}

function forceAuthTriggers() {
  // Sem try/catch — força popup OAuth para scope ScriptApp
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('Triggers atuais: ' + triggers.length);
  // Também instala todos os triggers V7
  // Remove duplicados existentes
  var nomes = ['dailyMorningBrief', 'detectInadimplencia', 'weeklyStrategicReport'];
  triggers.forEach(function(t) {
    if (nomes.indexOf(t.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 1) Briefing matinal — todo dia 8h
  ScriptApp.newTrigger('dailyMorningBrief').timeBased().atHour(8).everyDays(1).create();
  // 2) Detecção de inadimplência — 10h e 16h
  ScriptApp.newTrigger('detectInadimplencia').timeBased().atHour(10).everyDays(1).create();
  ScriptApp.newTrigger('detectInadimplencia').timeBased().atHour(16).everyDays(1).create();
  // 3) Relatório semanal — segunda 9h
  ScriptApp.newTrigger('weeklyStrategicReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
  Logger.log('✅ 4 triggers V7 instalados (briefing 8h, inadimplencia 10h+16h, semanal seg 9h)');
  return 'OK — agentes ativos.';
}

function forceAuthEmail() {
  var assunto = '✅ Autorização concedida — Central Toposcan V7.1';
  var corpo = 'Olá Guilherme!\n\nEste email é o teste de autorização do Google Apps Script para envio de emails.\n\n' +
              'Se você está lendo isso significa que o scope MailApp.sendEmail está autorizado, ' +
              'e os agentes automáticos (briefing 8h, inadimplência 10h+16h, semanal segunda 9h) ' +
              'agora vão funcionar normalmente.\n\n' +
              'Hora do teste: ' + new Date().toISOString() + '\n\n' +
              '— Central de Inteligência Toposcan V7.1\nhttps://toposcansend-cmyk.github.io/CRM/';
  // Sem try/catch: deixa o erro borbulhar pra forçar o popup OAuth na 1ª execução
  MailApp.sendEmail({
    to: 'guilherme@toposcan.com.br,marcelo@toposcan.com.br',
    subject: assunto,
    body: corpo
  });
  Logger.log('✅ Email enviado para guilherme@toposcan.com.br + marcelo@toposcan.com.br');
  return 'OK — verifique inbox de ambos.';
}

// ============================================================
// forceAuthDrive — força popup OAuth para scope DriveApp (write)
// Rodar manualmente do Apps Script Editor após adicionar scope
// ============================================================
function forceAuthDrive() {
  // Operação de ESCRITA (não readonly) — força scope https://www.googleapis.com/auth/drive
  var folder = DriveApp.getFolderById('0AKp-OkVlROITUk9PVA');
  var tmp = folder.createFile('__forceAuthDrive_probe.txt', 'probe ' + new Date().toISOString());
  Logger.log('Drive WRITE scope OK — probe criado: ' + tmp.getId());
  tmp.setTrashed(true);
  return 'OK — Drive write scope autorizado.';
}

// ============================================================
// R3 — Clone Igrejas template para Edif. Anita Garibaldi
// One-off (callable via webhook action: 'r3SetupSheet')
// ============================================================
function r3SetupSheet(body) {
  var SOURCE_ID = '1lmYCtxX6xUVft1W7Gg1RiqnOvuIqI4boP5uJQwcgxKE';
  var PARENT_FOLDER_ID = '0AKp-OkVlROITUk9PVA';
  var OLD_R3_ID = '1-qB0qPMMSFf2qI3nWEgJCGsE9Ry-Pf9d7dPph1f6axc';
  var NEW_NAME = 'Controle_R3_Anita_Garibaldi_Toposcan';

  // 1) Trash old empty R3 if exists
  try {
    DriveApp.getFileById(OLD_R3_ID).setTrashed(true);
  } catch (e) {
    Logger.log('Skip trash old R3: ' + e.message);
  }

  // 2) Copy Igrejas template into the same parent folder
  var src = DriveApp.getFileById(SOURCE_ID);
  var parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
  var newFile = src.makeCopy(NEW_NAME, parent);
  var newId = newFile.getId();

  // 3) Open the copy
  var ss = SpreadsheetApp.openById(newId);
  var sh = ss.getSheets()[0];

  // 4) Unhide any hidden rows so we see all data rows from template
  sh.showRows(1, sh.getMaxRows());

  // 5) Insert 1 row inside data range (after row 10) so we have 14 data rows total (5-18).
  //    Inserting INSIDE the range causes conditional formatting + validation rules to auto-extend.
  sh.insertRowAfter(10);

  // 6) Update subtitle (row 2)
  sh.getRange('A2').setValue(
    'R3 Engenharia · Edif. Av. Anita Garibaldi 1250 · Curitiba/PR · 5.664m² · 8 pav + ático + 2 subsolos · Revit 2026'
  );

  // 7) Update column B header: Igreja → Pavimento
  sh.getRange('B4').setValue('Pavimento');

  // 8) Update Modelista validation (col C) to include Arthur as a valid option
  var modelistaRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Arthur', 'Luiza Morilhas', 'Jean', 'Gabriela Linhares', 'Pendente'], true)
    .setAllowInvalid(true)
    .build();
  sh.getRange(5, 3, 14, 1).setDataValidation(modelistaRule);

  // 9) Define R3 data (14 rows × 12 cols)
  var data = [
    ['01', 'Subsolo 2 (inferior)',     'Arthur', 'Concluído', 'Em andamento', 'Pendente',     'Pendente',     'Pendente', 'Pendente',      0.30, '12/06/2026', 'Garagem nível inferior'],
    ['02', 'Subsolo 1',                'Arthur', 'Concluído', 'Em andamento', 'Pendente',     'Pendente',     'Pendente', 'Pendente',      0.30, '12/06/2026', 'Garagem nível superior'],
    ['03', 'Térreo',                   'Arthur', 'Concluído', 'Em andamento', 'Pendente',     'Pendente',     'Pendente', 'Pendente',      0.30, '12/06/2026', 'Hall · acesso · pilotis'],
    ['04', 'Pav. Tipo 01 (SCAN)',      'Arthur', 'Concluído', 'Concluído',    'Em andamento', 'Em andamento', 'Pendente', 'Em andamento',  0.55, '05/06/2026', 'Modelo base — replicado nos demais'],
    ['05', 'Pav. Tipo 02 (SCAN)',      'Arthur', 'Concluído', 'Concluído',    'Em andamento', 'Em andamento', 'Pendente', 'Em andamento',  0.55, '05/06/2026', 'Modelo base — replicado nos demais'],
    ['06', 'Pav. Tipo 03 (replicado)', 'Arthur', '',          '',             '',             '',             'Pendente', 'Pendente',      0.00, '20/06/2026', 'Replicado do Pav Tipo 01'],
    ['07', 'Pav. Tipo 04 (replicado)', 'Arthur', '',          '',             '',             '',             'Pendente', 'Pendente',      0.00, '20/06/2026', 'Replicado do Pav Tipo 01'],
    ['08', 'Pav. Tipo 05 (replicado)', 'Arthur', '',          '',             '',             '',             'Pendente', 'Pendente',      0.00, '20/06/2026', 'Replicado do Pav Tipo 01'],
    ['09', 'Pav. Tipo 06 (replicado)', 'Arthur', '',          '',             '',             '',             'Pendente', 'Pendente',      0.00, '20/06/2026', 'Replicado do Pav Tipo 01'],
    ['10', 'Pav. Tipo 07 (replicado)', 'Arthur', '',          '',             '',             '',             'Pendente', 'Pendente',      0.00, '20/06/2026', 'Replicado do Pav Tipo 01'],
    ['11', 'Pav. Tipo 08 (replicado)', 'Arthur', '',          '',             '',             '',             'Pendente', 'Pendente',      0.00, '20/06/2026', 'Replicado do Pav Tipo 01'],
    ['12', 'Ático / Casa de Máquinas', 'Arthur', 'Concluído', 'Em andamento', 'Pendente',     'Pendente',     'Pendente', 'Pendente',      0.30, '25/06/2026', "Reservatório · caixa d'água · barrilete"],
    ['13', 'Fachadas Externas',        'Arthur', 'Concluído', 'Em andamento', 'Pendente',     'Pendente',     'Pendente', 'Pendente',      0.30, '25/06/2026', 'Aerolevantamento georreferenciado'],
    ['14', 'Topografia do Lote',       'Arthur', 'Concluído', 'Concluído',    '',             '',             'Pendente', 'Pendente',      0.40, '25/06/2026', '1.187,94 m² · cadastro planialtimétrico']
  ];

  // 10) Clear existing values in 14 data rows (5-18) and write new data
  sh.getRange(5, 1, 14, 12).clearContent();
  sh.getRange(5, 1, 14, 12).setValues(data);

  // 11) Update TOTAL CONCLUÍDO row (was row 18, now row 19 after insert)
  var totalRow = 19;
  var cols = [3, 4, 5, 6, 7, 8]; // 0-indexed: D=Fotos, E=Nuvem, F=Mesh, G=PLY, H=UPLOAD, I=IFC
  var totals = cols.map(function (ci) {
    return data.reduce(function (acc, row) {
      return acc + (row[ci] === 'Concluído' ? 1 : 0);
    }, 0);
  });
  sh.getRange(totalRow, 4).setValue(totals[0] + '/14');
  sh.getRange(totalRow, 5).setValue(totals[1] + '/14');
  sh.getRange(totalRow, 6).setValue(totals[2] + '/14');
  sh.getRange(totalRow, 7).setValue(totals[3] + '/14');
  sh.getRange(totalRow, 8).setValue(totals[4] + '/14');
  sh.getRange(totalRow, 9).setValue(totals[5] + '/14');
  var avgProgress = data.reduce(function (acc, row) { return acc + row[9]; }, 0) / data.length;
  sh.getRange(totalRow, 10).setValue(avgProgress);
  sh.getRange(totalRow, 10).setNumberFormat('0%');

  // 12) Ensure Progresso column is formatted as % on all 14 data rows
  sh.getRange(5, 10, 14, 1).setNumberFormat('0%');

  // 13) Clear residual background colors inherited from original hidden rows
  //     (rows 7, 12, 15 in Igrejas template had red bg + were hidden).
  //     Reset entire data area to white so only conditional formatting shows.
  sh.getRange(5, 1, 14, 12).setBackground(null);

  return respond({
    ok: true,
    spreadsheetId: newId,
    url: 'https://docs.google.com/spreadsheets/d/' + newId + '/edit',
    rowsWritten: data.length,
    name: NEW_NAME
  });
}

// One-off fix for an already-created R3 sheet (clears residual red backgrounds)
function r3FixFormatting(body) {
  var id = (body && body.spreadsheetId) || '1IO2YibnrD8WBclD2la6Yq1vfdjy1_c0MYa6YteV1ESM';
  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheets()[0];
  sh.getRange(5, 1, 14, 12).setBackground(null);
  return respond({ ok: true, spreadsheetId: id });
}

// ════════════════════════════════════════════════════════════════════════
// FLUXO DE CAIXA V7.8 — Conciliação real do saldo bancário com previsões
// ════════════════════════════════════════════════════════════════════════
// 3 endpoints:
//   getCashBalance      → retorna saldo armazenado + timestamp última atualização
//   setCashBalance      → grava novo saldo
//   getCashFlow         → timeline 30 dias com entradas/saídas/saldo acumulado + alertas

function getCashBalanceAction(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  var props = PropertiesService.getScriptProperties();
  var valor = parseFloat(props.getProperty('CAIXA_BALANCE') || '0');
  var atualizadoEm = props.getProperty('CAIXA_UPDATED_AT') || '';
  var observacao = props.getProperty('CAIXA_OBS') || '';
  return { ok: true, valor: valor, atualizadoEm: atualizadoEm, observacao: observacao };
}

function setCashBalanceAction(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  // Aceita 'valor' (frontend crm.html) OU 'saldo' (tool MCP crm_set_cash_balance). Ver E029.
  var rawValor = (body.valor !== undefined && body.valor !== null) ? body.valor : body.saldo;
  if (rawValor === undefined || rawValor === null) return { ok: false, error: 'Faltou: valor (ou saldo)' };
  var v = parseFloat(rawValor);
  if (isNaN(v)) return { ok: false, error: 'valor invalido' };
  var props = PropertiesService.getScriptProperties();
  props.setProperty('CAIXA_BALANCE', String(v));
  props.setProperty('CAIXA_UPDATED_AT', new Date().toISOString());
  if (body.observacao) props.setProperty('CAIXA_OBS', String(body.observacao));
  return { ok: true, valor: v, atualizadoEm: new Date().toISOString() };
}

// ─── Auto-saldo V7.14 ───────────────────────────────────────────────────
// Ajusta o SALDO ATUAL EM CAIXA por um delta (entrada +, saida -). Chamado por
// markPaid (entrada recebida) e updateTopoPartner (custo pago) pra que o saldo
// recalcule sozinho em QUALQUER canal (site OU IAs gerentes), sem depender do
// frontend. O campo manual (setCashBalanceAction) segue pros imprevistos. Ver E031.
function _ajustaCaixa(delta, obs) {
  var d = Number(delta);
  if (!d || isNaN(d)) return null;
  var props = PropertiesService.getScriptProperties();
  var atual = parseFloat(props.getProperty('CAIXA_BALANCE') || '0');
  var novo = Math.round((atual + d) * 100) / 100; // evita drift de centavos
  props.setProperty('CAIXA_BALANCE', String(novo));
  props.setProperty('CAIXA_UPDATED_AT', new Date().toISOString());
  if (obs) props.setProperty('CAIXA_OBS', String(obs));
  return novo;
}

function getCashFlowAction(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };

  var diasJanela = parseInt(body.dias) || 30;
  var saldoInicialOverride = (body.saldoInicial !== undefined && body.saldoInicial !== null && body.saldoInicial !== '') ? parseFloat(body.saldoInicial) : null;

  var saldoInicial;
  if (saldoInicialOverride !== null && !isNaN(saldoInicialOverride)) {
    saldoInicial = saldoInicialOverride;
  } else {
    saldoInicial = parseFloat(PropertiesService.getScriptProperties().getProperty('CAIXA_BALANCE') || '0');
  }
  var saldoUpdatedAt = PropertiesService.getScriptProperties().getProperty('CAIXA_UPDATED_AT') || '';

  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  var fim = new Date(hoje.getTime() + diasJanela * 86400000);

  // ENTRADAS (Financeiro) — V7.10
  // - Pendentes futuras (venc >= hoje, <= fim): aparecem como previsão
  // - Pagas no período (dataPag >= hoje, <= fim): aparecem como "recebidas" no dia que foi paga
  // - Atrasadas (venc < hoje sem pagamento): IGNORADAS (Guilherme não quer ver no fluxo)
  // - Canceladas: IGNORADAS
  var entradas = [];
  var finSheet = _finSheet();
  if (finSheet.getLastRow() >= 2) {
    var rawFin = finSheet.getRange(2, 1, finSheet.getLastRow() - 1, 14).getValues();
    rawFin.forEach(function(row, i) {
      if (!row[0] && !row[1]) return;
      var status = _derivarStatus(row);
      if (status === 'Cancelado') return;

      // Pagas: aparecem se dataPagamento estiver no período (>= hoje)
      if (status === 'Pago') {
        var dataPag = _parseDataBR(row[8]);
        if (!dataPag) return;
        if (dataPag < hoje) return; // pagas antes de hoje já estão no saldo atual
        if (dataPag > fim) return;
        entradas.push({
          rowIndex: i + 2,
          data: _centralDateBr(dataPag),
          dataOriginal: _centralDateBr(_parseDataBR(row[7]) || dataPag),
          cliente: String(row[1] || ''),
          vendedor: String(row[2] || ''),
          numeroProposta: String(row[0] || ''),
          parcela: row[3] + '/' + row[4],
          valor: Number(row[5]) || 0,
          formaPagamento: row[6],
          status: 'Pago',
          atrasada: false,
          paga: true,
          dataPagamento: _centralDateBr(dataPag)
        });
        return;
      }

      // Pendentes: aparecem se vencimento estiver no período (futuro)
      var venc = _parseDataBR(row[7]);
      if (!venc) return;
      if (venc < hoje) return; // atrasadas ignoradas
      if (venc > fim) return;
      entradas.push({
        rowIndex: i + 2,
        data: _centralDateBr(venc),
        dataOriginal: _centralDateBr(venc),
        cliente: String(row[1] || ''),
        vendedor: String(row[2] || ''),
        numeroProposta: String(row[0] || ''),
        parcela: row[3] + '/' + row[4],
        valor: Number(row[5]) || 0,
        formaPagamento: row[6],
        status: status,
        atrasada: false,
        paga: false
      });
    });
  }

  // SAÍDAS (TopoPartners) — V7.10
  // - Pendentes/Parciais com previsão >= hoje: aparecem como saída programada
  // - Pagos com data de operação >= hoje: aparecem como "pago" no dia da operação
  // - Atrasados (prev < hoje sem pagar tudo): IGNORADOS
  var saidas = [];
  var tpSheet = _tpSheet();
  if (tpSheet.getLastRow() >= 2) {
    var rawTp = tpSheet.getRange(2, 1, tpSheet.getLastRow() - 1, 16).getValues();
    rawTp.forEach(function(row, i) {
      if (!row[1] && !row[2]) return;
      var acordado = Number(row[6]) || 0;
      var pago = Number(row[7]) || 0;

      // Pago integralmente: aparece se foi pago no período
      if (pago >= acordado && acordado > 0) {
        var dataOp = _parseDataBR(row[5]);
        if (!dataOp) return;
        if (dataOp < hoje) return;
        if (dataOp > fim) return;
        saidas.push({
          rowIndex: i + 2,
          data: _centralDateBr(dataOp),
          dataOriginal: _centralDateBr(dataOp),
          parceiro: String(row[1] || ''),
          servico: String(row[2] || ''),
          projeto: String(row[3] || ''),
          categoria: String(row[15] || 'Outros'),
          valorRestante: 0,
          valorAcordado: acordado,
          valorPago: pago,
          observacao: String(row[12] || ''),
          atrasada: false,
          programado: false,
          paga: true
        });
        return;
      }

      // Pendente/Parcial: usa previsão
      var restante = acordado - pago;
      var prev = _parseDataBR(row[9]);
      if (!prev) return;
      if (prev < hoje) return;
      if (prev > fim) return;
      saidas.push({
        rowIndex: i + 2,
        data: _centralDateBr(prev),
        dataOriginal: _centralDateBr(prev),
        parceiro: String(row[1] || ''),
        servico: String(row[2] || ''),
        projeto: String(row[3] || ''),
        categoria: String(row[15] || 'Outros'),
        valorRestante: restante,
        valorAcordado: acordado,
        valorPago: pago,
        observacao: String(row[12] || ''),
        atrasada: false,
        programado: /^PROGRAMADO/i.test(String(row[12] || '')),
        paga: false
      });
    });
  }

  // TIMELINE
  // V7.10: itens PAGOS (paga=true) NÃO somam no saldo acumulado pq já refletidos no saldo atual
  // Mas continuam aparecendo no dia pra visibilidade
  var dias = [];
  var saldoAcumulado = saldoInicial;
  for (var d = 0; d < diasJanela; d++) {
    var dataIter = new Date(hoje.getTime() + d * 86400000);
    var dataStr = _centralDateBr(dataIter);
    var dow = dataIter.getDay();
    var entradasDia = entradas.filter(function(e) { return e.data === dataStr; });
    var saidasDia = saidas.filter(function(s) { return s.data === dataStr; });
    // Total visível (display)
    var totalEntradasVisivel = entradasDia.reduce(function(s, e) { return s + e.valor; }, 0);
    var totalSaidasVisivel = saidasDia.reduce(function(s, x) { return s + x.valorRestante; }, 0);
    // Total que afeta saldo projetado (exclui pagos — já estão no saldo atual)
    var totalEntradasParaSaldo = entradasDia.filter(function(e) { return !e.paga; }).reduce(function(s, e) { return s + e.valor; }, 0);
    var totalSaidasParaSaldo = saidasDia.filter(function(s) { return !s.paga; }).reduce(function(s, x) { return s + x.valorRestante; }, 0);
    saldoAcumulado += totalEntradasParaSaldo - totalSaidasParaSaldo;
    dias.push({
      data: dataStr,
      diaSemana: ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][dow],
      ehFimDeSemana: (dow === 0 || dow === 6),
      ehHoje: d === 0,
      entradas: entradasDia,
      saidas: saidasDia,
      totalEntradas: totalEntradasVisivel,
      totalSaidas: totalSaidasVisivel,
      totalEntradasPendentes: totalEntradasParaSaldo,
      totalSaidasPendentes: totalSaidasParaSaldo,
      saldoDia: totalEntradasParaSaldo - totalSaidasParaSaldo,
      saldoAcumulado: Math.round(saldoAcumulado * 100) / 100
    });
  }

  // ALERTAS
  var alertas = [];
  var primeiroNegativo = dias.find(function(d) { return d.saldoAcumulado < 0; });
  if (primeiroNegativo) {
    alertas.push({
      tipo: 'saldo_negativo', severity: 'alta', emoji: '🔴',
      texto: 'Saldo NEGATIVO previsto em ' + primeiroNegativo.data + ' (R$ ' + primeiroNegativo.saldoAcumulado.toLocaleString('pt-BR') + ')',
      sugestao: 'Antecipar cobranças, postergar pagamentos não-críticos ou aportar capital.'
    });
  }
  var primeiroCritico = dias.find(function(d) { return d.saldoAcumulado < 5000 && d.saldoAcumulado >= 0; });
  if (primeiroCritico && !primeiroNegativo) {
    alertas.push({
      tipo: 'saldo_critico', severity: 'media', emoji: '⚠️',
      texto: 'Saldo BAIXO em ' + primeiroCritico.data + ' (R$ ' + primeiroCritico.saldoAcumulado.toLocaleString('pt-BR') + ')',
      sugestao: 'Reserva técnica de R$ 5k está em risco.'
    });
  }
  dias.forEach(function(d) {
    if (d.totalSaidas > 10000) {
      alertas.push({
        tipo: 'concentracao_saidas', severity: 'media', emoji: '⚠️',
        texto: 'Concentração de saídas em ' + d.data + ': R$ ' + d.totalSaidas.toLocaleString('pt-BR') + ' (' + d.saidas.length + ' pagamentos)',
        sugestao: 'Considere distribuir alguns pagamentos em outros dias.'
      });
    }
  });
  var atrasadasArr = entradas.filter(function(e) { return e.atrasada; });
  if (atrasadasArr.length > 0) {
    var atrasadasTotal = atrasadasArr.reduce(function(s, e) { return s + e.valor; }, 0);
    alertas.push({
      tipo: 'inadimplencia', severity: 'alta', emoji: '🔴',
      texto: 'Inadimplência: R$ ' + atrasadasTotal.toLocaleString('pt-BR') + ' (' + atrasadasArr.length + ' parcelas atrasadas)',
      sugestao: 'Cobrança ativa imediata pode injetar caixa.'
    });
  }

  // SUGESTÕES
  var sugestoes = [];
  var proxEntradasGrandes = entradas.filter(function(e) { return e.valor > 5000 && !e.atrasada; }).slice(0, 3);
  proxEntradasGrandes.forEach(function(e) {
    sugestoes.push({
      emoji: '💡',
      texto: 'Antecipar cobrança ' + e.cliente + ' (R$ ' + e.valor.toLocaleString('pt-BR') + ' em ' + e.data + ')',
      impacto: 'Pode antecipar entrada de R$ ' + e.valor.toLocaleString('pt-BR')
    });
  });

  var totalEntradas30d = dias.reduce(function(s, d) { return s + d.totalEntradas; }, 0);
  var totalSaidas30d = dias.reduce(function(s, d) { return s + d.totalSaidas; }, 0);
  var saldoFinalProjetado = dias.length > 0 ? dias[dias.length - 1].saldoAcumulado : saldoInicial;

  return {
    ok: true,
    saldoInicial: saldoInicial,
    saldoUpdatedAt: saldoUpdatedAt,
    janela: { dias: diasJanela, inicio: _centralDateBr(hoje), fim: _centralDateBr(fim) },
    resumo: {
      totalEntradas: totalEntradas30d,
      totalSaidas: totalSaidas30d,
      saldoFinalProjetado: Math.round(saldoFinalProjetado * 100) / 100,
      saldoMinimo: Math.min.apply(null, dias.map(function(d) { return d.saldoAcumulado; })),
      saldoMaximo: Math.max.apply(null, dias.map(function(d) { return d.saldoAcumulado; }))
    },
    dias: dias,
    alertas: alertas,
    sugestoes: sugestoes
  };
}

// ============================================================
// MODULO APRENDIZADOS V7.12 — memoria institucional ilimitada (Rafaela)
// Adicionado em 2026-05-26
// Substitui o sistema de memorias nativo do Claude.ai (limite 30 entradas × 500 chars).
// ============================================================

const APR_SHEET_ID = '1190S57Jmbb-eJcMHJYaOZ7qIqMCUpOTV-SDlWoSrMO4';
const APR_SHEET_NAME = 'Aprendizados';

const APR_HEADERS = [
  'id', 'data', 'categoria', 'titulo', 'conteudo',
  'tags', 'clienteRelacionado', 'numeroProposta', 'criadoEm'
];

const APR_COL = {
  id: 1, data: 2, categoria: 3, titulo: 4, conteudo: 5,
  tags: 6, clienteRelacionado: 7, numeroProposta: 8, criadoEm: 9
};

function ensureAprendizados() {
  const ss = SpreadsheetApp.openById(APR_SHEET_ID);
  let sheet = ss.getSheetByName(APR_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(APR_SHEET_NAME);
    sheet.getRange(1, 1, 1, APR_HEADERS.length).setValues([APR_HEADERS]);
    sheet.getRange(1, 1, 1, APR_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    const widths = [90, 90, 110, 280, 480, 200, 160, 110, 160];
    widths.forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });
    // wrap em conteudo pra texto longo nao ficar truncado visualmente
    sheet.getRange(1, APR_COL.conteudo, 1000, 1).setWrap(true);
    return { ok: true, created: true, sheet: APR_SHEET_NAME, headers: APR_HEADERS };
  }
  return { ok: true, created: false, sheet: APR_SHEET_NAME, headers: APR_HEADERS };
}

function _aprSheet() {
  ensureAprendizados();
  return SpreadsheetApp.openById(APR_SHEET_ID).getSheetByName(APR_SHEET_NAME);
}

function _aprNextId(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 'APR-0001';
  const ids = sheet.getRange(2, APR_COL.id, last - 1, 1).getValues();
  let max = 0;
  ids.forEach(function(r) {
    const m = String(r[0] || '').match(/^APR-(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  });
  const next = max + 1;
  return 'APR-' + ('0000' + next).slice(-4);
}

function _aprRowToObj(row, rowIndex) {
  const o = { rowIndex: rowIndex };
  APR_HEADERS.forEach(function(h, i) {
    let v = row[i];
    if (v instanceof Date) {
      v = (h === 'data')
        ? Utilities.formatDate(v, 'America/Sao_Paulo', 'dd/MM/yyyy')
        : Utilities.formatDate(v, 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ssXXX");
    }
    o[h] = v;
  });
  return o;
}

function addLearning(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.titulo || !String(body.titulo).trim()) {
    return { ok: false, error: 'titulo obrigatorio' };
  }
  if (!body.conteudo || !String(body.conteudo).trim()) {
    return { ok: false, error: 'conteudo obrigatorio' };
  }
  const sheet = _aprSheet();
  const id = _aprNextId(sheet);
  const row = new Array(APR_HEADERS.length).fill('');
  row[APR_COL.id - 1] = id;
  row[APR_COL.data - 1] = body.data || _today();
  row[APR_COL.categoria - 1] = body.categoria || 'Padrao';
  row[APR_COL.titulo - 1] = String(body.titulo).slice(0, 200);
  row[APR_COL.conteudo - 1] = String(body.conteudo);
  row[APR_COL.tags - 1] = body.tags || '';
  row[APR_COL.clienteRelacionado - 1] = body.clienteRelacionado || '';
  row[APR_COL.numeroProposta - 1] = body.numeroProposta || '';
  row[APR_COL.criadoEm - 1] = new Date().toISOString();
  const start = sheet.getLastRow() + 1;
  sheet.getRange(start, 1, 1, APR_HEADERS.length).setValues([row]);
  return { ok: true, id: id, rowIndex: start, categoria: row[APR_COL.categoria - 1] };
}

function getLearnings(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  const sheet = _aprSheet();
  const last = sheet.getLastRow();
  if (last < 2) return { ok: true, total: 0, returned: 0, results: [] };
  const range = sheet.getRange(2, 1, last - 1, APR_HEADERS.length).getValues();
  let results = range.map(function(row, i) { return _aprRowToObj(row, i + 2); })
    .filter(function(r) { return r.id && String(r.id).trim() !== ''; });

  if (body.id) {
    results = results.filter(function(r) { return String(r.id).trim() === String(body.id).trim(); });
  }
  if (body.categoria) {
    const cat = String(body.categoria).toLowerCase();
    results = results.filter(function(r) { return String(r.categoria || '').toLowerCase() === cat; });
  }
  if (body.tags) {
    const wanted = String(body.tags).toLowerCase().split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    results = results.filter(function(r) {
      const have = String(r.tags || '').toLowerCase().split(',').map(function(s) { return s.trim(); });
      return wanted.every(function(t) { return have.indexOf(t) !== -1; });
    });
  }
  const cliQ = body.cliente || body.clienteRelacionado;
  if (cliQ) {
    const cli = String(cliQ).toLowerCase();
    results = results.filter(function(r) { return String(r.clienteRelacionado || '').toLowerCase().indexOf(cli) !== -1; });
  }
  if (body.numeroProposta) {
    results = results.filter(function(r) { return String(r.numeroProposta || '').trim() === String(body.numeroProposta).trim(); });
  }
  if (body.search) {
    const q = String(body.search).toLowerCase();
    results = results.filter(function(r) {
      return String(r.titulo || '').toLowerCase().indexOf(q) !== -1
        || String(r.conteudo || '').toLowerCase().indexOf(q) !== -1
        || String(r.tags || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  // Mais recente primeiro
  results.sort(function(a, b) { return b.rowIndex - a.rowIndex; });

  const total = results.length;
  const limit = parseInt(body.limit) || 0;
  if (limit > 0) results = results.slice(0, limit);

  return { ok: true, total: total, returned: results.length, results: results };
}

function _aprFindRowById(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;
  const ids = sheet.getRange(2, APR_COL.id, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(id).trim()) return i + 2;
  }
  return -1;
}

function updateLearning(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.id) return { ok: false, error: 'id obrigatorio' };
  const sheet = _aprSheet();
  const rowIndex = _aprFindRowById(sheet, body.id);
  if (rowIndex < 0) return { ok: false, error: 'id nao encontrado: ' + body.id };

  const editaveis = ['data', 'categoria', 'titulo', 'conteudo', 'tags', 'clienteRelacionado', 'numeroProposta'];
  const changed = {};
  editaveis.forEach(function(field) {
    if (body[field] !== undefined && body[field] !== null) {
      const col = APR_COL[field];
      const antes = sheet.getRange(rowIndex, col).getValue();
      sheet.getRange(rowIndex, col).setValue(body[field]);
      changed[field] = { de: String(antes), para: String(body[field]) };
    }
  });
  if (Object.keys(changed).length === 0) {
    return { ok: false, error: 'Nenhum campo editavel informado (validos: ' + editaveis.join(', ') + ')' };
  }
  SpreadsheetApp.flush();
  return { ok: true, id: body.id, rowIndex: rowIndex, changed: changed };
}

function deleteLearning(body) {
  if (!_finAuthOK(body)) return { ok: false, error: 'Secret invalido' };
  if (!body.id) return { ok: false, error: 'id obrigatorio' };
  const sheet = _aprSheet();
  const rowIndex = _aprFindRowById(sheet, body.id);
  if (rowIndex < 0) return { ok: false, error: 'id nao encontrado: ' + body.id };
  sheet.deleteRow(rowIndex);
  return { ok: true, deleted: body.id, rowIndex: rowIndex };
}
