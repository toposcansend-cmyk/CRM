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

// ───────────────────────────────────────────────
// Helper: chama o webhook seguindo o redirect 302 do Apps Script
// ───────────────────────────────────────────────
async function callWebhook(
  url: string,
  secret: string,
  action: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const payload = { action, secret, ...params };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  if (!resp.ok) {
    throw new Error(`Webhook HTTP ${resp.status}: ${await resp.text()}`);
  }
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text, warning: 'Non-JSON response from webhook' };
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
        categoria: { type: 'string', enum: ['Cliente', 'Padrao', 'Regra', 'Webhook', 'Identidade', 'Fluxo', 'Equipe', 'Tecnico', 'Email', 'Financeiro'] },
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
              version: '1.0.0',
              description: 'Toposcan CRM webhook V7.12 wrapper — 33 ferramentas para Rafaela/Beatriz/Vanessa/Fernanda executarem ações reais',
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
        const toolName = params.name as string;
        const args = (params.arguments as Record<string, unknown>) ?? {};
        const tool = TOOLS.find((t) => t.name === toolName);
        if (!tool) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Tool not found: ${toolName}` },
          };
        }
        const result = await callWebhook(env.WEBHOOK_URL, env.WEBHOOK_SECRET, tool.action, args);
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
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err instanceof Error ? err.message : String(err),
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
    version: '1.0.0',
    description: 'MCP server wrappeando webhook Toposcan CRM V7.12 — 33 ferramentas',
    endpoints: {
      mcp: 'POST /mcp (JSON-RPC 2.0)',
      health: 'GET /health',
    },
    tools_count: TOOLS.length,
  })
);

app.get('/health', async (c) => {
  // Smoke test no webhook upstream
  try {
    const r = await callWebhook(c.env.WEBHOOK_URL, c.env.WEBHOOK_SECRET, 'getCrossKPIs');
    const ok = (r as { ok?: boolean }).ok === true;
    return c.json({ ok, mcp: 'alive', webhook: ok ? 'alive' : 'unexpected_response', tools_count: TOOLS.length });
  } catch (e) {
    return c.json({ ok: false, mcp: 'alive', webhook: 'error', error: String(e) }, 500);
  }
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

export default app;
