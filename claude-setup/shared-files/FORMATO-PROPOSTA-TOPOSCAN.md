# FORMATO-PROPOSTA-TOPOSCAN

Knowledge da **Camila** (IA gerente de propostas) e referência para o backend GAS
`generateProposal`. Descreve o template oficial de proposta comercial da Toposcan,
seus placeholders, e como mantê-lo.

> Construído em 2026-06-10 (Onda 1-B) a partir da proposta canônica
> `TOPOSCAN_PROPOSTA_02202624.0_Lizit_CORRIGIDO.docx` (cliente Lizit Arquitetura).

---

## 1. Como o documento é usado (fluxo)

1. **Template Doc** (Google Doc) vive no Drive corporativo.
2. GAS `generateProposal` faz `Drive.Files.copy` do Template Doc → nova cópia.
3. GAS aplica `body.replaceText('{{PLACEHOLDER}}', valor)` para cada campo variável.
4. Cópia preenchida é renomeada para o padrão e (opcional) exportada em PDF/docx.

O template **preserva 100% das seções institucionais fixas** (Apresentação,
Objetivo institucional, Serviços Oferecidos, Diferenciais, Figuras 1-3, Conclusão,
bloco de assinaturas Marcelo Ramos / Guilherme Becker). Só os campos abaixo mudam.

---

## 2. Anatomia do documento

### Seções FIXAS (nunca mexer — institucional)
- 1º "Proposta Comercial" (título)
- **Apresentação** — quem é a Toposcan
- **Objetivo** (institucional) — propósito da proposta
- **Serviços Oferecidos** — 1. Levantamento Topográfico / 2. Escaneamento 3D / 3. Monitoramento
- **Diferenciais Competitivos** — Tecnologia / Equipe / Soluções
- "Abaixo alguns exemplos de produtos:" + **Figuras 1, 2 e 3** (5 imagens institucionais)
- **Conclusão** — fechamento padrão
- "Agradecemos" (label fixo)
- **Tabela de assinaturas** — Marcelo Ramos · Guilherme Becker (FIXA, inclui imagens de assinatura)
- **Tabela 1 → linha "Serviços"** (cabeçalho fixo)
- **Tabela 1 → ressalva** "Ressalta-se que, em caso de alteração na metragem..." (fixa)

### Seções VARIÁVEIS (viram placeholders)
- Nome do cliente (topo + 2× no agradecimento final)
- Contato (A/C), número da proposta, data (Tabela 0 — cabeçalho)
- 2º "Proposta Comercial" → bloco variável: Objetivo específico, Área,
  Condições de Pagamento (Pagamento/Prazo), Observações
- Descrição do serviço e Valor Total (Tabela 1)

### Estrutura de tabelas
| Tabela | Dimensão | Conteúdo |
|---|---|---|
| Tabela 0 | 4×1 | `A/C: {{CONTATO}}` · `Proposta {{NUMERO}}` · (vazio) · `{{DATA}}` |
| Tabela 1 | 3×1 | "Serviços" (fixo) · `{{SERVICOS}}` · `Valor Total: {{VALOR}}` + ressalva (fixa) |
| Tabela 2 | 1×3 | Assinaturas Marcelo / Guilherme (FIXA) |

> ⚠️ **Mapa do cliente removido:** a proposta original da Lizit tinha uma imagem
> de mapa após o campo "Área". Foi removida no template (a Camila/GAS não consegue
> injetar imagem via `replaceText`). O parágrafo `{{AREA}}` permanece como texto;
> o doc gerado fica **sem mapa** — comportamento esperado e aprovado.

---

## 3. Tabela de placeholders

