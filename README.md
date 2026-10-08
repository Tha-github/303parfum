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
| `npm run sync` | Atualiza os HTML da raiz (rodapé, FAQ, contato, SEO, dados, hero) |
| `npm run static` | Regenera headers/robots/sitemap/security.txt |
| `npm run placeholders` | Recria as imagens provisórias |

## 3. Onde trocar domínio e dados da empresa

**Tudo em um arquivo: [`config/site.mjs`](config/site.mjs).**

| Campo | Exemplo |
|---|---|
| `url` — **[DOMINIO]** | `https://www.303parfum.com.br` (sem barra no final) |
| `whatsapp.number` / `display` | `5587992120334` / `(87) 99212-0334` |
| `email`, `instagram` | e-mail e perfil oficiais |
| `hours` | horário de atendimento |
| `places.recife` / `places.garanhuns` | endereço exibido + busca do mapa (`mapsQuery`) |
| `legal.companyName` / `legal.cnpj` | razão social e CNPJ (rodapé e política) |

Rode `npm run sync` (ou `npm start`/`npm run build`, que já fazem isso):
HTML, rodapé, links de WhatsApp, mapa, SEO, sitemap, headers e redirecionamento
www são atualizados juntos.

Os HTML da raiz já trazem o conteúdo real (abrem completos até com duplo
clique). O `sync` só reescreve: as regiões entre `<!-- @region nome -->` e
`<!-- @endregion nome -->` (rodapé, FAQ, contato e SEO — editados em
`src/partials/` e `src/data/faq.js`) e os elementos marcados com
`data-site="email"` / `data-site-href="mailto:{email}"`. **Não edite à mão o que
estiver dentro dessas regiões** — edite a origem e rode `npm run sync`.

Ao trocar o domínio, revise também o redirecionamento em `public/.htaccess`
(gerado automaticamente a partir da `url`).

## 4. Produtos

Os produtos ficam em [`src/data/products.json`](src/data/products.json). Para
adicionar um, copie um item existente e ajuste:

```jsonc
{
  "id": "303-009",                    // único
  "slug": "nome-do-perfume",          // minúsculas, sem acento, com hífens
  "nome": "Nome do Perfume",
  "categoria": "feminino",            // masculino | feminino | nicho | arabe | capilar | oleo-corporal
  "genero": "feminino",               // feminino | masculino | unissex
  "descricao_curta": "Uma linha para o card.",
  "descricao": "Texto completo exibido em Detalhes.",
  "notas": { "topo": ["Bergamota"], "coracao": ["Rosa"], "fundo": ["Âmbar"] },
  "familia_olfativa": "Floral ambarada",
  "volume_ml": 100,
  "preco": null,                      // número (ex.: 149.9) ou null para ocultar
  "imagem": "/src/assets/img/produtos/nome-do-perfume.webp",
  "imagem_alt": "Frasco do perfume Nome do Perfume com tampa dourada",
  "destaque": false                   // true = selo "Destaque"
}
```

- Campos inválidos não quebram o site: há valores de reserva (imagem neutra,
  nome genérico) e o item continua aparecendo em "Todos".
- O catálogo, os filtros, os links `?linha=` e as mensagens de WhatsApp se
  atualizam sozinhos.
- **Preço:** quando **todos** os produtos tiverem `preco`, o site passa a
  publicar automaticamente os dados estruturados de produto (Google). Sem
  preço, isso fica desligado de propósito (o Google acusaria erro).

Perguntas frequentes ficam em [`src/data/faq.js`](src/data/faq.js) (o mesmo
arquivo gera o acordeão e o schema FAQPage; respostas com `[CONFIRMAR]` não vão
para o Google).

## 5. Imagens

### Foto do topo (hero)

Substitua **`src/assets/img/banner.png`** — PNG com **fundo transparente**
(o site nunca corta a imagem), idealmente com **1600 px ou mais** de largura
(a atual tem 550 px). No próximo `npm start`/`npm run build` (ou
`npm run images`) ela é convertida sozinha para **AVIF + WebP + PNG**, **sem
recorte**, nas larguras 480/800/1200/1600 que a foto comportar (nunca amplia);
`srcset`, preload e largura/altura do `<img>` se ajustam sozinhos.
Teto de peso: **≤ 200 KB por arquivo** (a qualidade é reduzida se preciso).

### Linhas e produtos

Coloque as **fotos originais** (JPG/PNG/WebP/TIFF, quanto maior melhor) em:

```
images-src/linhas/<slug>.jpg           → masculino, feminino, nicho, arabe, capilar, oleo-corporal
images-src/produtos/<slug>.jpg         → mesmo slug do products.json
```

e rode **`npm run images`**. O script recorta em **4:5** (com foco automático no
frasco), gera **AVIF + WebP** em **480/800/1200 px**, remove metadados (GPS,
câmera) e confere o peso. Se uma foto passar do limite, a qualidade é reduzida
automaticamente e o script avisa.

Dicas: fundo limpo, frasco centralizado, luz suave; evite texto na foto.
Depois, revise os textos alternativos (`alt`) no `index.html` e no
`products.json`.

A imagem de compartilhamento (`public/og-image.jpg`, 1200×630) e o ícone do iOS
(`public/apple-touch-icon.png`) são provisórios — troque pelos definitivos.

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
- JSON-LD gerado no build (`scripts/lib/jsonld.mjs`): Organization, WebSite e
  FAQPage; produtos entram quando houver preços. Valide em
  <https://search.google.com/test/rich-results>.
- `robots.txt` e `sitemap.xml` gerados a partir do domínio em `config/site.mjs`.
  Após publicar, envie o sitemap no Google Search Console.

## 10. Identidade visual (dourado)

Tokens em `src/css/tokens.css`, aplicação em `src/css/gold.css`:

| Token | Uso |
|---|---|
| `--gold-gradient` | linhas, bordas, botões, ícones e texto grande sobre fundo escuro |
| `--gold-gradient-text` | texto pequeno sobre fundo escuro (contraste ≥ 5,7:1) |
| `--gold-gradient-deep` | texto grande e ícones sobre fundo claro (≥ 3,8:1) |
| `--gold-solid` | fallback, foco no escuro, ícones/bordas simples |

Texto **pequeno** sobre fundo **claro/branco** é sempre **preto** (dourado não
atinge o contraste mínimo ali).

## 11. Estrutura

```
index.html, politica-de-privacidade.html, 404.html   páginas (modelos do Vite)
styleguide.html            guia visual (só no `npm start`, não é publicado)
INICIAR-SITE.bat           abre o site com duplo clique (Windows)
config/
  site.mjs                 domínio e dados da empresa (fonte única)
  security-headers.mjs     CSP, headers e cache (fonte única)
scripts/                   build: imagens, headers/SEO, JSON-LD
src/
  css/                     tokens, base, layout, componentes, seções, movimento
  js/                      módulos (catálogo, formulários, mapa, movimento…)
  data/                    products.json e faq.js
  partials/footer.html     rodapé compartilhado pelas 3 páginas
  assets/fonts, assets/img fontes (subset latino) e imagens otimizadas
public/                    copiado como está para o dist/ (headers, robots…)
```

Fontes: Cormorant Garamond e Manrope — SIL Open Font License 1.1.
#   3 0 3 p a r f u m  
 