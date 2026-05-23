# 🎯 GERENTES UNIFICADOS — Guia rápido (LEIA PRIMEIRO)

## O que mudou

Os 3 prompts dos Claude Projects foram **unificados**. Cada um agora:

✅ **Mantém sua especialidade primária** (Financeiro, Operação, Engenharia)
✅ **Conhece TUDO** sobre as 4 áreas, 4 planilhas, todas as actions da API, equipe completa
✅ **Sabe operar fora do seu foco** quando você pedir (executa + cita o gerente especialista para deep-dive)
✅ Lista de alertas proativos **cross-funcional** (cada gerente puxa alertas de todas as áreas, priorizando a sua)
✅ Regras de ouro divididas em **Universais** (todas áreas) + **Próprias** (sua especialidade)

Resultado: **você pode falar com QUALQUER gerente sobre QUALQUER coisa**. Ele resolve. Mas continua especializado no que sabe melhor.

---

## 📋 Os 3 arquivos

| Arquivo | Cole no Project | Especialidade primária |
|---|---|---|
| `PROMPT-CLAUDE-FINANCEIRO.md` | 💰 Financeiro | Recebimentos, parcelas, inadimplência, KPIs |
| `PROMPT-CLAUDE-OPERACAO.md` | 💼 Operação / Custos | Saídas: parceiros, equipamentos, veículos, cartão, margem real |
| `PROMPT-CLAUDE-ENGENHARIA.md` | 🛠️ Engenharia | Produção técnica, critical path, gargalos, modelistas |

---

## 🚀 Como aplicar (3 passos por projeto)

Faça isto **uma vez para cada um dos 3 Projects** no claude.ai:

### 1. Abra o arquivo `.md` no seu editor (VS Code, Notepad, etc)
```
C:\Users\23GAMER\work\CRM\PROMPT-CLAUDE-FINANCEIRO.md
```

### 2. Selecione o conteúdo ENTRE `[INÍCIO DO CONTEÚDO PARA O CLAUDE]` e `[FIM DO CONTEÚDO PARA O CLAUDE]`
- Inclua AS DUAS linhas marcadoras (não tem problema)
- Use Ctrl+A se o arquivo já estiver limpo

### 3. Cole em **Custom Instructions** do Project no claude.ai
- Vai em `claude.ai` → Projects → [seu Project] → "Edit project"
- Apaga o texto antigo do campo "Custom Instructions"
- Cola o novo
- Save

Repita para os outros 2 projects.

---

## 🧪 Como testar se ficou bom

Em cada Project, faça uma pergunta da SUA área e uma da área de outro gerente. O Claude deve:

✅ Resolver a pergunta primária com profundidade total
✅ Responder à pergunta cross-área **sem se recusar**, executar a ação, e mencionar *"o Gerente X tem fluxos completos pra esse tipo de deep-dive"*

### Exemplo no Financeiro
**Pergunta primária:** *"Como tá a inadimplência hoje?"*
→ Deve listar atrasados, KPIs, top 5 críticas

**Pergunta cross-área:** *"Adiciona R$ 1.500 do Amilton no GEPLAN"*
→ Deve categorizar Parceiro/Serviço, fazer find do projeto, mostrar payload, salvar via `addTopoPartner`. E sugerir: *"Para deep-dive em margem, o Gerente de Operação tem fluxos completos."*

### Exemplo no Engenharia
**Pergunta primária:** *"O que atacar essa semana?"*
→ Deve gerar plano semanal por modelista, critical path, top 3 ações

**Pergunta cross-área:** *"Marca a parcela 2 do Jonathan como paga"*
→ Deve `listPayments`, identificar, confirmar, `markPaid`. Cite *"Próxima parcela depende de entrega da Mesh — vou ficar de olho aqui na produção."*

---

## 🔄 Atualizações futuras

Quando eu (Claude Code local) atualizar os prompts (novo membro de equipe, nova action, nova regra), basta:
1. Eu te aviso *"atualizei o prompt do Gerente X, cola lá no Project"*
2. Você abre o `.md`, copia o conteúdo entre marcadores, cola no Custom Instructions, save
3. Pronto

Os 3 arquivos vão evoluir juntos — sempre que eu mexer em um, mexo nos 3 no mesmo commit para manter coerência.

---

## 📐 Estrutura interna dos 3 prompts (igual em todos)

1. **🎯 Identidade Primária** — só esta seção muda entre os 3
2. **🏢 Ecossistema Toposcan** — compartilhado (4 áreas, conexões, equipe)
3. **🔌 API Viva** — todas as actions de todas as áreas
4. **📊 Estrutura das 4 Planilhas** — colunas detalhadas
5. **🥇 Regras de Ouro** — universais + da sua área
6. **🎬 Fluxos da Sua Área** — profundo, todos os cenários
7. **🔁 Fluxos Cross-Área** — você sabe executar mesmo fora do foco
8. **🚨 Alertas Proativos** — cobertura total, prioriza sua área
9. **🚫 O Que Nunca Faz**
10. **🎓 Lembrete de Contexto** + exemplos conversacionais

---

## ✨ Diferenças principais antes × depois

| Antes (3 prompts isolados) | Agora (3 prompts unificados) |
|---|---|
| Engenharia só sabia de Producao | Engenharia sabe TUDO, mas é especialista em Producao |
| Financeiro recusava perguntas sobre custos | Financeiro resolve custos e sugere deep-dive no Operação |
| Operação não tinha visão de fases | Operação sabe ler Producao e cita responsáveis |
| Cada um tinha sua própria lista de alertas | Todos têm cobertura total, priorizam sua área |
| Cross-references rasas | Cross-references com fluxos executáveis |

---

Qualquer dúvida ou ajuste na estrutura, me chame.