| Placeholder | Significado | Exemplo (Lizit) |
|---|---|---|
| `{{CLIENTE}}` | Razão social do cliente (aparece 3×: topo + 2× agradecimento) | `Lizit Arquitetura e Construção Ltda` |
| `{{CONTATO}}` | Pessoa de contato (A/C) | `Gustavo` |
| `{{NUMERO}}` | Número da proposta (chave `numeroProposta` do CRM) | `02202624.0` |
| `{{DATA}}` | Data da proposta por extenso | `26 de fevereiro de 2026` |
| `{{OBJETIVO}}` | Objetivo específico do serviço (bloco variável) | `Proposta de serviços de levantamento com tecnologias de Captura de Realidade, com laser scanner, drone e topografia, para geração de dados tridimensionais georreferenciados.` |
| `{{AREA}}` | Localização / área do levantamento | `Município de Ribeirão Preto/SP, área abaixo:` |
| `{{SERVICOS}}` | Descrição dos serviços contratados (texto corrido; quebrar linhas com `\n` no replaceText se quiser bullets) | `Serviço de levantamento com as tecnologias de: Laser Scanner Leica ou Similar...; Levantamento Externo com Drone...; Apoio Topográfico...; Filmagens do local a partir de drone...` |
| `{{VALOR}}` | Texto do valor total (rótulo "Valor Total:" é fixo, só o conteúdo entra aqui) | `O valor considerado para a execução do serviço de captura de realidade, para este levantamento, foi considerada uma área total aproximada de 2.500 m², resultando em um valor total de R$18.000,00.` |
| `{{PAGAMENTO}}` | Condição de pagamento (rótulo "Pagamento:" é fixo) | `Entrada de 50% e saldo restante na entrega` |
| `{{PRAZO}}` | Prazo de entrega (rótulo "Prazo de entrega:" é fixo) | `15 dias após levantamento` |
| `{{OBS}}` | Observações | `Serão entregues os dados brutos e dados unificados oriundos dos equipamentos de captura de realidade.` |

> A linha "Execução: Imediato." ficou fixa no template (não virou placeholder).
> Se um dia precisar variar, transformar em `Execução: {{EXECUCAO}}` no mesmo padrão.

---

## 4. Localização dos arquivos

### Template local (fonte da verdade editável)
- `C:\Users\23GAMER\work\CRM\template\TEMPLATE_PROPOSTA_TOPOSCAN.docx`
- Script gerador: `C:\Users\23GAMER\work\CRM\template\_build_template.py`
- Proposta canônica de origem: `C:\Users\23GAMER\Desktop\Toposcan\Propostas\TOPOSCAN_PROPOSTA_02202624.0_Lizit_CORRIGIDO.docx`

### Drive
- **Pasta:** `CRM-Propostas`
  - ID: `1E5nNduD2q8LaQi3v8AoNfwpyHL--zREh`
  - URL: https://drive.google.com/drive/folders/1E5nNduD2q8LaQi3v8AoNfwpyHL--zREh
  - Parent (Shared Drive root): `0AKp-OkVlROITUk9PVA` (mesma raiz de `CRM-Anexos`)
- **Template Doc ID:** `1FgUA5RVj_kPVXzBIdLd0D75vY3tmwGV6AqKZuZLUMNw` ✅ (uploaded 10/06/2026 via `uploadProposalTemplate`; salvo em ScriptProperties chave `PROPOSAL_TEMPLATE_ID`)

### Nome-padrão do arquivo gerado
```
TOPOSCAN_PROPOSTA_{{NUMERO}}_{{CLIENTE}}
```
Ex.: `TOPOSCAN_PROPOSTA_02202624.0_Lizit Arquitetura e Construção Ltda`
(sanitizar caracteres inválidos de filename: `/ \ : * ? " < > |`).

---

## 5. ⚠️ Upload pendente do Template para o Drive (Plano B em uso)

Na Onda 1-B **não foi possível subir o `.docx` automaticamente**:
- `rclone` (remote `gdrive:`) **não tem config** nesta máquina (`rclone.conf` ausente
  em todos os caminhos; OAuth exige fluxo interativo que o agente não pode fazer).
- O Google Drive MCP (`create_file`) converte docx→Google Doc, mas exige o conteúdo
  binário **inline em base64** (~1 MB) no argumento da chamada — inviável de compor
  pelo agente.

A pasta `CRM-Propostas` **já foi criada** e o `.docx` validado está pronto local.
Falta apenas executar **UMA** das opções abaixo (qualquer pessoa com acesso):

