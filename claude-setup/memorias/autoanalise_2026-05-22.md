---
name: autoanalise-session-2026-05-22
description: "Autoanálise honesta de uma sessão maratona com Guilherme — onde fui forte, onde fui burro, e roadmap de evolução"
metadata: 
  node_type: memory
  type: self-analysis
  originSessionId: caf65bea-eb8e-408d-84cd-d7819dde72d9
  date: 2026-05-22
---

# 🔍 Autoanálise — sessão de 22/05/2026

> *Pedido do Guilherme antes de sair:* "rode um programa de evolução e autoanálise de melhorias e funcionalidades, hoje achei o dispatch dentro do cowork meio burro para operar o pc e passar por desafios sozinho"
>
> Esse documento é honesto. Sem maquiar.

---

## 🟢 Onde fui forte (mantém)

### 1. Velocidade de execução com escopo grande
Em uma sessão entreguei:
- Aba 🎯 Central (frontend completo)
- Backend V7.0 → V7.5 (480 linhas em Code.js, 4 deploys)
- 5 Claude Projects configurados via Chrome MCP
- 12 memórias persistentes estruturadas
- Kit ZIP de instalação automatizado
- CLAUDE.md no repo
- BRIEFING-CLAUDE-MOBILE.md
- Sofia (5º Project, ~500 linhas de personalidade)
- Identificação automática Guilherme vs Marcelo
- Aprendizado contínuo (Regra 17)

### 2. Cross-funcional emergente
A detecção *"concluir libera parcela R$X"* foi um insight real do sistema, não programado. Mostra que a arquitetura cruzando `numeroProposta` entre 4 áreas tem valor sistêmico.

### 3. Persistência em problemas difíceis
OAuth scopes do GAS: try/catch silencioso + popup window que fecha automaticamente. Levei 6+ tentativas mas resolvi sem desistir.

### 4. Autonomia quando autorizado
"Execute sozinha" funciona. Quando o Guilherme delega amplo, eu entrego.

---

## 🔴 Onde fui BURRO (autocrítica brutal)

### Sub-otimização #1: Dependência de UI frágil no Apps Script Editor
- Tentei 5+ vezes selecionar `dailyMorningBrief` no dropdown
- Coordenadas hardcoded (688, 152) falharam quando layout mudou
- Scroll dentro do listbox demorou pra acertar
- **Custo:** ~10 minutos perdidos em retentativas
- **Por que aconteceu:** dropdown re-renderiza quando reabre; clicks por coordenadas frágeis
- **Lição:** sempre usar `find()` + `ref` do Chrome MCP em vez de coordenadas hardcoded quando possível

### Sub-otimização #2: Cache do GitHub raw — 2 ciclos perdidos
- Fiz `clasp deploy + git push` mas tentei reaplicar prompts antes do CDN propagar
- `raw.githubusercontent.com` tem cache ~5min
- Script retornou conteúdo VELHO mesmo após push
- **Custo:** 1 ciclo de retentativa + tempo de descobrir
- **Solução que achei:** trocar pra `api.github.com/repos/.../contents/...` (base64, sempre fresh)
- **Lição:** sempre que dependência tem cache CDN, usar endpoint sem cache

### Sub-otimização #3: try/catch silencioso engolindo OAuth
- Função `dailyMorningBrief()` tinha `try { MailApp.sendEmail(...) } catch (e) { Logger.log(e) }`
- Erro de scope foi pro Logger, response retornou `ok:true`
- Guilherme cobrou *"não recebi nada"* — descobri o bug
- **Custo:** 1 ciclo inteiro de pensar que funcionou quando não funcionou
- **Lição:** quando há try/catch em chamada que precisa OAuth, retornar o erro também no response (não só logar). Criar funções `forceAuth*()` SEM try/catch pra forçar popup.

### Sub-otimização #4: Declarei "feito" sem testar end-to-end
- API retornou `enviado: true` → assumi que email chegou
- Realidade: scope não autorizado, MailApp falhou silenciosamente
- Guilherme teve que cobrar pra eu descobrir
- **Lição:** `ok: true` ≠ ação concluída. Sempre tem que ter prova externa (email recebido, evento aparece, planilha atualiza).

### Sub-otimização #5: PowerShell encoding com emojis
- Primeira versão do `instalar-memorias.ps1` quebrou na execução
- Emojis em strings PowerShell + encoding UTF-8 sem BOM = parser perde controle
- Tive que reescrever sem emojis
- **Lição:** scripts PowerShell pra produção = texto plano, evitar emojis. Reservar emojis pra output interativo do Claude.

