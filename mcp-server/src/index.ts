/**
 * Toposcan CRM MCP Server
 * Wrappea o webhook Google Apps Script V7.12 como ferramentas MCP
 * para as 4 IAs gerentes (Rafaela, Beatriz, Vanessa, Fernanda) executarem
 * ações reais no CRM via claude.ai Projects.
 *
 * Deploy: Cloudflare Workers (HTTPS público)
 * Endpoint: /mcp (POST JSON-RPC 2.0)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  WEBHOOK_URL: string;
  WEBHOOK_SECRET: string; // configurado via `wrangler secret put WEBHOOK_SECRET`
}

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

const SERVER_VERSION = '1.6.0';
const SERVER_BUILD = '2026-07-01-actor';

// ───────────────────────────────────────────────
// Telemetria estruturada — JSON lines pro Workers Logs / wrangler tail
// ───────────────────────────────────────────────
type LogKind = 'request' | 'tool_call' | 'webhook_call' | 'health_check' | 'error';

function logEvent(kind: LogKind, data: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    svc: 'toposcan-crm-mcp',
    ver: SERVER_VERSION,
    kind,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

function truncate(s: string | undefined, max = 200): string | undefined {
  if (!s) return s;
  return s.length <= max ? s : s.slice(0, max) + `…[${s.length - max}+]`;
}

// ───────────────────────────────────────────────
// Helper: chama o webhook seguindo o redirect 302 do Apps Script
// ───────────────────────────────────────────────
async function callWebhook(
  url: string,
  secret: string,
  action: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const start = Date.now();
  // Auditoria: acoes via IA gerente nao tem usuario logado — marca a origem
  // (em vez de cair como "(desconhecido)"). Se params trouxer actor (param
  // opcional das tools de escrita — GER-08), o spread sobrescreve o default
  // e o audit log passa a distinguir QUAL gerente escreveu.
  const payload = { action, secret, actor: 'IA (gerente)', ...params };
  let httpStatus: number | undefined;
  let ok = false;
  let errorMsg: string | undefined;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    httpStatus = resp.status;
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Webhook HTTP ${resp.status}: ${body.slice(0, 500)}`);
    }
    const text = await resp.text();
    ok = true;
    try {
      return JSON.parse(text);
    } catch {
      return { rawText: text, warning: 'Non-JSON response from webhook' };
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    logEvent('webhook_call', {
      action,
      ok,
      latency_ms: Date.now() - start,
      http_status: httpStatus,
      error: truncate(errorMsg),
    });
  }
}

// ───────────────────────────────────────────────
// Definição das ferramentas MCP
// ───────────────────────────────────────────────
type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  action: string; // action do webhook
};

const TOOLS: ToolDef[] = [
  // ═══ VENDAS / CRM Consolidado ═══
  {
    name: 'crm_list_all',
    description: 'Lista propostas ATIVAS do funil (exclui Fechada/Perdida). Visão do funil ao vivo. Use para auditoria geral, projeção, top deals.',
    action: 'listAll',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_find',
    description: 'Busca proposta(s) por cliente ou número da proposta. Retorna TUDO inclusive Fechada/Perdida. Use ANTES de qualquer update.',
    action: 'find',
    inputSchema: {
      type: 'object',
      properties: {
        cliente: { type: 'string', description: 'Nome do cliente (ex: CB Engenharia)' },
        numeroProposta: { type: 'string', description: 'Número (ex: 06202534.0)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_update',
    description: 'Edita 1 proposta. Auto-cascata: status:"Fechada" dispara email pros sócios + sugere próximos passos. Sempre rode crm_find primeiro.',
    action: 'update',
    inputSchema: {
      type: 'object',
      properties: {
        row: { type: 'number', description: 'rowIndex retornado pelo find (se souber)' },
        cliente: { type: 'string', description: 'Alternativa ao row' },
        numeroProposta: { type: 'string', description: 'Alternativa ao row' },
        updates: { type: 'object', description: 'Campos a atualizar (status, percentual, valor, observacoes, etc)' },
      },
      required: ['updates'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_bulk_update',
    description: 'Atualiza N propostas em uma chamada. Para movimento em massa do funil.',
    action: 'bulkUpdate',
    inputSchema: {
      type: 'object',
      properties: {
        updates: { type: 'array', items: { type: 'object' }, description: 'Array de objects, cada um com row/cliente/numeroProposta + updates' },
      },
      required: ['updates'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_add_lead',
    description: 'Cria novo lead/proposta no CRM. Status inicial sugerido: "Em análise" (5-15%).',
    action: 'addLead',
    inputSchema: {
      type: 'object',
      properties: {
        cliente: { type: 'string' },
        vendedor: { type: 'string', enum: ['Guilherme', 'Marcelo', 'Allana'] },
        servico: { type: 'string', description: 'ex: Scan to BIM, Topografia, LiDAR' },
        valorTotal: { type: 'number' },
        descricao: { type: 'string' },
        status: { type: 'string', default: 'Em análise' },
        percentual: { type: 'number', default: 10 },
        prioridade: { type: 'string', enum: ['Alta', 'Média', 'Baixa'] },
        previsaoFechamento: { type: 'string', description: 'DD/MM/AAAA' },
        observacoes: { type: 'string' },
        numeroProposta: { type: 'string', description: 'Opcional — gerado automático se omitido' },
      },
      required: ['cliente', 'vendedor', 'servico', 'valorTotal'],
      additionalProperties: false,
    },
  },

  // ═══ PROPOSTAS (V7.15 — gera Google Doc + PDF reais no Drive) ═══
  {
    name: 'crm_next_proposal_number',
    description: 'Retorna o PRÓXIMO número de proposta no formato MMAAAANNNN.0 (ex: 062026108.0). O sequencial NNNN é contínuo dentro do ANO (não reseta por mês) e o prefixo MMAAAA é o mês/ano corrente. Use antes de gerar uma proposta se quiser saber o número que será atribuído.',
    action: 'nextProposalNumber',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_generate_proposal',
    description: 'Gera uma proposta comercial REAL: copia o template do Drive, preenche os 11 campos, salva como Google Doc E exporta um PDF — ambos na pasta CRM-Propostas do Drive corporativo. Retorna docUrl e pdfUrl (links "qualquer um com o link"). Se numeroProposta for omitido, gera automaticamente (MMAAAANNNN.0). Com anexar:true, vincula o PDF gerado à proposta no CRM (módulo Anexos). NÃO cria lead no funil — isso é separado (crm_add_lead).',
    action: 'generateProposal',
    inputSchema: {
      type: 'object',
      properties: {
        numeroProposta: { type: 'string', description: 'Opcional — gerado automático se omitido (formato MMAAAANNNN.0)' },
        cliente: { type: 'string', description: 'Nome do cliente (obrigatório)' },
        contato: { type: 'string', description: 'Nome da pessoa de contato' },
        objetivo: { type: 'string', description: 'Objetivo/escopo da proposta' },
        area: { type: 'string', description: 'Área (ex: "1.234 m²")' },
        servicos: { type: 'string', description: 'Serviços inclusos' },
        valor: { type: 'string', description: 'Valor já formatado (ex: "R$ 19.000,00")' },
        pagamento: { type: 'string', description: 'Condições de pagamento' },
        prazo: { type: 'string', description: 'Prazo de entrega' },
        obs: { type: 'string', description: 'Observações' },
        anexar: { type: 'boolean', default: false, description: 'Se true, anexa o PDF gerado à proposta no CRM (módulo Anexos)' },
        enviadoPor: { type: 'string', description: 'Quem gerou (ex: Camila, Rafaela) — usado no registro do anexo' },
      },
      required: ['cliente'],
      additionalProperties: false,
    },
  },

  // ═══ ANEXOS (V8) ═══
  {
    name: 'crm_link_attachment',
    description: 'Anexa a uma proposta um arquivo JÁ existente no Google Drive (guarda só o link). Use quando o usuário te der um link do Drive. Para subir o conteúdo do arquivo, use crm_upload_attachment.',
    action: 'linkAttachment',
    inputSchema: {
      type: 'object',
      properties: {
        numeroProposta: { type: 'string', description: 'Chave da proposta (ex: 06202534.0)' },
        url: { type: 'string', description: 'Link do arquivo no Drive' },
        nomeArquivo: { type: 'string', description: 'Nome amigável (ex: Proposta CB.pdf)' },
        categoria: { type: 'string', enum: ['proposta', 'contrato', 'comprovante', 'outro'], default: 'proposta' },
        cliente: { type: 'string' },
        enviadoPor: { type: 'string', description: 'Quem anexou (ex: Rafaela, Guilherme)' },
      },
      required: ['numeroProposta', 'url'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_upload_attachment',
    description: 'Sobe um arquivo (conteúdo em base64) pro Drive da empresa e anexa à proposta. O servidor valida tipo (PDF/imagem/Word/Excel por magic-bytes) e tamanho (máx 7MB). Use para arquivos PEQUENOS; para grandes prefira crm_link_attachment com o link do Drive.',
    action: 'uploadAttachment',
    inputSchema: {
      type: 'object',
      properties: {
        numeroProposta: { type: 'string' },
        nomeArquivo: { type: 'string', description: 'Nome com extensão (ex: Proposta.pdf)' },
        dataBase64: { type: 'string', description: 'Conteúdo do arquivo em base64 (sem o prefixo data:...)' },
        mimeType: { type: 'string', description: 'ex: application/pdf' },
        categoria: { type: 'string', enum: ['proposta', 'contrato', 'comprovante', 'outro'], default: 'proposta' },
        cliente: { type: 'string' },
        enviadoPor: { type: 'string' },
      },
      required: ['numeroProposta', 'nomeArquivo', 'dataBase64'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_list_attachments',
    description: 'Lista os anexos (link + metadados) de uma proposta.',
    action: 'listAttachments',
    inputSchema: {
      type: 'object',
      properties: { numeroProposta: { type: 'string' } },
      required: ['numeroProposta'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_delete_attachment',
    description: 'Remove um anexo (soft-delete por id, preserva auditoria). trashDrive:true também joga o arquivo do Drive na lixeira.',
    action: 'deleteAttachment',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'id (UUID) do anexo retornado no list' },
        trashDrive: { type: 'boolean', default: false },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },

  // ═══ FINANCEIRO ═══
  {
    name: 'crm_add_payment_plan',
    description: 'Cria N parcelas para uma proposta. replace:true sobrescreve plano existente. Vencimentos DD/MM/AAAA.',
    action: 'addPaymentPlan',
    inputSchema: {
      type: 'object',
      properties: {
        numeroProposta: { type: 'string' },
        cliente: { type: 'string' },
        vendedor: { type: 'string' },
        parcelas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              valor: { type: 'number' },
              vencimento: { type: 'string', description: 'DD/MM/AAAA' },
              formaPagamento: { type: 'string', enum: ['PIX', 'Boleto', 'Transferência', 'Cartão', 'Cheque', 'Espécie', 'Outros'] },
            },
            required: ['valor', 'vencimento', 'formaPagamento'],
          },
        },
        replace: { type: 'boolean', default: false },
      },
      required: ['numeroProposta', 'cliente', 'parcelas'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_list_payments',
    description: 'Lista parcelas. Filtros: filter (pago/pendente/atrasado), vendedor, numeroProposta, cliente, fromDate, toDate (DD/MM/AAAA).',
    action: 'listPayments',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['pago', 'pendente', 'atrasado'] },
        vendedor: { type: 'string' },
        numeroProposta: { type: 'string' },
        cliente: { type: 'string' },
        fromDate: { type: 'string', description: 'DD/MM/AAAA' },
        toDate: { type: 'string', description: 'DD/MM/AAAA' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_update_payment',
    description: 'Edita 1 parcela específica.',
    action: 'updatePayment',
    inputSchema: {
      type: 'object',
      properties: {
        rowIndex: { type: 'number', description: 'rowIndex retornado por list_payments' },
        fields: { type: 'object', description: 'Campos a editar (valor, vencimento, formaPagamento, observacao)' },
      },
      required: ['rowIndex', 'fields'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_mark_paid',
    description: 'Marca parcela como paga. dataPagamento default = hoje.',
    action: 'markPaid',
    inputSchema: {
      type: 'object',
      properties: {
        rowIndex: { type: 'number' },
        dataPagamento: { type: 'string', description: 'DD/MM/AAAA — opcional, default hoje' },
        comprovante: { type: 'string', description: 'URL ou nota — opcional' },
      },
      required: ['rowIndex'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_get_finance_kpis',
    description: 'KPIs agregados do financeiro: aReceber30, recebidoMes, atrasado, previsto90d. Sempre rode no 1º turno de conversa financeira.',
    action: 'getFinanceKPIs',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_get_cash_flow',
    description: 'Fluxo de Caixa V7.8: projeção 30d entradas/saídas/saldo + alertas (inadimplência/concentração) + sugestões. Saldo inicial vem de get_cash_balance.',
    action: 'getCashFlow',
    inputSchema: {
      type: 'object',
      properties: {
        dias: { type: 'number', default: 30, description: 'Janela em dias' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_get_cash_balance',
    description: 'Saldo bancário atual (lido do PropertiesService). Manual — atualiza com set_cash_balance.',
    action: 'getCashBalance',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_set_cash_balance',
    description: 'Atualiza saldo bancário atual. Use após conciliação bancária.',
    action: 'setCashBalance',
    inputSchema: {
      type: 'object',
      properties: {
        saldo: { type: 'number', description: 'Saldo em R$' },
      },
      required: ['saldo'],
      additionalProperties: false,
    },
  },

  // ═══ OPERAÇÃO / TopoPartners ═══
  {
    name: 'crm_add_topo_partner',
    description: 'Registra custo de operação. Categoria obrigatória. Avaliação ⭐1-5 só faz sentido pra Parceiro/Serviço.',
    action: 'addTopoPartner',
    inputSchema: {
      type: 'object',
      properties: {
        categoria: { type: 'string', enum: ['Parceiro/Serviço', 'Equipamento', 'Veículo', 'Cartão de Crédito', 'Outros'] },
        parceiro: { type: 'string', description: 'Nome do parceiro/fornecedor' },
        servico: { type: 'string' },
        projeto: { type: 'string', description: 'Formato: "Cliente - NumeroProposta"' },
        descricao: { type: 'string' },
        dataOperacao: { type: 'string', description: 'DD/MM/AAAA' },
        valorAcordado: { type: 'number' },
        valorPago: { type: 'number', default: 0 },
        previsaoPagamento: { type: 'string', description: 'DD/MM/AAAA' },
        avaliacao: { type: 'number', minimum: 1, maximum: 5 },
        observacoes: { type: 'string' },
      },
      required: ['categoria', 'parceiro', 'servico', 'projeto', 'valorAcordado'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_add_topo_partner_parcelado',
    description: 'Registra um custo de parceiro PARCELADO: cria N parcelas LIGADAS (mesmo grupoId), cada uma com sua própria data e valor, conciliando 1:1 no fluxo de caixa (igual às parcelas de venda). Use quando o pagamento de um custo será dividido em datas diferentes (ex: R$5k na sexta + R$10k após receber do cliente). São PREVISÕES — não marca como pago; o caixa só baixa ao registrar valorPago via crm_update_topo_partner. Se informar valorTotal, a soma das parcelas TEM que bater (trava anti-erro).',
    action: 'addTopoPartnerParcelado',
    inputSchema: {
      type: 'object',
      properties: {
        categoria: { type: 'string', enum: ['Parceiro/Serviço', 'Equipamento', 'Veículo', 'Cartão de Crédito', 'Outros'], description: 'Default: Parceiro/Serviço' },
        parceiro: { type: 'string', description: 'Nome do parceiro/fornecedor' },
        servico: { type: 'string' },
        projeto: { type: 'string', description: 'Formato: "Cliente - NumeroProposta"' },
        descricao: { type: 'string' },
        dataOperacao: { type: 'string', description: 'DD/MM/AAAA' },
        valorTotal: { type: 'number', description: 'Opcional. Se informado, a soma das parcelas precisa bater exatamente.' },
        observacoes: { type: 'string', description: 'Observação geral (cada parcela pode ter a sua também)' },
        parcelas: {
          type: 'array',
          description: 'Lista de parcelas, na ordem. Cada item: {valor, previsao}. Opcionais: valorPago, observacoes.',
          items: {
            type: 'object',
            properties: {
              valor: { type: 'number' },
              previsao: { type: 'string', description: 'DD/MM/AAAA' },
              valorPago: { type: 'number', default: 0 },
              observacoes: { type: 'string' },
            },
            required: ['valor', 'previsao'],
            additionalProperties: false,
          },
        },
      },
      required: ['parceiro', 'servico', 'projeto', 'parcelas'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_list_topo_partners',
    description: 'Lista custos de operação. Filtros: parceiro, status, projeto, categoria. RETORNO em chave items (não itens) ⚠️.',
    action: 'listTopoPartners',
    inputSchema: {
      type: 'object',
      properties: {
        parceiro: { type: 'string' },
        status: { type: 'string', enum: ['Pago', 'Parcial', 'Pendente'] },
        projeto: { type: 'string' },
        categoria: { type: 'string', enum: ['Parceiro/Serviço', 'Equipamento', 'Veículo', 'Cartão de Crédito', 'Outros'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_update_topo_partner',
    description: 'Edita custo (atualizar valorPago, status, observacoes, etc).',
    action: 'updateTopoPartner',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        rowIndex: { type: 'number' },
        fields: { type: 'object' },
      },
      required: ['fields'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_delete_topo_partner',
    description: 'Remove custo. ⚠️ IRREVERSÍVEL — confirme com usuário antes.',
    action: 'deleteTopoPartner',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        rowIndex: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_get_topo_partners_kpis',
    description: 'KPIs operação: custo total mês, pendentes, top parceiros por gasto, margem real por projeto.',
    action: 'getTopoPartnersKPIs',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },

  // ═══ MAPA DE PARCEIROS (cadastro georreferenciado — ≠ custos TopoPartners) ═══
  {
    name: 'crm_add_parceiro',
    description: 'Coloca um PARCEIRO no MAPA DE PARCEIROS (cadastro georreferenciado — NÃO confundir com crm_add_topo_partner, que é CUSTO). Pra adicionar ao mapa: informe nome + tipo + tecnologias e o ENDEREÇO ou a CIDADE/UF — o servidor acha as coordenadas sozinho (NÃO precisa de lat/long). Raio de cobertura é 100 km por padrão. Modelista BIM = tipo "Modelagem BIM" (trabalha remoto; raio menos relevante). Aparece no mapa pros sócios e pro Luiz.',
    action: 'addParceiro',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome do parceiro/empresa' },
        tipo: { type: 'string', enum: ['Campo', 'Modelagem BIM', 'Ambos'], description: 'Campo=levantamento (RTK/drone/scanner/batimetria/topo); Modelagem BIM=modelista; Ambos. Default Campo.' },
        endereco: { type: 'string', description: 'Rua/bairro/CEP — base p/ geocodificar. Opcional se passar cidade.' },
        cidade: { type: 'string' },
        uf: { type: 'string', description: 'Sigla de 2 letras' },
        tecnologias: { type: 'array', items: { type: 'string' }, description: 'Ex.: ["RTK/GNSS","Drone/Aerofotogrametria","Scanner terrestre","Batimetria","BIM/Modelagem","Topografia convencional"]' },
        raioKm: { type: 'number', description: 'Raio de cobertura em km. Default 100 se omitir.' },
        avaliacao: { type: 'number', minimum: 0, maximum: 5, description: 'Qualidade do trabalho ⭐ 0-5' },
        telefone: { type: 'string' },
        email: { type: 'string' },
        contato: { type: 'string', description: 'Pessoa de contato' },
        observacoes: { type: 'string' },
        latitude: { type: 'number', description: 'Opcional — só se já tiver. Senão geocodifica do endereço/cidade.' },
        longitude: { type: 'number', description: 'Opcional.' },
        status: { type: 'string', enum: ['ativo', 'inativo'] },
      },
      required: ['nome'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_list_parceiros',
    description: 'Lista os parceiros do Mapa de Parceiros (nome, tipo, cidade/uf, lat/lng, tecnologias, raioKm, avaliacao). Retorno na chave "parceiros".',
    action: 'listParceiros',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_update_parceiro',
    description: 'Edita um parceiro do mapa (por id ou rowIndex). Se mudar endereco/cidade SEM mandar lat/long, re-geocodifica automaticamente.',
    action: 'updateParceiro',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' }, rowIndex: { type: 'number' },
        nome: { type: 'string' }, tipo: { type: 'string', enum: ['Campo', 'Modelagem BIM', 'Ambos'] },
        endereco: { type: 'string' }, cidade: { type: 'string' }, uf: { type: 'string' },
        tecnologias: { type: 'array', items: { type: 'string' } },
        raioKm: { type: 'number' }, avaliacao: { type: 'number', minimum: 0, maximum: 5 },
        telefone: { type: 'string' }, email: { type: 'string' }, contato: { type: 'string' },
        observacoes: { type: 'string' }, status: { type: 'string', enum: ['ativo', 'inativo'] },
        latitude: { type: 'number' }, longitude: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_delete_parceiro',
    description: 'Remove um parceiro do mapa. ⚠️ IRREVERSÍVEL — confirme com o usuário antes. Por id ou rowIndex.',
    action: 'deleteParceiro',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, rowIndex: { type: 'number' } }, additionalProperties: false },
  },
  {
    name: 'crm_get_parceiros_kpis',
    description: 'KPIs do Mapa de Parceiros: total, ativos, modelistas BIM, estados cobertos, contagem por tecnologia e por tipo.',
    action: 'getParceirosKPIs',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },

  // ═══ AUDITORIA / ACESSOS (uso de gestão — dono) ═══
  {
    name: 'crm_get_access_summary',
    description: 'Resumo de uso por pessoa: último acesso, última ação, total de acessos e de ações de cada usuário do CRM. Use pra responder "quem está usando o sistema / quem anda inativo". Dado de auditoria — uso de gestão.',
    action: 'getAccessSummary',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_get_audit_log',
    description: 'Log de auditoria: quem fez o quê e quando (mutações + acessos), mais recente primeiro. Filtros: filtroActor (e-mail/parte do e-mail), filtroAcao (ex.: "acesso","addParceiro","update"), limite. Use pra "o que o Luiz cadastrou", "quem mexeu nessa proposta", etc. Dado de auditoria — uso de gestão.',
    action: 'getAuditLog',
    inputSchema: {
      type: 'object',
      properties: {
        filtroActor: { type: 'string', description: 'Filtra por e-mail do usuário (substring). Ex.: "luiz".' },
        filtroAcao: { type: 'string', description: 'Filtra por tipo de ação. Ex.: "acesso", "addParceiro", "update".' },
        limite: { type: 'number', description: 'Quantos eventos recentes ler (default 100, máx 500).' },
      },
      additionalProperties: false,
    },
  },

  // ═══ ENGENHARIA / Producao ═══
  {
    name: 'crm_add_producao',
    description: 'Cria 1 tarefa de produção. Para criar múltiplas, prefira bulk_add_producao.',
    action: 'addProducao',
    inputSchema: {
      type: 'object',
      properties: {
        projeto: { type: 'string' },
        numeroProposta: { type: 'string' },
        subitem: { type: 'string', description: 'Ex: "Igreja A", "Setor 3"' },
        fase: { type: 'string', description: 'Ex: Coleta, Nuvem, Mesh, PLY, IFC, Revisão' },
        responsavel: { type: 'string', description: 'Jean / Luiza Morilhas / Gabriela Linhares / Guilherme / Marcelo / Arthur' },
        status: { type: 'string', enum: ['Não iniciado', 'Em andamento', 'Em revisão', 'Concluído', 'Bloqueado', 'Retirada', 'N/A'], default: 'Não iniciado' },
        percentual: { type: 'number', minimum: 0, maximum: 100 },
        dataInicio: { type: 'string', description: 'DD/MM/AAAA' },
        previsaoEntrega: { type: 'string', description: 'DD/MM/AAAA' },
        observacao: { type: 'string' },
        ordemSubitem: { type: 'number' },
        ordemFase: { type: 'number' },
      },
      required: ['fase'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_bulk_add_producao',
    description: 'Cria N tarefas de produção (matriz subitem × fase). Use template para projetos grandes (Scan-to-BIM: Coleta, Nuvem, Mesh, PLY, IFC, Revisão).',
    action: 'bulkAddProducao',
    inputSchema: {
      type: 'object',
      properties: {
        itens: { type: 'array', items: { type: 'object' }, description: 'Array de tarefas (mesmo schema de add_producao)' },
      },
      required: ['itens'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_list_producao',
    description: 'Lista tarefas. RETORNO em chave tarefas. Filtros: projeto, numeroProposta, status, responsavel.',
    action: 'listProducao',
    inputSchema: {
      type: 'object',
      properties: {
        projeto: { type: 'string' },
        numeroProposta: { type: 'string' },
        status: { type: 'string' },
        responsavel: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_update_producao',
    description: 'Edita tarefa. Status:"Concluído" pode disparar libera-parcela cross-cascata.',
    action: 'updateProducao',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        rowIndex: { type: 'number' },
        fields: { type: 'object' },
      },
      required: ['fields'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_get_producao_kpis',
    description: 'KPIs engenharia: projetos ativos, em andamento, concluídas mês, atrasadas, bloqueadas, velocity por modelista.',
    action: 'getProducaoKPIs',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },

  // ═══ CENTRAL DE INTELIGÊNCIA ═══
  {
    name: 'crm_get_cross_kpis',
    description: 'KPIs CONSOLIDADOS das 4 áreas + margem real do mês (com -11% imposto). USE NO 1º TURNO pra abrir conversa com snapshot completo.',
    action: 'getCrossKPIs',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_get_active_alerts',
    description: 'Lista priorizada de alertas (todas áreas) — inclui detecção cross (ex: tarefa concluída libera parcela). USE pra alertas proativos no início do dia.',
    action: 'getActiveAlerts',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_get_daily_briefing',
    description: 'Briefing matinal pronto em texto markdown. Útil pra postar como mensagem inicial.',
    action: 'getDailyBriefing',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },

  // ═══ APRENDIZADOS V7.12 (memória institucional ilimitada) ═══
  {
    name: 'crm_ensure_aprendizados',
    description: 'Garante que a aba Aprendizados existe. One-shot — chame só se outras chamadas falharem com "aba não existe".',
    action: 'ensureAprendizados',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'crm_add_learning',
    description: 'Salva uma lição na memória institucional (substitui o teto 30×500 chars do claude.ai nativo). ID auto-gerado APR-NNNN.',
    action: 'addLearning',
    inputSchema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', description: 'Resumo curto, ≤80 chars idealmente' },
        conteudo: { type: 'string', description: 'Texto livre, SEM LIMITE de tamanho' },
        categoria: { type: 'string', enum: ['Cliente', 'Padrao', 'Regra', 'Webhook', 'Identidade', 'Fluxo', 'Equipe', 'Tecnico', 'Email', 'Financeiro', 'Precificacao', 'Processo', 'pessoal'], description: 'Enum canônico (o GAS normaliza acento/caixa). "pessoal" é reservada à Sofia — nunca sai em consultas sem flag explícita.' },
        tags: { type: 'string', description: 'CSV: ex "perda,fora-pr,brasilia"' },
        clienteRelacionado: { type: 'string' },
        numeroProposta: { type: 'string' },
        data: { type: 'string', description: 'DD/MM/AAAA — default hoje' },
      },
      required: ['titulo', 'conteudo'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_get_learnings',
    description: 'Busca lições por filtros. USE NO 1º TURNO de cada sessão pra carregar contexto histórico. RETORNO em chave results (não itens) ⚠️.',
    action: 'getLearnings',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Buscar por ID exato (APR-NNNN)' },
        categoria: { type: 'string' },
        tags: { type: 'string', description: 'CSV — TODAS as tags devem estar presentes' },
        cliente: { type: 'string', description: 'Substring match em clienteRelacionado' },
        numeroProposta: { type: 'string' },
        search: { type: 'string', description: 'Busca livre em titulo+conteudo+tags' },
        limit: { type: 'number', description: 'Limita número de resultados' },
        incluirPessoal: { type: 'boolean', default: false, description: 'Categoria "pessoal" (Sofia) só sai com esta flag explícita — a trava é no servidor (GAS), não aqui.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'crm_update_learning',
    description: 'Refina uma lição existente (corrige, expande, atualiza). Retorna diff de/para.',
    action: 'updateLearning',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'APR-NNNN' },
        titulo: { type: 'string' },
        conteudo: { type: 'string' },
        categoria: { type: 'string' },
        tags: { type: 'string' },
        clienteRelacionado: { type: 'string' },
        numeroProposta: { type: 'string' },
        data: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_delete_learning',
    description: 'Remove lição obsoleta. ⚠️ IRREVERSÍVEL.',
    action: 'deleteLearning',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'APR-NNNN' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },

  // ═══ ASSISTENTE PESSOAL (Email + Meet) ═══
  {
    name: 'crm_send_email',
    description: 'Envia email arbitrário pelo Gmail. Sempre confirme conteúdo em tabela com usuário antes — irreversível.',
    action: 'sendEmail',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Email destinatário' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Texto plano OU use htmlBody' },
        htmlBody: { type: 'string', description: 'HTML body — preferir quando formatado' },
        cc: { type: 'string' },
        bcc: { type: 'string' },
      },
      required: ['to', 'subject'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_create_meet_event',
    description: 'Cria evento Calendar com link Meet automático. Datas ISO 8601 com TZ (ex: 2026-05-26T14:00:00-03:00).',
    action: 'createMeetEvent',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        startISO: { type: 'string', description: 'ISO 8601 com TZ' },
        endISO: { type: 'string', description: 'ISO 8601 com TZ' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Emails dos participantes' },
        description: { type: 'string' },
        location: { type: 'string' },
        timeZone: { type: 'string', default: 'America/Sao_Paulo' },
      },
      required: ['title', 'startISO', 'endISO'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_list_meet_suggestions',
    description: 'Sugere horários livres entre N participantes na janela dada.',
    action: 'listMeetSuggestions',
    inputSchema: {
      type: 'object',
      properties: {
        attendees: { type: 'array', items: { type: 'string' } },
        startISO: { type: 'string' },
        endISO: { type: 'string' },
        durationMinutes: { type: 'number', default: 30 },
        startHour: { type: 'number', default: 9 },
        endHour: { type: 'number', default: 18 },
        excludeWeekends: { type: 'boolean', default: true },
      },
      required: ['attendees', 'startISO', 'endISO'],
      additionalProperties: false,
    },
  },
  {
    name: 'crm_list_upcoming_events',
    description: 'Lista próximos eventos da agenda.',
    action: 'listUpcomingEvents',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7 },
        max: { type: 'number', default: 20 },
      },
      additionalProperties: false,
    },
  },
];

// ───────────────────────────────────────────────
// Param "actor" nas tools de ESCRITA (GER-08)
// Auditoria hoje grava tudo como 'IA (gerente)' — impossível saber QUAL
// gerente escreveu. Cada tool de escrita ganha o param opcional "actor";
// como callWebhook faz `{ actor: 'IA (gerente)', ...params }`, o valor
// enviado pela IA sobrescreve o default e chega ao audit log do GAS.
// ───────────────────────────────────────────────
const WRITE_ACTIONS = new Set<string>([
  // Vendas
  'update', 'bulkUpdate', 'addLead',
  // Propostas
  'generateProposal',
  // Anexos
  'linkAttachment', 'uploadAttachment', 'deleteAttachment',
  // Financeiro
  'addPaymentPlan', 'updatePayment', 'markPaid', 'setCashBalance',
  // Operação / TopoPartners
  'addTopoPartner', 'addTopoPartnerParcelado', 'updateTopoPartner', 'deleteTopoPartner',
  // Mapa de Parceiros
  'addParceiro', 'updateParceiro', 'deleteParceiro',
  // Engenharia / Producao
  'addProducao', 'bulkAddProducao', 'updateProducao',
  // Aprendizados
  'ensureAprendizados', 'addLearning', 'updateLearning', 'deleteLearning',
  // Assistente (efeitos externos reais)
  'sendEmail', 'createMeetEvent',
]);

const ACTOR_PARAM_SCHEMA = {
  type: 'string',
  description: 'Seu nome de gerente (Rafaela/Vanessa/Beatriz/Fernanda/Camila/Sofia) — obrigatório por convenção',
} as const;

for (const t of TOOLS) {
  if (!WRITE_ACTIONS.has(t.action)) continue;
  const schema = t.inputSchema as { properties?: Record<string, unknown> };
  schema.properties = { ...(schema.properties ?? {}), actor: ACTOR_PARAM_SCHEMA };
}

// ───────────────────────────────────────────────
// JSON-RPC 2.0 MCP endpoint
// ───────────────────────────────────────────────
type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

async function handleMcpRequest(req: JsonRpcRequest, env: Env): Promise<JsonRpcResponse> {
  const { method, params = {}, id } = req;
  try {
    switch (method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'toposcan-crm-mcp',
              version: SERVER_VERSION,
              description: `Toposcan CRM webhook V7.12 wrapper — ${TOOLS.length} ferramentas para Rafaela/Beatriz/Vanessa/Fernanda executarem ações reais`,
            },
          },
        };
      }
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return { jsonrpc: '2.0', id: id ?? '', result: null };

      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: TOOLS.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
            })),
          },
        };
      }

      case 'tools/call': {
        const toolStart = Date.now();
        const toolName = params.name as string;
        const args = (params.arguments as Record<string, unknown>) ?? {};
        const tool = TOOLS.find((t) => t.name === toolName);
        if (!tool) {
          logEvent('tool_call', {
            tool: toolName,
            ok: false,
            latency_ms: Date.now() - toolStart,
            error_code: -32602,
            error: 'tool_not_found',
          });
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Tool not found: ${toolName}` },
          };
        }
        let toolOk = false;
        let toolErr: string | undefined;
        try {
          const result = await callWebhook(env.WEBHOOK_URL, env.WEBHOOK_SECRET, tool.action, args);
          const upstreamOk = (result as { ok?: boolean } | null)?.ok;
          toolOk = upstreamOk !== false;
          if (!toolOk) {
            const e = (result as { error?: string } | null)?.error;
            toolErr = e ? String(e) : 'upstream_ok_false';
          }
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result,
            },
          };
        } catch (err) {
          toolErr = err instanceof Error ? err.message : String(err);
          throw err;
        } finally {
          logEvent('tool_call', {
            tool: toolName,
            action: tool.action,
            ok: toolOk,
            latency_ms: Date.now() - toolStart,
            arg_keys: Object.keys(args),
            error: truncate(toolErr),
          });
        }
      }

      case 'resources/list':
      case 'prompts/list':
        return { jsonrpc: '2.0', id, result: { [method.split('/')[0]]: [] } };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent('error', { method, error: truncate(msg, 500) });
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: msg,
      },
    };
  }
}

// ───────────────────────────────────────────────
// HTTP routes
// ───────────────────────────────────────────────

app.get('/', (c) =>
  c.json({
    name: 'toposcan-crm-mcp',
    version: SERVER_VERSION,
    build: SERVER_BUILD,
    description: `MCP server wrappeando webhook Toposcan CRM V7.12 — ${TOOLS.length} ferramentas`,
    endpoints: {
      mcp: 'POST /mcp (JSON-RPC 2.0)',
      health: 'GET /health',
      metrics: 'GET /metrics',
    },
    tools_count: TOOLS.length,
  })
);

// Tools críticas — verificadas em paralelo no /health
const HEALTH_CRITICAL_TOOLS: { tool: string; action: string }[] = [
  { tool: 'crm_get_cross_kpis', action: 'getCrossKPIs' },
  { tool: 'crm_get_active_alerts', action: 'getActiveAlerts' },
  { tool: 'crm_list_payments', action: 'listPayments' },
];

app.get('/health', async (c) => {
  const start = Date.now();
  const checks = await Promise.all(
    HEALTH_CRITICAL_TOOLS.map(async ({ tool, action }) => {
      const cStart = Date.now();
      try {
        const r = (await callWebhook(c.env.WEBHOOK_URL, c.env.WEBHOOK_SECRET, action)) as { ok?: boolean };
        return { tool, ok: r?.ok === true, latency_ms: Date.now() - cStart, error: null as string | null };
      } catch (e) {
        return {
          tool,
          ok: false,
          latency_ms: Date.now() - cStart,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );
  const allOk = checks.every((x) => x.ok);
  const total_ms = Date.now() - start;
  logEvent('health_check', { ok: allOk, latency_ms: total_ms, failed: checks.filter((x) => !x.ok).map((x) => x.tool) });
  return c.json(
    {
      ok: allOk,
      mcp: 'alive',
      version: SERVER_VERSION,
      build: SERVER_BUILD,
      tools_count: TOOLS.length,
      total_latency_ms: total_ms,
      checks,
    },
    allOk ? 200 : 503
  );
});

// /metrics — snapshot estático do servidor + lista de tools
// Aggregação histórica vive nos Workers Logs (wrangler tail + console.log estruturado)
app.get('/metrics', (c) => {
  const toolsByPrefix: Record<string, number> = {};
  for (const t of TOOLS) {
    const m = t.name.match(/^crm_([a-z]+)/);
    const prefix = m ? m[1] : 'other';
    toolsByPrefix[prefix] = (toolsByPrefix[prefix] || 0) + 1;
  }
  return c.json({
    server: {
      name: 'toposcan-crm-mcp',
      version: SERVER_VERSION,
      build: SERVER_BUILD,
    },
    tools: {
      total: TOOLS.length,
      by_prefix: toolsByPrefix,
      list: TOOLS.map((t) => t.name),
    },
    observability: {
      logs: 'structured JSON via console.log — wrangler tail / Workers Logs panel',
      health_endpoint: '/health',
      critical_tools_smoked: HEALTH_CRITICAL_TOOLS.map((x) => x.tool),
    },
    notes: 'Métricas históricas agregadas vivem nos Workers Logs. Para alerting, configurar Logpush -> R2.',
  });
});

app.post('/mcp', async (c) => {
  const body = (await c.req.json()) as JsonRpcRequest | JsonRpcRequest[];
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((r) => handleMcpRequest(r, c.env)));
    return c.json(results);
  }
  const result = await handleMcpRequest(body, c.env);
  return c.json(result);
});

// Compatibilidade: alguns clientes esperam POST na raiz
app.post('/', async (c) => {
  const body = (await c.req.json()) as JsonRpcRequest | JsonRpcRequest[];
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((r) => handleMcpRequest(r, c.env)));
    return c.json(results);
  }
  const result = await handleMcpRequest(body, c.env);
  return c.json(result);
});

// ───────────────────────────────────────────────
// Cron Trigger — auto-health check periódico (6h interval)
// Falhas são registradas como Aprendizado na memória institucional do CRM,
// fechando o loop: as 4 IAs gerentes enxergam o incidente sem alguém ter que avisar.
// ───────────────────────────────────────────────
async function runScheduledHealthCheck(env: Env): Promise<void> {
  const start = Date.now();
  const checks = await Promise.all(
    HEALTH_CRITICAL_TOOLS.map(async ({ tool, action }) => {
      const cStart = Date.now();
      try {
        const r = (await callWebhook(env.WEBHOOK_URL, env.WEBHOOK_SECRET, action)) as { ok?: boolean };
        return { tool, ok: r?.ok === true, latency_ms: Date.now() - cStart, error: null as string | null };
      } catch (e) {
        return {
          tool,
          ok: false,
          latency_ms: Date.now() - cStart,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );
  const allOk = checks.every((x) => x.ok);
  const total_ms = Date.now() - start;
  const failedTools = checks.filter((x) => !x.ok).map((x) => x.tool);

  logEvent('health_check', {
    source: 'cron',
    ok: allOk,
    latency_ms: total_ms,
    failed: failedTools,
    checks,
  });

  if (!allOk) {
    // Registra incidente como Aprendizado (V7.12). Best-effort — não trava o cron.
    try {
      await callWebhook(env.WEBHOOK_URL, env.WEBHOOK_SECRET, 'addLearning', {
        titulo: `MCP health falhou: ${failedTools.join(', ')}`,
        conteudo: `Cron health check em ${new Date().toISOString()} detectou falha em ${failedTools.length} tool(s).\n\n${JSON.stringify(checks, null, 2)}`,
        categoria: 'Tecnico',
        tags: 'mcp,health,incidente,cron',
      });
    } catch (e) {
      logEvent('error', {
        context: 'addLearning_from_cron',
        error: truncate(e instanceof Error ? e.message : String(e), 300),
      });
    }
  }
}

export default {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduledHealthCheck(env));
  },
};
