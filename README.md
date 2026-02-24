# CRM Toposcan

Sistema de CRM (Customer Relationship Management) da Toposcan para gerenciamento de propostas e clientes.

## Acesso

- **URL:** https://toposcansend-cmyk.github.io/CRM/
- **Login:** Solicitar credenciais ao administrador

## Funcionalidades

- 📊 Dashboard com KPIs e métricas de vendas
- 📋 Lista de propostas com filtros por status, vendedor e período
- 📈 Kanban pipeline de vendas
- 💰 Calculadora de precificação
- 📅 Sistema de follow-up com priorização
- 🔍 Insights e oportunidades automáticas

## Stack

- Frontend: HTML/CSS/JavaScript (single-page)
- Dados: Google Sheets como banco de dados
- Sync: Python (crm-sync.py) + Google Sheets API
- Deploy: GitHub Actions → GitHub Pages

## Segurança

- Login com autenticação SHA-256
- Deploy isolado (apenas arquivos públicos)
- Sessão de 8 horas com logout
