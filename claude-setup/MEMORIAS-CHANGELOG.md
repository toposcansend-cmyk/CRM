# 📜 Changelog das Memórias — Toposcan/Claude

> Sempre que algum Claude (Guilherme ou Marcelo) atualizar memórias localmente, **registrar aqui**.
> O outro sócio, ao rodar `verificar-atualizacoes.ps1` no PC dele, vê o que mudou e propõe atualizar.

---

## Como funciona

1. **Guilherme** atualiza memória em `~/.claude/projects/.../memory/*.md`
2. **Claude do Guilherme** copia automaticamente pra `claude-setup/memorias/` e commita
3. **Claude do Guilherme** adiciona entrada NESTE arquivo
4. **Marcelo** abre o Claude Code no PC dele
5. Claude do Marcelo lê este changelog (CLAUDE.md instrui a fazer isso)
6. Se houver mudanças mais recentes que a última sync local, propõe atualizar
7. Marcelo confirma → `git pull && instalar-memorias.ps1` → memórias sincronizadas

---

## Entradas

### 2026-05-26 — V7.12 + nomeação das IAs gerentes (Guilherme)

**Resumo:** Deploy V7.12 Aprendizados (aba `Aprendizados` + 5 actions = memória institucional ilimitada da Rafaela), e nomeação dos 4 gerentes Claude: Rafaela (Comercial) · Beatriz (Engenharia) · Vanessa (Financeiro) · Fernanda (Operação). Vendedora humana Rafaela limpada de todas as referências (desligada).

**Memórias atualizadas:**
- `MEMORY.md` — nova seção "4 Gerentes Claude" indexando os 4 nomes
- `project_crm_toposcan.md` — V7.7 → V7.12, tabela de gerentes com nomes, login sem Rafaela
- `reference_crm_api.md` — V7.12 + tabela completa das 5 actions de Aprendizados (chave de retorno `results`)
- `error_patterns.md` — adicionado `getLearnings → results` na lista E010
- `user_guilherme.md` — Rafaela vendedora removida do time
- `project_crm_manual_operacional.md` — tabela de vendedores atualizada (3 humanos + nota Rafaela-IA)
- `project_crm_discrepancias.md` — §4 "Rafaela ausente do Auth" marcada como resolvida (desligamento)
- `learning_user_identification.md` — pistas de identificação atualizadas (Rafaela = IA, não humana)
- `feedback_crm_gestao.md` — regra 5 e bloco de pistas Guilherme/Marcelo atualizados
- `project_rafaela_gerente_comercial.md` — NOVO
- `project_beatriz_gerente_engenharia.md` — NOVO
- `project_vanessa_gerente_financeiro.md` — NOVO
- `project_fernanda_gerente_operacao.md` — NOVO

**Prompts dos Projects atualizados (mesmo commit):**
- `PROMPT-CLAUDE-COMERCIAL.md` — identidade Rafaela-IA + V7.12 + 4 colegas
- `PROMPT-CLAUDE-ENGENHARIA.md` — identidade Beatriz + V7.12 + 4 colegas
- `PROMPT-CLAUDE-FINANCEIRO.md` — identidade Vanessa + V7.8 Fluxo de Caixa + V7.12 + 4 colegas
- `PROMPT-CLAUDE-OPERACAO.md` — identidade Fernanda + V7.12 + 4 colegas

⚠️ Para refletir nos Projects do claude.ai (UI), ainda é necessário reaplicar via Chrome MCP — ver `BRIEFING-CLAUDE-MOBILE.md`.

---

### 2026-05-26 — V7.10/V7.11 (Guilherme)

**Resumo:** Fluxo de Caixa completo (V7.10/V7.11) + bug fixes + drag-and-drop sem confirmação + feedback visual ao marcar pago

**Memórias atualizadas:**
- `error_patterns.md` — +4 padrões novos (E009-E012)
- `reference_crm_api.md` — V7.10 + novos endpoints `getCashFlow`, `getCashBalance`, `setCashBalance`
- `project_crm_toposcan.md` — V7.11 estado atual
- `learning_user_identification.md` — preferências do Guilherme refinadas (drag sem confirm, feedback visual, sync entre máquinas)

**Funcionalidades novas no CRM:**
- Aba 💸 **Fluxo de Caixa** com timeline quinzenal (14 dias)
- Drag-and-drop de cards entre colunas reprograma data (sem confirmação)
- Cards de entrada/saída pagas hoje aparecem com badge ✓ PAGO
- Animação flash ao marcar pago
- Saldo bancário persistido (PropertiesService GAS)
- Cache stale-while-revalidate (carga 10x mais rápida)
- Prefetch automático ao logar

**Custos cadastrados:**
- 7 custos fixos mensais (R$ 19.900) + Milena R$ 800 = R$ 20.700/mês
- 3 pagamentos pra hoje (Amilton/Alexandre/Ana R3 — R$ 3.000)

**Bug fixes críticos:**
- E009: `_derivarStatus` recebia objeto em vez de array — 34 parcelas históricas viraram "atrasadas" fake
- E010: `lr.itens` → `lr.items` no `listTopoPartners`
- E011: pagas hoje agora aparecem com badge

**Ação pro Marcelo:** rodar `cd C:\Users\<user>\work\CRM && git pull && cd claude-setup && .\instalar-memorias.ps1`

---

### Como adicionar nova entrada (template)

```markdown
### YYYY-MM-DD — Versão/feature (Quem)

**Resumo:** 1-2 linhas

**Memórias atualizadas:**
- arquivo1.md — o que mudou
- arquivo2.md — o que mudou

**Funcionalidades novas:** (opcional)
- ...

**Bug fixes:** (opcional)
- ...

**Ação necessária:** o que o outro sócio deve fazer
```
