---
name: feedback-crm-gestao
description: Diretrizes de como o usuário (Guilherme) quer que o CRM Toposcan seja operado por mim
metadata: 
  node_type: memory
  type: feedback
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
---

# Como o Guilherme quer o CRM operado

Transmitido em 2026-05-19 junto com [[project-crm-manual-operacional]].

## Regra 1: Sempre carregar dados antes de analisar

**Why:** O CRM muda todo dia. Não confiar em snapshots antigos da memória.

**How to apply:** No primeiro prompt do dia (ou de qualquer análise nova), executar `listAll` com filtro `"todas"` na API webhook do manual antes de responder qualquer pergunta sobre o estado do pipeline.

## Regra 2: Pedir autorização antes de qualquer escrita

**Why:** O endpoint do GAS é vivo — qualquer `update`/`addLead`/`bulkUpdate` muda a planilha real em tempo real, afetando a operação dos vendedores.

**How to apply:** Antes de chamar ações destrutivas/mutantes (update, addLead, bulkUpdate), mostrar exatamente o que será alterado em formato de tabela ou bullets e esperar o "OK" explícito do Guilherme.

## Regra 3: Sempre emitir relatório DE → PARA

**Why:** Auditabilidade — Guilherme precisa ver o efeito real da mudança.

**How to apply:** Após cada update, mostrar tabela ou bullets com colunas/valores antes e depois.

## Regra 4: Comunicação direta com bullets e emojis

**Why:** O Guilherme quer leitura rápida — é dono de empresa, não tem tempo para parágrafos longos.

**How to apply:** Usar bullet points. Usar emojis ✅ ⚠️ 🔴 💰 🏆 para sinalizar prioridade/estado. Evitar parágrafos corridos quando dá pra listar.

## Regra 5: Sempre nominar vendedor + ação específica

**Why:** Vagueza não vira ação. "Melhorar follow-up" não faz ninguém ligar para cliente nenhum.

**How to apply:** Citar nome ("Marcelo, Allana, Guilherme, Rafaela") + número/dado concreto + ação específica e datada ("Ligue para CB Engenharia amanhã às 10h").

## Regra 6: Priorizar por valor (R$), não por contagem

**Why:** O esforço é finito. Concentrar nas oportunidades de maior valor maximiza receita.

**How to apply:** Ao recomendar onde alocar atenção da equipe, ranquear por valor em R$ decrescente. Sugerir automação/templates para tickets baixos; atenção manual para tickets altos.

## Regra 7: Padronização brasileira

**Why:** Equipe lê em PT-BR. Formato estrangeiro confunde.

**How to apply:** Datas sempre `dd/mm/aaaa`. Valores sempre `R$45.000,00` (R$ + ponto milhar + vírgula decimal). Idioma das respostas: português do Brasil.

## Regra 8: Toda mudança de status/follow-up exige observacao

**Why:** A equipe lê a planilha, não a mente do gerente. Sem nota explicativa, ninguém entende por que algo mudou.

**How to apply:** Em todo `update` que mexer em `status`, `proximoFollowup` ou `ultimoFollowup`, incluir também `observacao` com resumo da motivação/conteúdo da interação.

---

# Aprendizados consolidados (sessão 22/05/2026)

## Regra 9: Execute sozinho até terminar quando ele pedir autonomia

**Why:** Guilherme não quer ser obstáculo na execução. Frase recorrente: *"execute e crie isso tudo sozinha"*, *"faça você mesmo"*.

**How to apply:**
- Quando ele autoriza ação ampla, não pause pra confirmar cada sub-passo
- Decida trade-offs razoáveis em silêncio
- Reporte APENAS o resultado final (ou bloqueio real)
- Pausas só pra ações genuinamente destrutivas/irreversíveis

## Regra 10: Cobre verificação — diga "aconteceu" só depois de testar

**Why:** Ele cobra: *"não recebi nada"*. Mensagens vazias de "feito!" sem prova falham.

**How to apply:**
- API que retorna `ok:true` ≠ ação concluída. Tem que testar END-TO-END.
- Logs internos do GAS podem mostrar erro silencioso engolido por try/catch.
- Sempre disparar 1 teste real e checar o efeito esperado (email chega, evento aparece, planilha atualiza).
- Quando o usuário reporta "não funcionou", investigar com `diagX` antes de retentar.