### Opção A — rclone (preferida; converte no upload)
```powershell
# 1. (uma vez) configurar o remote gdrive apontando pra toposcan.send@gmail.com
C:\rclone\rclone.exe config         # n) new remote → name=gdrive → Google Drive → OAuth no browser

# 2. subir convertendo docx → Google Doc
C:\rclone\rclone.exe copy `
  "C:\Users\23GAMER\work\CRM\template\TEMPLATE_PROPOSTA_TOPOSCAN.docx" `
  "gdrive:CRM-Propostas" --drive-import-formats docx

# 3. pegar o ID do Google Doc convertido (este é o Template Doc ID)
C:\rclone\rclone.exe lsjson "gdrive:CRM-Propostas"
#    procurar o item com mimeType "application/vnd.google-apps.document" → campo "ID"

# 4. validar que os placeholders sobreviveram à conversão
C:\rclone\rclone.exe copy "gdrive:CRM-Propostas/TEMPLATE_PROPOSTA_TOPOSCAN" `
  "C:\temp\check" --drive-export-formats docx
#    abrir e conferir que {{CLIENTE}}, {{NUMERO}}, ... estão presentes
```

### Opção B — Google Apps Script (já autenticado no Drive corporativo)
Subir o `.docx` em qualquer pasta do Drive (manual, arrastar no drive.google.com),
pegar o fileId, e converter com:
```javascript
function convertTemplateToGoogleDoc() {
  var docxFileId = 'COLE_O_ID_DO_DOCX_AQUI';
  var folderId   = '1E5nNduD2q8LaQi3v8AoNfwpyHL--zREh'; // CRM-Propostas
  var copy = Drive.Files.copy(
    { title: 'TEMPLATE_PROPOSTA_TOPOSCAN', parents: [{ id: folderId }] },
    docxFileId,
    { convert: true } // converte para Google Doc
  );
  Logger.log('Template Doc ID = ' + copy.id);  // <- anotar aqui
}
```
(Requer o Advanced Drive Service ativado no projeto clasp `clasp-crm`.)

> ⚠️ A conversão Google às vezes quebra `{{PLACEHOLDER}}` em runs diferentes no XML.
> Para o `replaceText` do GAS isso **não** é problema (ele opera no texto corrido).
> Basta confirmar que o **texto** `{{CLIENTE}}` etc. aparece no documento.

**Após o upload: preencher o Template Doc ID na seção 4 deste arquivo.**

---

## 6. Manutenção do template

Para alterar o template (ex.: novo texto institucional, novo campo variável):

1. **Editar a fonte canônica ou o script** `_build_template.py` e rodar:
   ```bash
   cd /c/Users/23GAMER/work/CRM/template
   PYTHONIOENCODING=utf-8 python _build_template.py
   ```
   O script copia a proposta original, troca só as partes variáveis por placeholders,
   remove o mapa do cliente e limpa a mídia órfã. Regerar é idempotente.

2. **Técnica python-docx usada:** texto vive em *runs* dentro de parágrafos. Um nome
   pode estar quebrado em vários runs. O script consolida o texto no 1º run e esvazia
   os demais (`set_para_text`), preservando estilo/figuras/header/footer. **Nunca
   reconstruir o doc do zero.** Itera parágrafos do corpo E dentro de tabelas
   (`for t in doc.tables: for row in t.rows: for cell in row.cells: cell.paragraphs`).

3. **Validação automática** (já no fim do fluxo): reabrir e conferir
   - (a) todos os 11 placeholders presentes;
   - (b) zero ocorrências de `Lizit`, `Gustavo`, `Ribeirão Preto`, `02202624`;
   - (c) `len(doc.inline_shapes) == 5` (institucionais preservadas; mapa removido).

4. **Re-subir pro Drive** (seção 5) e atualizar o **Template Doc ID**. Se criar um
   Doc novo, atualizar também a referência no GAS `generateProposal`.

5. **Adicionar um placeholder novo:** escolher um nome `{{NOME}}` único, inserir no
   `_build_template.py` (via `set_para_text` no parágrafo/célula certo), regerar,
   validar, re-subir, e documentar na tabela da seção 3.
