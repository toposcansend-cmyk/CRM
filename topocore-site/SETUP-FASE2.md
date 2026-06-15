# Topocore — Fase 2 (SEO + deploy automático)

Esta pasta é um **staging** dentro do repo CRM (esta sessão não tem acesso de escrita
ao repo `topocore-site`). Tudo aqui está pronto para ir pro `topocore-site` e pro ar.

## O que mudou / foi criado

| Arquivo | Status | O que faz |
|---|---|---|
| `index.html` | **substitui** o atual | +SEO: Open Graph completo, Twitter Cards, canonical, robots, theme-color e JSON-LD (Organization + SoftwareApplication com os 3 planos + FAQPage). |
| `marca/og-cover.png` | **novo** | Imagem 1200×630 que aparece ao compartilhar o link (WhatsApp/LinkedIn). |
| `robots.txt` | **novo** | Libera indexação e aponta o sitemap. |
| `sitemap.xml` | **novo** | Mapa do site para o Google Search Console. |
| `.github/workflows/deploy-hostgator.yml` | **novo** | Deploy automático: a cada push na `main`, sobe tudo na HostGator via FTP. |

## Como colocar no ar (3 passos)

### 1. Levar os arquivos para o repo `topocore-site`
Copie para a raiz do `topocore-site` (mantendo a estrutura de pastas):
`index.html`, `robots.txt`, `sitemap.xml`, `marca/og-cover.png` e
`.github/workflows/deploy-hostgator.yml`.

### 2. Criar o usuário FTP na HostGator + secrets no GitHub
1. cPanel → **Contas FTP** → criar usuário (ex.: `deploy@topocore.com.br`) apontando para `public_html`.
2. No repo `topocore-site` → Settings → Secrets and variables → Actions → criar:
   - `FTP_SERVER` = host FTP (ex.: `ftp.topocore.com.br` ou o IP/servidor do cPanel)
   - `FTP_USERNAME` = usuário FTP criado
   - `FTP_PASSWORD` = senha do usuário FTP
3. Se o usuário FTP já cair direto na pasta do domínio, troque no workflow
   `server-dir: ./public_html/` por `server-dir: ./`.

### 3. Dar push na main
O Action roda sozinho e publica em `topocore.com.br`. Dá pra rodar manualmente também
(aba Actions → "Deploy to HostGator (FTP)" → Run workflow).

## Pendências que dependem de você (placeholders no index.html)

- `55SEUNUMEROAQUI` (2 ocorrências) → número de WhatsApp com DDI+DDD (ex.: `5541999998888`).
  **Crítico:** hoje o botão de WhatsApp não funciona.
- Rodapé: `RAZÃO SOCIAL LTDA`, CNPJ `00.000.000/0001-00`, `Cidade/UF`, telefone de exibição.
- (Opcional) GA4: colar o snippet do Google Analytics no `<head>` para medir o tráfego.

## Depois de publicar — pra "chegar nas pessoas"

1. **Google Search Console** (search.google.com/search-console): adicionar `topocore.com.br`,
   verificar o domínio e enviar `sitemap.xml`.
2. **Google Business Profile**: criar o perfil da Topocore (Curitiba/PR) — aparece no Maps/Busca.
3. **GA4**: criar a propriedade e ligar a medição.
4. Validar o card de compartilhamento em developers.facebook.com/tools/debug e o JSON-LD em
   search.google.com/test/rich-results.