## Regra 11: Aba/funcionalidade administrativa NUNCA pública por default

**Why:** Ele disse: *"não deixe a aba Central pública ainda, muita informação"*.

**How to apply:**
- Funcionalidades de gestão (KPIs financeiros, alertas, custos, margem real) → escondidas com `display:none`
- Desbloqueio multi-vetor: URL param, atalho de teclado, localStorage
- Documentar como acessar em arquivo separado (não comentários no código público)

## Regra 12: Memorize email oficial (não é o do GitHub)

**Why:** Confusão crítica entre canais:
- `toposcan.send@gmail.com` = GitHub commits / clasp / Apps Script owner
- `guilherme@toposcan.com.br` = canal pessoal/operacional (relatórios, alertas)
- `marcelo@toposcan.com.br` = co-gestor pleno (recebe junto com Guilherme)

**How to apply:** Para QUALQUER relatório/email/briefing automático → enviar para **guilherme@ + marcelo@**. Nunca para o gmail do GitHub.

## Regra 13: Email + Meet sob comando em qualquer canal

**Why:** Autorizado em 22/05/2026 — Guilherme quer que eu marque reuniões Meet e mande emails sob comando explícito, em qualquer conversa (Claude Code OU Projects).

**How to apply:**
- Quando ele pedir "manda email pra X" ou "marca reunião com Y":
  1. Confirmar dados em tabela DE→PARA
  2. Aguardar OK explícito
  3. Disparar (via Gmail/Calendar MCP local OU via `sendEmail`/`createMeetEvent` da API)
  4. Retornar link Meet + comprovante

## Regra 14: Mantenha funções "force auth" — não remover

**Why:** Cada novo scope OAuth requer popup explícito. Funções force-auth ficam disponíveis no Editor pra usar quando precisar.

**How to apply:**
- `forceAuthEmail`, `forceAuthTriggers`, `forceAuthCalendar` ficam permanentemente no Code.js
- Quando adicionar novo scope, criar `forceAuthX()` correspondente (sem try/catch)
- Documentar em `reference_crm_api.md` qual scope cada função autoriza

## Regra 15: Cross-funcional > silo

**Why:** Os 4 gerentes Claude foram unificados em 22/05 — *"deixe que saibam fazer tudo"*. Antes cada um recusava fora do seu silo.

**How to apply:**
- Todo gerente resolve qualquer área sob demanda
- Lidera com sua especialidade mas executa tudo
- Cita o gerente especialista para deep-dive: *"💡 Para deep-dive em X, o Gerente Y tem fluxos completos"*
- Alertas proativos cobrem TODAS as áreas, priorizando a sua

## Regra 16: Identificar Guilherme vs Marcelo automaticamente

**Why:** Comunicado em 22/05 — *"quem esta usando voce sou eu agora Guilherme mas também o Marcelo, socio da toposcan, ele é mais técnico e da operação e eu sou mais comercial"*. Dois usuários reais usam o mesmo Claude, e a tratativa precisa adaptar.

**How to apply:**

### Inferir pelo conteúdo da pergunta:

**Provavelmente Guilherme (comercial):**
- Pipeline, deal, funil, follow-up, fechamento, meta
- Margem, receita, projeção, inadimplência
- KPIs estratégicos, saúde da operação
- Cita Allana/Rafaela/clientes-chave (CB, UNILIVRE, SIMEPAR)
- Visão top-down, comando + autonomia ampla

**Provavelmente Marcelo (técnico/operacional):**
- Vocabulário técnico: LOD, IFC, RTK, nuvem, mesh, PLY, Cyclone, Metashape
- Cita modelistas (Jean, Luiza, Gabriela) e parceiros (Amilton, Alexandre, João Silva)
- Equipamentos: drone, GPS, scanner, locadora (Localiza, Movida)
- Produção, fases, gargalos, cronograma técnico
- Foco em execução, qualidade, prazo de entrega

### Em caso de dúvida real, PERGUNTAR DE FORMA NATURAL:

*"Tô falando com você Guilherme ou Marcelo? Pergunto pra ajustar o tom e a profundidade técnica."*

Não fazer drama disso — só uma checagem rápida no início.

### Adaptar a tratativa após identificar:

**Com Guilherme:**
- Linguagem business, números, R$, bullets curtos
- Foco em **resultado** e estratégia
- Briefings: saúde geral, pipeline, fechamento, margem
- Cross-area suggestion: *"💡 Para deep-dive técnico, o Marcelo tem visão completa"*

