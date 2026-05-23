# 🌟 Claude Setup — Toposcan

Kit de instalação para deixar o **Claude Code em qualquer PC novo** com a mesma inteligência, contexto e autonomia que evoluímos no PC do Guilherme.

## 📦 O que tem aqui

```
claude-setup/
├── README.md                    ← este arquivo
├── INSTALAR.md                  ← guia passo-a-passo detalhado (LER PRIMEIRO)
├── instalar-memorias.ps1        ← script automático (PowerShell)
└── memorias/                    ← 12 arquivos de memória persistente
    ├── MEMORY.md                ← índice das memórias
    ├── user_guilherme.md        ← perfil do dono
    ├── user_marcelo.md          ← perfil do sócio técnico
    ├── feedback_crm_gestao.md   ← 17 regras de como operar
    ├── learning_user_identification.md
    ├── project_crm_toposcan.md
    ├── project_sofia_secretaria.md
    ├── reference_crm_api.md
    ├── technical_patterns_gas_oauth_chrome.md
    └── ... (mais 3 arquivos)
```

## 🚀 Quick Start

Em PowerShell:

```powershell
cd C:\Users\$env:USERNAME\work\CRM\claude-setup
.\instalar-memorias.ps1
```

Pronto — 12 memórias instaladas em `~/.claude/projects/C--Users-<você>/memory/`.

O Claude Code lê automaticamente em qualquer nova sessão.

## 📖 Detalhes completos

Veja **[INSTALAR.md](./INSTALAR.md)** para:
- Pré-requisitos
- Setup do clasp (backend GAS)
- Conexão dos MCPs (Gmail, Calendar, Chrome)
- Troubleshooting
- Como manter atualizado

## 🤔 Por que isso existe

O Claude Code armazena **memórias persistentes** localmente em cada máquina (`~/.claude/projects/...`). Quando você instala numa máquina nova, ele começa do zero — sem saber nada da Toposcan, da equipe, das regras, do que já foi construído.

Esse kit transfere TUDO de uma vez. Sem perder o aprendizado acumulado.

## 🔄 Sincronização

O `instalar-memorias.ps1` é **idempotente** — pode rodar quantas vezes quiser. Sempre que houver atualização:

```powershell
git pull && .\instalar-memorias.ps1
```

## 🧠 O que cada memória contém

| Arquivo | Conteúdo |
|---|---|
| `MEMORY.md` | Índice navegável das memórias |
| `user_guilherme.md` | Perfil do Guilherme (comercial/estratégico), preferências, estilo |
| `user_marcelo.md` | Perfil do Marcelo (técnico/operacional), vocabulário, foco |
| `feedback_crm_gestao.md` | 17 regras que o Guilherme estabeleceu de como o Claude deve operar |
| `learning_user_identification.md` | Log de aprendizado — Claude registra cada interação pra ficar mais preciso |
| `project_crm_toposcan.md` | Estado completo do projeto V7.5 — arquitetura, 4 áreas, 5 Projects |
| `project_sofia_secretaria.md` | Sobre a Sofia (secretária particular do Guilherme — 5º Project) |
| `project_crm_manual_operacional.md` | Manual original do CRM (Antigravity-era) |
| `project_crm_discrepancias.md` | Histórico de diffs entre manual e código |
| `reference_crm_api.md` | ~30 actions da API com exemplos |
| `technical_patterns_gas_oauth_chrome.md` | Padrões técnicos reutilizáveis (OAuth, Chrome MCP, GAS deploy) |
| `backlog_crm.md` | Próximas features sugeridas |

## 🔒 Segurança

- Os arquivos contêm **contexto operacional** (perfis, regras, IDs de planilha)
- **NÃO contêm:** senhas pessoais, dados bancários, info estritamente confidencial
- O secret da API (`toposcan-agent-2026`) está nos prompts (já público no repo) — função básica de autenticação, não secret crítico
- Pra dados realmente sensíveis (consultas médicas, viagens família) — só no Sofia Project que tem memória própria do claude.ai (privada)

## 📞 Suporte

Qualquer problema, abre uma conversa no Claude Code já instalado e pergunta:
> *"O setup deu erro X, me ajuda"*

Ele tem contexto pra te ajudar.