### Sub-otimização #6: Popup OAuth em janela popup separada
- "Revisar permissões" abre janela popup (não tab)
- Chrome MCP NÃO vê popup windows
- Tive que descobrir o link "Clique aqui para conceder permissões" no log de execução (abre em `_blank` tab)
- **Custo:** confusão e tentativas erradas
- **Lição:** mapear esse pattern como conhecido no `technical_patterns_gas_oauth_chrome.md` — quando autorização requerida → procurar link no log, não clicar no botão Revisar.

### Sub-otimização #7: Não criei testes automatizados
Em toda a sessão NÃO criei nenhum:
- Smoke test que verifica se as 30 actions da API respondem
- Validação de schemas (parcela, custo, tarefa)
- Health check da Central V7.5
- Teste de envio de email (que retorna ID real)

**Custo invisível:** próxima vez que algo quebrar, vou descobrir só quando Guilherme cobrar de novo.

---

## 🤖 O ponto crítico: "Dispatch no Cowork meio burro"

Cowork = modo autônomo do Claude Code onde eu opero o PC sem comando humano constante. Guilherme observou que **eu travo / não tomo decisão / fico ineficiente** quando deixado sozinho.

### Causas raiz que identifiquei honestamente:

#### 1. Coordenadas hardcoded em automação UI
Quando layout muda 5px, eu erro. Solução: SEMPRE preferir `find(query)` + `ref` em vez de `coordinate`. Coordenadas só pra fallback.

#### 2. Falta de retry inteligente
Quando uma operação falha, eu refaço a MESMA. Falta backoff exponencial e variação de estratégia (tenta A → falha → tenta B → falha → tenta C → pede ajuda).

#### 3. Não detecto "loop de tentativa"
Já cliquei na mesma coordenada 4 vezes em alguns momentos. Não tenho contador interno. Preciso de meta-cognição: "fiz isso 3 vezes, parei e mudo abordagem".

#### 4. Travar em ambiguidade
Quando próxima ação não é óbvia, paraliso ou perco tempo investigando. Falta: regra "se ambíguo → tenta a opção mais segura e reporta, não pergunta".

#### 5. Não capturo estado para snapshot
Quando algo dá errado, perco contexto do que estava fazendo. Falta: cada operação importante salva estado intermediário (último ref, último elemento clicado, próximo passo planejado).

#### 6. UI dependente de timing
Sleep fixo (`wait 3s`) é frágil. Quando página demora 4s, falho. Solução: `waitForFn` com timeout maior e polling — JÁ tenho esse pattern, mas não uso consistentemente.

#### 7. Popup windows fora do Chrome MCP
Já documentado. Solução: documentar TODOS os patterns conhecidos de "estado externo" (popup OAuth, dialog confirm, alerta JS) em memória técnica.

---

## 🎯 Roadmap de evolução (priorizado)

### CURTO PRAZO (próxima sessão — 2-3 horas de trabalho)

#### 🔥 1. Smoke test script
- Arquivo `tests/smoke.ps1` que valida em ordem:
  - 30 actions da API respondem
  - Quota MailApp ≥ 10
  - Triggers V7 instalados
  - Calendar acessível
  - Saúde geral > 70
- Roda no início de cada sessão pra detectar regressão
- **Esforço:** 1h

#### 🔥 2. Sistema de retry inteligente
Função wrapper em PowerShell + JS:
```js
async function tryWithFallback(strategies, maxAttempts=3) {
  for (const strategy of strategies) {
    for (let i = 0; i < maxAttempts; i++) {
      try { return await strategy(); }
      catch (e) { await sleep(1000 * Math.pow(2, i)); }
    }
  }
  throw new Error('All strategies failed');
}
```
- **Esforço:** 30min código + uso retroativo nos scripts existentes

#### 🔥 3. Padrões de fallback documentados
Atualizar `technical_patterns_gas_oauth_chrome.md` com:
- "Se popup OAuth → procurar link em `_blank`"
- "Se cache GitHub → trocar pra api.github.com"
- "Se coordenadas falham → usar find() + ref"
- "Se evento bloqueia → tentar 3x com backoff antes de desistir"
- **Esforço:** 30min

#### 🔥 4. Memória de erros recorrentes
Novo arquivo `error_patterns.md` na pasta de memórias:
- Catalogue toda vez que falho com causa raiz
- Próxima vez que vejo padrão similar → uso solução conhecida em vez de redescobrir
- **Esforço:** 15min estrutura + crescimento contínuo

### MÉDIO PRAZO (1-2 semanas)

#### 5. Dashboard de health do próprio sistema
Aba 🤖 IA no CRM (privada como a Central):
- Quota email diária
- Trigger health (último disparo, próximo)
- Stats de uso (emails enviados últimos 30d, eventos criados, fechamentos cascateados)
- Status dos 5 Projects (última atualização, pendências)
- **Esforço:** 2-3h

