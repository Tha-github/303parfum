# 303 PARFUM — site institucional

Site de página única da 303 Parfum: vitrine da coleção, captação de revendedores,
perguntas frequentes e contato — tudo convertendo para WhatsApp.
Feito com [Vite](https://vite.dev) e JavaScript/CSS puros (sem framework, sem
bibliotecas no navegador).

---

## 1. Como ver o site

### Jeito mais fácil (Windows)

Dê **duplo clique em `INICIAR-SITE.bat`**. Na primeira vez ele instala as
dependências; depois abre o site completo em `http://localhost:5173`.

### Pelo terminal

```bash
npm install      # só na primeira vez
npm start        # abre o site no navegador (atualiza sozinho ao editar)
```

Requisito: **Node.js 20.19 ou mais novo** (<https://nodejs.org>).

> **Por que abrir o `index.html` com duplo clique não mostra tudo?**
> O `index.html` da raiz é o *modelo* que o Vite monta. Aberto direto do disco
> (`file://`), os estilos e as imagens aparecem, mas o navegador bloqueia por
> segurança os scripts e as fontes — então catálogo, FAQ, rodapé e os dados da
> empresa só surgem pelo `npm start` ou no site publicado.

## 2. Build de produção

```bash
npm run build    # gera a pasta dist/ (é ela que vai para a hospedagem)
npm run preview  # serve o dist/ com os MESMOS headers de segurança da produção
```

O `build` roda antes o `npm run static`, que regenera headers, `robots.txt`,
`sitemap.xml` e `security.txt` a partir da configuração.

| Script | O que faz |
|---|---|
| `npm start` / `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Testa o `dist/` localmente (com CSP e headers) |
| `npm run images` | Otimiza as fotos reais (ver seção 5) |
| `npm run sync` | Atualiza os HTML da raiz (rodapé, FAQ, contato, SEO, catálogo, promoção, hero) |
| `npm run static` | Regenera headers/robots/sitemap/security.txt |
| `npm run brand` | Gera logo do header/rodapé, favicon, ícone do iOS e og-image a partir do `logo.png` |

## 3. Onde trocar domínio e dados da empresa

**Tudo em um arquivo: [`config/site.mjs`](config/site.mjs).**

| Campo | Exemplo |
|---|---|
| `url` — **[DOMINIO]** | `https://www.303parfum.com.br` (sem barra no final) |
| `description` | meta description (cita a promoção e as cidades) |
| `whatsapp.number` / `display` / `e164` | `5587992120334` / `(87) 99212-0334` / `+55 87 99212-0334` |
| `email`, `instagram` | `larissa.ifpe4@gmail.com`, `@303parfum` |
| `hours` / `openingHours` | horário exibido / formato schema.org (`Mo-Fr 09:00-18:00`) |
| `places.recife` / `places.garanhuns` | endereço exibido, partes do endereço (JSON-LD) e busca do mapa (`mapsQuery`) |

Rode `npm run sync` (ou `npm start`/`npm run build`, que já fazem isso):
HTML, rodapé, links de WhatsApp, mapa, SEO, sitemap, headers e redirecionamento
www são atualizados juntos.

Os HTML da raiz já trazem o conteúdo real (abrem completos até com duplo
clique). O `sync` só reescreve: as regiões entre `<!-- @region nome -->` e
`<!-- @endregion nome -->` (rodapé, FAQ, contato, SEO, **catalogo** e
**promocao** — editados em `src/partials/` e `src/data/`), os elementos marcados
com `data-site="email"` / `data-site-href="mailto:{email}"` e o `href` dos links
com `data-whatsapp-message` (mensagem já codificada). **Não edite à mão o que
estiver dentro dessas regiões** — edite a origem e rode `npm run sync`.

Ao trocar o domínio, revise também o redirecionamento em `public/.htaccess`
(gerado automaticamente a partir da `url`).

## 4. Produtos, abas e promoção

Os produtos ficam em [`src/data/products.json`](src/data/products.json) (um
array). Para adicionar um, copie um item existente e ajuste:

```jsonc
{
  "id": 26,                                  // número único
  "slug": "nome-do-perfume",                 // minúsculas, sem acento, com hífens
  "nome": "Nome do Perfume",
  "referencia": "Marca de referência",       // aparece como "Ref.: …"
  "categorias": ["feminino", "nicho"],       // feminino | masculino | nicho | arabe (uma ou mais abas)
  "familia": "Floral Amadeirada",
  "descricao": "Texto do card (2 linhas) e do modal.",
  "notas": { "topo": ["Bergamota"], "corpo": ["Rosa"], "fundo": ["Âmbar"] },
  "imagem": "nome-do-perfume",               // slug da foto (seção 5)
  "foco": "inteiro",                         // opcional: topo | base | esquerda | direita | inteiro
  "confirmar": "dúvida para a cliente"       // opcional, interno: nunca aparece no site
}
```

- Produto com `slug`, `nome` ou `categorias` inválidos é descartado (no build e
  no navegador — `src/js/product-schema.js`). Sem foto, o card mostra o nome em
  dourado sobre o preto.
- `foco` ajusta o enquadramento no card 4:5 quando o frasco ficaria cortado
  (`inteiro` mostra a foto toda).
- Os cards, as abas, os contadores, o JSON-LD e as mensagens de WhatsApp se
  atualizam sozinhos no próximo `npm run sync`/`build`.
- **Abas** (ordem, rótulos, frases e lista branca do `?linha=`):
  [`src/data/tabs.js`](src/data/tabs.js).
- **Promoção:** [`src/data/config.json`](src/data/config.json)
  (`ativa`, `preco_de`, `preco_por`, `texto`). Vale para todos os perfumes: cards,
  modal, bloco do hero, mensagens de WhatsApp e `offers` do JSON-LD. Com
  `"ativa": false`, o bloco do hero some e os preços saem dos cards.

Perguntas frequentes ficam em [`src/data/faq.js`](src/data/faq.js) (o mesmo
arquivo gera o acordeão e o schema FAQPage; respostas com `[CONFIRMAR]` não vão
para o Google).

## 5. Imagens

### Foto do topo (hero)

Substitua **`src/assets/img/banneroficial.png`** (de preferência com 1600 px ou
mais de largura). No próximo `npm start`/`npm run build` (ou `npm run images`)
ela é convertida sozinha para **AVIF + WebP + JPG**, **sem recorte**, nas
larguras 480/800/1200/1600 que a foto comportar (nunca amplia); `srcset`,
preload e largura/altura do `<img>` se ajustam sozinhos. O site nunca corta a
imagem (`object-fit: contain`). Teto: **≤ 200 KB por arquivo**.

### Produtos

Coloque as **fotos originais** (JPG/PNG/WebP, quanto maior melhor) em:

```
images-src/produtos/<slug>.jpg         → mesmo valor do campo "imagem" do products.json
```

e rode **`npm run images`**. Produtos: **AVIF + WebP + JPG** em **400/800/1200 px**
(só até a largura real), ≤ 150 KB no 800 px; fotos mais estreitas que 4:5
ganham margem lateral da cor do fundo. Metadados (GPS, câmera) são removidos.

### Logotipo, favicon e compartilhamento

O logo oficial é **`src/assets/img/logo.png`**. Depois de trocá-lo, rode
**`npm run brand`**: gera `src/assets/img/brand/logo-1x|2x.{webp,png}` (header e
rodapé), `public/favicon-32.png`, `public/apple-touch-icon.png` (180 px) e
`public/og-image.jpg` (1200×630).

## 6. Publicação

Em todos os casos, o que vai para o ar é a pasta **`dist/`** (rode
`npm run build` antes). Os headers de segurança já estão prontos para os três
cenários.

### Netlify

1. "Add new site" → importe o repositório (ou arraste a pasta `dist/`).
2. Build command: `npm run build` · Publish directory: `dist`.
3. Os headers vêm de `dist/_headers`; o 404 personalizado é automático.
4. Em "Domain management", conecte o domínio e ative HTTPS.

### Vercel

1. "Add New Project" → importe o repositório.
2. Framework: **Vite** · Build: `npm run build` · Output: `dist`.
3. Os headers vêm de `vercel.json` (na raiz); o `404.html` é usado
   automaticamente.
4. Em "Domains", adicione o domínio (com e sem www; deixe o **www** como
   principal).

### Hostinger (ou outro Apache/LiteSpeed)

1. `npm run build` no seu computador.
2. No hPanel → Gerenciador de Arquivos → `public_html`: envie **todo o
   conteúdo** de `dist/` — inclusive os arquivos ocultos **`.htaccess`** e a
   pasta **`.well-known`** (ative "mostrar arquivos ocultos").
3. Ative o SSL gratuito do domínio. O `.htaccess` força HTTPS, redireciona
   `303parfum.com.br` → `www.303parfum.com.br`, bloqueia arquivos ocultos e
   listagem de pastas, comprime e define cache e o 404.

## 7. Segurança

Configuração única em [`config/security-headers.mjs`](config/security-headers.mjs).

- **CSP estrita:** `script-src 'self'`, `style-src 'self'`, `font-src 'self'`
  (fontes auto-hospedadas), sem `'unsafe-inline'`, com **Trusted Types**,
  `frame-ancestors 'none'` e iframe permitido só para o Google Maps.
- HSTS (1 ano), `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, COOP e CORP.
- Cache: arquivos com hash (`/assets/…`) por 1 ano `immutable`; HTML `no-cache`.
- Código: zero `innerHTML`/`eval`/handlers inline; dados do JSON entram só via
  `textContent`; `?linha=` e `#faq-…` validados por lista branca; links externos
  com `rel="noopener noreferrer"`.
- Formulários: sanitização (controle, invisíveis, tamanho), honeypot, tempo
  mínimo de preenchimento e bloqueio de reenvio por 10 s.
- `/.well-known/security.txt` com o contato de segurança (validade renovada a
  cada build).

**Adicionou um serviço externo?** (pixel, chat, vídeo…) Inclua o domínio na
diretiva certa em `config/security-headers.mjs` e rode `npm run build` — senão
o navegador bloqueia (e mostra o motivo no console).

### Como testar os headers (depois de publicar)

1. **<https://securityheaders.com>** — informe a URL. Esperado: **A+**
   (todos os headers presentes, CSP sem `unsafe-inline`).
2. **<https://developer.mozilla.org/observatory>** — esperado: **A+ (100+)**.
   Pequenas deduções possíveis vêm da hospedagem, não do site.
3. Local, antes do deploy: `npm run build && npm run preview` e abra o console
   do navegador — nenhuma violação de CSP deve aparecer. `curl -I <url>` mostra
   os headers.

## 8. LGPD e privacidade

- Nenhum cookie, nenhum rastreador, nenhum armazenamento além de um carimbo de
  horário anti-spam na sessão (`sessionStorage`).
- Fontes servidas pelo próprio site (nenhum IP vai ao Google para isso).
- O **mapa só carrega após o clique** em "Ver no mapa".
- Os dois formulários (revenda e contato) exigem consentimento (checkbox) e não gravam nada em
  servidor: os dados vão para uma mensagem que a própria pessoa envia no
  WhatsApp.
- Política em `politica-de-privacidade.html`.

> **Analytics no futuro (Google Analytics, Meta Pixel, Hotjar, etc.):** exige
> **banner de consentimento** antes de carregar qualquer script de
> rastreamento (LGPD art. 7º/8º), atualização da Política de Privacidade e
> liberação dos domínios na CSP. Nada pode ser carregado antes do "aceito".

## 9. SEO

- Meta description, canonical, Open Graph e Twitter Card (`index.html`).
- Abas e cards do catálogo gerados no build: o conteúdo é indexável sem JS.
- JSON-LD gerado no build (`scripts/lib/jsonld.mjs`): Organization, WebSite,
  2 × Store (Recife e Garanhuns, com endereço, telefone, e-mail e horário),
  FAQPage e ItemList com todos os produtos (com `offers` enquanto a promoção
  estiver ativa). Valide em
  <https://search.google.com/test/rich-results>.
- `robots.txt` e `sitemap.xml` gerados a partir do domínio em `config/site.mjs`.
  Após publicar, envie o sitemap no Google Search Console.

## 10. Identidade visual (dourado)

Tokens em `src/css/tokens.css`, aplicação em `src/css/gold.css`:

| Token | Uso |
|---|---|
| `--gold-gradient` | linhas, bordas, botões, ícones e texto grande sobre fundo escuro |
| `--gold-gradient-text` | texto pequeno sobre fundo escuro (contraste ≥ 5,7:1) |
| `--gold-gradient-deep` | texto grande sobre fundo claro (≥ 3,8:1) |
| `--gold-gradient-ink` | texto pequeno sobre fundo claro (≥ 4,8:1) |
| `--gold-solid` | **só** fallback em `@supports not (background-clip: text)` |

Todo dourado visível é gradiente — texto, linhas, bordas, botões e ícones SVG
(`url(#gold)`, definido em `src/partials/footer.html`). Os componentes não
declaram cor dourada; só o `gold.css` pinta. Foco e seleção são neutros
(não aceitam gradiente).

## 11. Estrutura

```
index.html, politica-de-privacidade.html, 404.html   páginas (modelos do Vite)
styleguide.html            guia visual (só no `npm start`, não é publicado)
INICIAR-SITE.bat           abre o site com duplo clique (Windows)
config/
  site.mjs                 domínio e dados da empresa (fonte única)
  security-headers.mjs     CSP, headers e cache (fonte única)
scripts/                   build: imagens, marca, catálogo/promoção no HTML, headers/SEO, JSON-LD
src/
  css/                     tokens, base, layout, componentes, seções, movimento
  js/                      módulos (catálogo, formulários, mapa, movimento…)
  data/                    products.json, config.json (promoção), tabs.js e faq.js
  partials/footer.html     rodapé compartilhado pelas 3 páginas
  assets/fonts, assets/img fontes (subset latino) e imagens otimizadas
public/                    copiado como está para o dist/ (headers, robots…)
```

Fontes: Cormorant Garamond e Manrope — SIL Open Font License 1.1.
#   3 0 3 p a r f u m  
 