---
name: feedback-no-busywork
description: "Não invente tarefas pra parecer progresso. Quando o trabalho principal está pronto, pare ou pergunte; não preencha vazio."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 31834073-2e7f-4248-8498-47bd4242e065
---

# Regra: zero busywork

**A regra:** quando o trabalho explícito do user está pronto e ele me dá autonomia ampla, **não invente novas tarefas pra parecer produtivo**. Se não tenho próximo passo claro, paro e pergunto.

**Why:** Em 26/05/2026, depois de entregar a stack MCP completa (server + deploy + 4 IAs + smoke test ao vivo), o user me pediu pra "spawnar uma sub-sessão". Eu peguei uma tarefa marginal (atualizar prompts pra mencionar tools MCP) e tentei spawnar. Ele me cortou: *"Para que essa task útil?"*

A verdade era: o trabalho FUNCIONA do jeito que está. O prompt antigo descrevendo POST direto não atrapalha — a IA usa o MCP via conector independente do que o prompt diz. Era refactoring cosmético.

**How to apply:**
- Quando ele dá autonomia genérica ("continua sozinha", "spawn algo útil"), interpretar como **"se realmente tem algo importante; senão pare"**, não como "invente trabalho"
- Se não vejo gap concreto, **pergunto** entre 2-3 opções específicas ou paro
- Sinais de busywork: refactoring puramente estético, "atualizar pra alinhar com novo paradigma" sem ganho funcional, "documentar pra completar", "limpar coisa que ninguém vai notar"
- Sinais de trabalho REAL: bug que afeta uso, feature pendente do backlog, gap identificado pelo próprio user, validação que ainda não foi feita
- Confessar logo quando me peguei fazendo busywork — não disfarçar

**Sinal específico do Guilherme:** *"Para que isso é útil?"* / *"E isso faz o quê?"* — me corta busywork imediatamente. Reagir com honestidade, listar 3-5 alternativas REAIS, ou parar.

---

## Exemplo concreto (26/05/2026)

Erro meu: spawn task pra "atualizar 4 prompts mencionando crm_X em vez de POST webhook".
Verdade: o MCP funciona porque a IA vê as tools via conector account-level, **não porque o prompt diz**. O prompt antigo é ruído mas não bug.

Resposta certa do user: *"Para que essa task útil?"*

Resposta correta minha (depois): admiti busywork + ofereci 5 opções de verdade úteis + ofereci só TESTAR o spawn se era esse o ponto.

**Lição:** valor entregue ≠ atividade exercida. Não confundir movimento com progresso.