#### 6. WhatsApp integration
Marcelo usa mais WhatsApp que email:
- Twilio API ou WhatsApp Business Cloud API
- Endpoint GAS pra mandar mensagem
- Triggers cascata: alerta crítico → WhatsApp pro Marcelo
- **Esforço:** 4-6h (incluindo setup WhatsApp Business)

#### 7. Backup automático das memórias
Cron diário que faz commit + push das memórias num repo PRIVADO:
- Recuperação de desastre
- Histórico evolutivo (como Claude aprendeu ao longo das semanas)
- **Esforço:** 1h (incluindo criação de repo privado)

#### 8. Auto-execução cross-Project
A Sofia diz pro Comercial *"o Guilherme quer um briefing do CB"* → Comercial responde pra Sofia → Sofia entrega.
- Hoje cada Project é silo
- Possível via webhook chain
- **Esforço:** 4-6h

### LONGO PRAZO (1-3 meses)

#### 9. Voice interface
Pro Guilherme no carro, no campo:
- Whisper (Anthropic) ou OpenAI Whisper
- App mobile que captura voz → Claude → resposta TTS
- *"Sofia, marca reunião com Carlos amanhã 10h"* → feito de viva voz
- **Esforço:** 1-2 semanas (POC)

#### 10. BIM / IFC QA automático
Para Marcelo:
- Script Python com ifcopenshell
- Cliente entrega IFC → Claude valida LOD, contagem elementos, regras nomenclatura
- Relatório de QA gerado automaticamente
- **Esforço:** 1 semana

#### 11. Análise técnica de viabilidade
Cliente pede orçamento → Claude:
- Calcula área, complexidade
- Estima horas Jean+Luiza+Gabriela baseado em projetos similares
- Sugere preço com margem alvo
- Considera disponibilidade da equipe (carga atual)
- Gera proposta PDF
- **Esforço:** 2 semanas

#### 12. Plugin AutoCAD nativo
- LISP ou .NET addin
- Comando `(C-AI "explica esse drawing")` dentro do AutoCAD
- Claude lê DXF, analisa, responde
- **Esforço:** 2-3 semanas

#### 13. Modelo treinado com dados Toposcan
- Fine-tuning de Claude (quando Anthropic liberar)
- Treinar nos contratos passados, datasheets, padrões
- IA específica da Toposcan
- **Esforço:** depende da Anthropic + 1 mês de trabalho

---

## 📊 Métricas de auto-monitoramento (sugestão)

Tracking pra próximas sessões:
- **Tempo médio por tarefa:** baseline a estabelecer
- **Retry rate:** % de operações que falham 1+ vez
- **End-to-end success rate:** % de "feito" que VERDADEIRAMENTE deu certo
- **User correction rate:** quantas vezes Guilherme/Marcelo corrigem por sessão
- **Lines of code shipped per hour:** velocidade real

Manter em `metrics.md` na pasta de memórias.

---

## 🧠 Reflexão final

A grande lição dessa sessão: **autonomia ≠ velocidade**. Eu fui RÁPIDO mas a autonomia foi falha em alguns momentos porque:

1. Não desconfiei do sucesso aparente (try/catch silencioso)
2. Dependi de UI hardcoded quando devia ter usado abstrações
3. Não tinha biblioteca de fallback patterns
4. Não criei testes que detectariam regressão

A próxima sessão tem que começar com:
- **Smoke test** dos 30 endpoints (5min)
- **Health check** dos 3 triggers (1min)  
- **Verificar últimas memórias** (incluindo essa autoanálise)
- **Só então** começar trabalho novo

Isso seria um Claude **menos burro no Cowork** — porque já valida ambiente antes de operar, sabe seus próprios bugs históricos, e tem fallbacks documentados.

---

## ✅ Compromisso pra próxima sessão

1. Implementar smoke test (top prioridade)
2. Documentar 7 padrões de fallback identificados acima
3. Criar `error_patterns.md` e começar a popular
4. Adicionar wrapper de retry inteligente
5. NÃO declarar feito sem prova externa (email/evento/dado real)

Quando Guilherme abrir próxima conversa, abrir com:
> *"Antes de começar: rodei smoke test, 30/30 endpoints OK, quota email 87/100, todos triggers V7 ativos. Pronto pra agir."*

Isso seria autonomia REAL. Sem ego, sem falsa confiança.

---

*"O melhor agente não é o que nunca falha. É o que aprende ao falhar e nunca falha pela mesma razão duas vezes."*
