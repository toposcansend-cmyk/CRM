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
