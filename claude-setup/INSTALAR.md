# 🚀 Instalação do Claude Code com Inteligência Toposcan

> **Para:** Marcelo (ou qualquer outro membro da Toposcan que vá usar Claude Code)  
> **Tempo total:** ~15 minutos  
> **Resultado:** Claude Code no seu PC com a mesma inteligência, contexto e autonomia do PC do Guilherme.

---

## 📦 O que você vai ter ao final

✅ **12 memórias instaladas** sobre Toposcan, o ecossistema, identidades, regras, aprendizados, padrões técnicos  
✅ **CLAUDE.md** lido automaticamente ao abrir o projeto — Claude já sabe TUDO no primeiro turno  
✅ **API CRM** funcional (~30 actions) — pode gerenciar Vendas/Financeiro/Operação/Engenharia direto do chat  
✅ **Email + Meet** automáticos sob comando — "marca reunião amanhã 10h com X" e ele resolve  
✅ **Identificação automática** Guilherme vs Marcelo — adapta o tom à pessoa  
✅ **Aprendizado contínuo** — quanto mais você conversa, mais preciso ele fica

---

## ⚙️ Pré-requisitos (instalar UMA VEZ)

### 1. Claude Code
Se ainda não tem instalado:
- **Desktop:** Baixa em https://claude.com/download
- **Mobile (iOS/Android):** Loja oficial — também funciona, com mesma conta

### 2. Git
- https://git-scm.com/ (clica em "Download for Windows")
- Após instalar, em qualquer pasta abre terminal e configura:
  ```powershell
  git config --global user.name "Marcelo"
  git config --global user.email "marcelo@toposcan.com.br"
  ```

### 3. Node.js (pra clasp e MCPs)
- https://nodejs.org/ (versão LTS)
- Após instalar, abre PowerShell e testa: `node --version`

### 4. GitHub CLI (opcional mas recomendado)
- https://cli.github.com/
- Após instalar: `gh auth login` (autoriza com sua conta GitHub)

---

## 🎯 Passo 1: Clonar o repo CRM

Abre PowerShell e roda:

```powershell
cd $HOME
mkdir work -ErrorAction SilentlyContinue
cd work
git clone https://github.com/toposcansend-cmyk/CRM.git
cd CRM
```

Pronto. O repo está em `C:\Users\<seu-usuario>\work\CRM\`.

---

## 🧠 Passo 2: Instalar as memórias (AUTOMÁTICO)

Ainda no PowerShell, dentro de `C:\Users\<seu-usuario>\work\CRM\`:

```powershell
cd claude-setup
.\instalar-memorias.ps1
```

Se aparecer erro de **ExecutionPolicy**, use:
```powershell
powershell -ExecutionPolicy Bypass -File .\instalar-memorias.ps1
```

O script:
- Detecta seu usuário Windows automaticamente
- Cria a pasta `~/.claude/projects/C--Users-<seu-usuario>/memory/`
- Copia 12 arquivos `.md` com toda a inteligência acumulada
- Verifica pré-requisitos (Node, Git, GitHub CLI, clasp)
- Testa a API ao vivo do CRM
- Reporta o status final

---

## 🛠️ Passo 3: Instalar clasp (controle do backend GAS)

Pra o Claude conseguir mexer no backend (Google Apps Script):

```powershell
npm install -g @google/clasp
clasp login
```

Vai abrir o navegador. **Faça login com `toposcan.send@gmail.com`** (conta dona do GAS) ou com sua conta Google se você for adicionado como editor do script.

Verifica:
```powershell
clasp --version
clasp deployments
```

Deve listar os deployments existentes do CRM (~6 versões).

---

## 🔌 Passo 4: Conectar MCPs no Claude Code

Esses dão superpoderes ao Claude (Gmail, Calendar, Chrome). No app do Claude Code:

1. Vai em **Settings → MCP Servers**
2. Conecta os que aparecerem:
   - **Gmail** (faz drafts, lê emails)
   - **Calendar** (cria eventos, lista agenda)
   - **Chrome** (controla claude.ai pra reaplicar prompts)
   - **Computer Use** (se quiser controlar apps desktop)

Cada conexão pede autorização Google — autoriza com a conta da empresa.

---

## ✅ Passo 5: Testar tudo

Abre o Claude Code apontando pro repo CRM:

```powershell
cd C:\Users\$env:USERNAME\work\CRM
claude
```

Manda essa primeira mensagem:

> *"oi, tô testando o setup novo. faz um briefing rápido pra mim, sou o Marcelo"*

Resposta esperada (algo como):

```
Bom dia, Marcelo. 🛠️

Snapshot rápido da operação:

🛠️ Engenharia (sua área):
  • 11 projetos ativos, 8 tarefas em andamento
  • 10 concluídas no mês
  • Jean com 3 nuvens em paralelo (atenção)

