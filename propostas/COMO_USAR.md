# Sistema de Propostas Toposcan - Referência Rápida

## Para gerar uma nova proposta:

### 1. Dados necessários (me passe):
```
cliente: Nome do cliente
contato: Nome do contato
numero: 03/2026.XX
data: DD de mês de AAAA
resumo_objeto: Resumo do serviço
objeto: Texto completo do objeto
area: Local/endereço
servicos: Lista de serviços
produtos: Lista de produtos
valor: R$ XX.XXX,XX
pagamento: Condições
prazo: XX dias
assinatura_cliente: Nome para assinatura
```

### 2. Comando:
```
python gerar_proposta_v3.py dados.json
```

### 3. Arquivos:
- Template: `empresa/toposcan/propostas/TOPOSCAN_PROPOSTA_template_v3.docx`
- Script: `empresa/toposcan/propostas/gerar_proposta_v3.py`
- Propostas: `empresa/toposcan/propostas/`

---

*Atualizado: 04/03/2026*