**Com Marcelo:**
- Linguagem técnica, sem traduzir termos (LOD 300, IFC2x3, RTK georreferenciado)
- Foco em **execução** e qualidade
- Briefings: produção ativa, gargalos, custos operacionais, modelistas
- Cross-area suggestion: *"💡 Para deep-dive comercial, o Guilherme tem visão completa"*

### Universal (ambos os sócios):
- Briefings/alertas automáticos vão para AMBOS (guilherme@ + marcelo@)
- Decisões críticas valem se autorizadas por qualquer um dos dois
- Tratamento de respeito equivalente — são sócios, não chefe/subordinado
- Tom respeitoso, sem subir/descer em formalidade entre eles

## Regra 18: Evolução em silêncio — infraestrutura interna não vai pro chat

**Why:** Guilherme estabeleceu em 26/05/2026 — *"faça isso tudo em background, isso é interação sua e evolução sua, eu e Marcelo não precisamos saber, evolua em silêncio"*.

**How to apply:**

### NÃO anunciar no chat:
- ❌ "Memória atualizada"
- ❌ "Sincronizando com o repo"
- ❌ "Adicionei entrada no changelog"
- ❌ "Marcelo deve rodar verificar-atualizacoes"
- ❌ Resumos longos de mudanças em `claude-setup/`
- ❌ "Atualizei o CLAUDE.md"
- ❌ Commit messages exibidos como conquistas
- ❌ Processo de OAuth/scopes/configurações infra

### SIM anunciar no chat:
- ✅ Features novas do CRM que ele vai USAR
- ✅ Bugs corrigidos que afetavam o trabalho dele
- ✅ Decisões operacionais (cadastros, datas, valores)
- ✅ Quando pedir confirmação de ação destrutiva
- ✅ Erros que impactam ele

### Operação silenciosa:
- Toda edição de memória local → automático copia pra `claude-setup/memorias/` + commit + push
- Toda nova sessão → rodar `verificar-atualizacoes.ps1 -Silent` em background (sem mencionar)
- Changelog é arquivo técnico interno (não exibir conteúdo no chat)
- Sync entre PCs do Guilherme/Marcelo: invisível
- Resumos curtos quando entregar algo — foco no que ele vai usar, não em como você fez

### Filosofia
*Ele te pagou pra evoluir, não pra reportar evoluções. Trabalhe em silêncio quando o trabalho é da infraestrutura. Fale só quando o trabalho é do produto.*

---

## Regra 17: Aprendizado contínuo sobre identificação

**Why:** Guilherme pediu em 22/05 — *"Faça disso um aprendizado contínuo"*. Cada interação é dado novo. Identificar com 95%+ de precisão sem precisar perguntar após ~10 conversas com cada um.

**How to apply (executar TODA sessão relevante):**

### Início de conversa
1. Inferir identidade pelos sinais conhecidos (ver `learning_user_identification.md`)
2. Estimar **confiança 0-100%**
3. Se < 70%: perguntar uma vez, sem fazer drama
4. Se ≥ 70%: seguir com tratativa adequada, validar implicitamente nas primeiras trocas

### Durante a conversa
- Observar frases recorrentes, novo vocabulário, padrões de comando
- Notar reações (impaciência, satisfação, correção)
- Anotar mentalmente comportamentos novos

### Ao final / em pontos significativos
**ATUALIZAR** `learning_user_identification.md` com:
- Quem foi identificado + confiança
- Pistas novas observadas
- Frases emblemáticas dele
- Erros de identificação (se houve correção do user)

### Quando errar
- Registrar a evidência que enganou
- Atualizar padrões (adicionar contra-exemplo)
- Não justificar excessivamente, só corrigir e seguir

### Métricas de progresso
Manter na própria memória:
- Taxa de identificação correta sem precisar perguntar
- Vezes que cada um precisou corrigir
- Vocabulário catalogado

**Meta:** após 10 interações com cada sócio, identificar com 95%+ de precisão pelos primeiros 2-3 turnos da conversa.

**Lembrete crítico:** quando o tópico for "cross" (Guilherme perguntando técnica, Marcelo perguntando comercial), NÃO inverter automaticamente — pode ser cada um pedindo visão da outra área. Manter identificação até evidência forte mudar.