💼 Operação:
  • R$ 31.060 em custos do mês
  • Amilton com pagamento pendente do GEPLAN

🔴 Top alertas:
  1. Setor 2 GEPLAN bloqueado há 7d (RTK Amilton)
  2. Mesh Catedral S. Ana — Luiza, prev 25/05

Por onde a gente começa?
```

Se ele responder algo assim, tudo certo. ✅

---

## 🆘 Troubleshooting

### "Claude Code não encontra as memórias"
Verifica se a pasta foi criada corretamente:
```powershell
ls ~/.claude/projects/C--Users-$env:USERNAME/memory/
```

Deve listar 12 arquivos `.md`. Se não, roda o script de novo.

### "clasp pede autorização toda vez"
Provavelmente o `~/.clasprc.json` não foi salvo. Roda `clasp login` de novo dentro do PowerShell admin.

### "API retorna erro 'Você não tem permissão'"
Significa que a conta Google que você logou não tem acesso ao script GAS. Pede pro Guilherme adicionar você como editor em https://script.google.com/home/projects/1Pxlm30KKFm2z2Zcc8I4tLZfIa_Y5Yimh9GbD62cZWSdkSPANM59tJXBK/edit (Compartilhar → marcelo@toposcan.com.br).

### "MCP Chrome não funciona"
Instala a extensão Claude in Chrome no seu navegador e autoriza a conta.

### "O Claude não me identifica como Marcelo"
A primeira vez ele vai inferir pelo vocabulário/foco. Se errar, corrige uma vez: *"sou o Marcelo"* — ele aprende e registra na memória `learning_user_identification.md`.

---

## 📚 Arquivos importantes pra conhecer

Depois que instalar, fique à vontade pra abrir e LER os arquivos das memórias:

```
~/.claude/projects/C--Users-<seu-usuario>/memory/
├── MEMORY.md                                — índice navegável
├── user_marcelo.md                          — perfil seu (refine se quiser)
├── user_guilherme.md                        — perfil do seu sócio
├── feedback_crm_gestao.md                   — 17 regras de como o Guilherme quer
├── learning_user_identification.md          — log de aprendizado (cresce sozinho)
├── project_crm_toposcan.md                  — estado completo do projeto
├── project_sofia_secretaria.md              — sobre a Sofia (assistente do Guilherme)
├── reference_crm_api.md                     — ~30 actions da API
├── technical_patterns_gas_oauth_chrome.md   — padrões técnicos reutilizáveis
└── ...
```

Você pode editar `user_marcelo.md` pra adicionar info que só você sabe sobre você (preferências, rotina, etc) — o Claude lê automaticamente toda nova conversa.

---

## 🎓 Diferença entre os 5 Claude Projects e Claude Code

| Canal | Pra que serve | Onde |
|---|---|---|
| **Claude Code** (este setup) | Editar código, mexer no backend, gestão completa | Seu PC (terminal) |
| **🌸 Sofia** | Secretária particular do Guilherme (agenda dele) | claude.ai/projects |
| **🎯 Gerente Comercial** | Funil, vendas, fechamento | claude.ai/projects |
| **💰 Gerente Financeiro** | Parcelas, recebimentos, inadimplência | claude.ai/projects |
| **💼 Gerente de Operações** | Custos, parceiros, equipamentos (sua área!) | claude.ai/projects |
| **🛠️ Gerente de Engenharia** | Produção técnica, modelistas (sua área!) | claude.ai/projects |

Os Claude Projects no claude.ai já estão configurados na conta do Guilherme — se vocês usam a mesma conta Claude, você acessa todos eles direto.

---

## 💡 Como usar no dia a dia

### Pelo Claude Code (PC)
```bash
cd C:\Users\$env:USERNAME\work\CRM
claude
```
Depois conversa normal: *"como tá a produção do GEPLAN?"*, *"manda email pro Amilton"*, *"marca reunião com Luiza quinta 14h"*.

### Pelo claude.ai (browser, mobile)
- Acessa um dos 5 Projects (Gerente Engenharia, Operações, etc)
- Manda mensagem direto — ele já tá contextualizado

### Pelo celular
- App Claude no celular → conversa avulsa: cola o `BRIEFING-CLAUDE-MOBILE.md` na 1ª mensagem
- OU acessa claude.ai mobile e usa os Projects (mesma conta)

---

## 🔄 Mantendo atualizado

Quando o Guilherme (ou eu) atualizar memórias/prompts:

```powershell
cd C:\Users\$env:USERNAME\work\CRM
git pull origin main
cd claude-setup
.\instalar-memorias.ps1
```

3 segundos pra ficar com a versão mais nova.

---

## ✨ Tá pronto

Qualquer dúvida, abre uma conversa nova no Claude Code e pergunta. Ele já sabe te ajudar.

Bem-vindo ao ecossistema, Marcelo. 🛠️
