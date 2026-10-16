# 303 PARFUM — especificação do site (fonte da verdade)

> Documento de referência para qualquer alteração no projeto. Em conflito entre
> este arquivo e o código, este arquivo vence — e o código deve ser ajustado.
> Itens marcados **[CONFIRMAR]** dependem da cliente.

## 1. Marca e objetivo

- **Marca:** 303 PARFUM — alta perfumaria a preço justo.
- **Atuação:** Recife e Garanhuns (Pernambuco).
- **WhatsApp:** (87) 99212-0334 — `5587992120334`. Todo CTA de conversão termina no WhatsApp.
- **Objetivos do site:** apresentar a coleção, divulgar a **promoção**, **captar revendedores** e receber contatos.
- **Tom de voz:** sofisticado, acolhedor, direto. Português do Brasil.
- **Regras de conteúdo:**
  - Marcas de terceiros aparecem **só** no campo "Ref.:" de cada produto e nas fotos dos frascos
    (decisão da cliente; o risco jurídico foi informado). Nada de "contratipo" em textos de marketing.
  - Nunca prometer ganhos, renda ou valores. A ressalva "sem promessas de ganhos" deve permanecer.
  - Modelo comercial: **somente revendedor**. Não existe "representante".
  - Não existe agendamento de atendimento nem "Área do Revendedor".

## 2. Identidade visual

### Logotipo
- Arquivo oficial: `src/assets/img/logo.png` (prateado claro sobre transparente — bom contraste no
  preto, sem versão clara). `npm run brand` gera, a partir dele:
  - `src/assets/img/brand/logo-1x|2x.{webp,png}` (header e rodapé; `width`/`height` e `alt="303 Parfum"`);
  - `public/favicon-32.png`, `public/apple-touch-icon.png` (180 px; só o "303") e `public/og-image.jpg`.
- Altura: ~40 px no celular, ~48 px no desktop; um pouco menor com `.is-scrolled`.

### Cores
| Token | Valor | Uso |
|---|---|---|
| `--color-black` | `#0A0A0A` | fundo escuro principal, modal |
| `--color-ink` | `#141414` | **cards de produto** |
| `--color-ivory` | `#F6F4F0` | fundo claro (Coleção, Contato) |
| `--color-white` | `#FFFFFF` | fundo do FAQ |
| `--color-text-on-dark` | `rgb(246 244 240 / .9)` | texto no escuro (leve transparência) |
| `--color-text-on-light` | `rgb(10 10 10 / .88)` | texto no claro (leve transparência) |
| `--color-text-soft` | `#2A2A2A` | respostas do FAQ |

### Dourado — SEMPRE gradiente, sem exceção
- **Nenhum elemento usa dourado chapado.** `--gold-solid` / `--gold-deep` existem só como fallback dentro de
  `@supports not (background-clip: text)`. Os componentes não declaram dourado: **só `src/css/gold.css` pinta**.
- `--gold-gradient: linear-gradient(135deg, #8C6B2E 0%, #C9A13B 22%, #F3E2A4 48%, #D4AF37 70%, #8C6B2E 100%)` — **identidade**.
- A variante do gradiente segue o fundo (contraste WCAG AA), definida por contexto em `gold.css`:
  - escuro → texto pequeno `--gold-gradient-text` (≥ 5,7:1) · texto grande `--gold-gradient`;
  - claro → texto pequeno `--gold-gradient-ink` (todas as paradas ≥ 4,8:1) · texto grande `--gold-gradient-deep`;
  - cards e modal são escuros mesmo dentro de seção clara.
- **Onde e como:**
  - Textos (eyebrows, itálicos de destaque `h1–h3 em`, preços, números dos passos, contadores, rótulos,
    "Abrir no Google Maps", hovers do rodapé/sublinks/FAQ) → `background-clip: text; color: transparent`.
  - Linhas de 1 px (eyebrow, abas, pirâmide, rodapé, **linha inferior do header**, FAQ, sublinhados) → `background: var(--gold-gradient)`.
  - Bordas: retângulos (botões outline, bloco da promoção, CTA do header, dropdown, modal, **inputs em foco**,
    opções do formulário) → `border-image: var(--gold-gradient) 1`; círculos (WhatsApp, radio) → fundo em duas
    camadas (`padding-box` + `border-box`); número dos passos e **cards no hover** → pseudo-elemento + `mask-composite: exclude`.
  - Botões preenchidos ("Aproveitar a promoção" etc.) → `background: var(--gold-gradient)`, texto preto e
    brilho deslizante no hover (`background-size: 200%`).
  - Ícones SVG (WhatsApp, benefícios, sucesso do formulário) → `fill/stroke="url(#gold)"` — `<linearGradient id="gold">`
    único em `src/partials/footer.html` (vale nas 3 páginas).
  - Foco e seleção não aceitam gradiente: são **neutros** (marfim no escuro, preto no claro).
  - Logo: prateado, sem partes douradas — nada a aplicar.

### Tipografia (leve e menor)
- **Cormorant Garamond** — arquivos estáticos só dos pesos usados: **300, 400 e itálico 400** (`@fontsource` 5.2.11).
  **Manrope** variável, declarada **300–700**. Nada acima de **500** no site (`--fw-semibold` = 500), exceto
  o crédito **TOP SITE** do rodapé (700).
- H1 (hero) `clamp(2.25rem, 5vw, 4rem)` Cormorant 300 · H2 `clamp(1.75rem, 3.5vw, 2.75rem)` 300 ·
  H3/nome do produto `clamp(1.15rem, 1.6vw, 1.4rem)` 400 · perguntas do FAQ `clamp(1.15rem, 2vw, 1.5rem)` 400.
- Texto 15 px (celular) / 16 px (desktop), Manrope 300, cor com leve transparência, `line-height` 1,6.
- Eyebrows 11 px, Manrope 500, `letter-spacing` 0,28em · Botões e links do header 12 px, 500, 0,2em.
- **Letras inteiras:** `line-height` ≥ 1,15 nos títulos; **sem `letter-spacing` negativo**; todo texto com
  gradiente ganha `padding: .06em .12em .14em 0; margin-right: -.12em` (inline → `inline-block`); versaletes
  pequenas (eyebrows, rótulos) com folga extra no topo (til/cedilha de PROMOÇÃO, COLEÇÃO).

### Layout e ritmo — CENTRALIZADO
- Container de 1280 px. **Todo cabeçalho de seção** (eyebrow, título, apoio) centralizado, `max-width` ~720 px.
- Catálogo: abas e grade centralizadas · Revenda: abertura e benefícios centralizados; cadastro em coluna
  única de 560 px · FAQ: coluna de 820 px (pergunta à esquerda, +/− à direita) · Contato: título e blocos de
  informação centralizados, abas Recife/Garanhuns + mapa abaixo (até 960 px), formulário em coluna de 560 px ·
  Rodapé: logo, colunas e contatos centralizados (empilhados no celular).
- **Exceção:** "Como funciona?" mantém os 3 passos lado a lado com a linha conectando; o título fica
  centralizado no desktop (à esquerda no celular).
- Espaço entre seções: `clamp(80px, 10vw, 140px)`. Áreas de toque ≥ 44 px.

### Movimento
- Revelação ao rolar (fade + 24 px, cascata por lote); linhas douradas que se desenham.
- Títulos revelados por palavra **só com opacity + translate, sem máscara (`overflow: hidden`)**.
- Catálogo: contador animado e entrada escalonada dos cards ao trocar de aba.
- Com `prefers-reduced-motion`, nada se move. **Sem parallax.**

## 3. Estrutura da página (`index.html`, nesta ordem)

| Âncora | Seção | Fundo |
|---|---|---|
| — | Header fixo | **preto `#0A0A0A` sempre** |
| `#inicio` | Hero + promoção | escuro |
| `#colecao` | Catálogo em abas (cards escuros) | marfim |
| `#revenda` | Seja Revendedor (+ `#cadastro`) | escuro |
| `#faq` | Perguntas frequentes | **branco** |
| `#contato` | Contato + mapa + formulário | marfim |
| — | Rodapé | `#0A0A0A` |

**Removidos (não recriar):** Sobre/Manifesto e pilares; **Linhas de produto** ("Seis linhas, uma assinatura.");
**faixa (marquee)** de linhas; botões "Conheça a coleção" e "Quero revender" do hero — em HTML, CSS, JS,
imagens (`src/assets/img/linhas/`, `generate-placeholders`) e âncoras.

Outras páginas: `politica-de-privacidade.html` (LGPD) e `404.html` (cabeçalho com o logo).

## 4. Requisitos por seção

### Header
- **Desktop:** à esquerda **só o logo**; à direita, agrupados: **Coleção ▾ · FAQ · Contato · [Seja Revendedor]**
  — ~32 px entre os links e ~24 px até o botão; links 12 px, `letter-spacing` 0,2em, sublinhado em dourado
  gradiente no hover. "Coleção" é um botão (`aria-expanded`; clique/Enter abrem; ESC — foco volta ao botão —,
  clique fora ou foco saindo fecham) com **Perfumes Femininos · Masculinos · Árabes · de Nicho**.
- Fundo **preto fixo** do topo ao fim (também sem JS) e linha inferior de 1 px em gradiente; ao passar de
  **80 px** (`.is-scrolled`) a barra e o logo ficam mais baixos.
- **Mobile (< 1024 px):** logo à esquerda, hambúrguer à direita; menu em tela cheia (`aria-expanded`, foco
  preso, ESC, trava de scroll): grupo **"Coleção"** com os 4 links, depois **Seja Revendedor · FAQ · Contato**.
- Cada link de aba (`data-tab-link`, menu e rodapé): fecha o menu, rola até `#colecao`, ativa a aba
  (chamada direta a `catalog.select()`, sem evento global) e atualiza `?linha=`.

### Hero (centralizado)
- Eyebrow "Alta perfumaria · Recife & Garanhuns"; H1 "Alta perfumaria. *Preço justo.*" (único H1); subtítulo —
  tudo centralizado, ~720 px, com degradê escuro atrás do texto.
- **Bloco de promoção** (gerado de `src/data/config.json`; some se `ativa: false`): eyebrow "PROMOÇÃO";
  "Todos os perfumes de ~~R$ 250,00~~"; **"R$ 199,90"** em dourado gradiente; "Por tempo limitado. Consulte
  pelo WhatsApp."; botão **"Aproveitar a promoção"** → WhatsApp "Olá! Quero aproveitar a promoção dos
  perfumes por R$ 199,90.". Leitor de tela: "Todos os perfumes de 250 reais por 199 reais e 90 centavos".
- **Sem** os botões "Conheça a coleção" e "Quero revender".
- **Imagem `src/assets/img/banneroficial.png`** (AVIF/WebP/JPG, preload, `fetchpriority="high"`, é o LCP):
  **inteira** (`object-fit: contain`, nunca `cover`), **centralizada e ancorada na base** da seção, numa faixa
  própria **abaixo** do texto (mín. 45svh no celular, 42svh no tablet, 55svh no desktop). **O texto nunca
  cobre a foto** (coluna flex). Bordas laterais e topo da foto se dissolvem no preto (máscara).
- Indicador "Role" → `#colecao`, só no desktop com altura sobrando.

### Coleção (catálogo em abas)
- Título "A Coleção" (h2 com aparência de eyebrow). **Abas, nesta ordem:** Feminino | Masculino |
  Perfumes de Nicho | Árabes. Inicial: **Feminino**. **Sem aba "Todos".** Um produto pode estar em várias
  abas (`categorias` é array).
- **WAI-ARIA:** `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-controls`; ← → alternam (com
  volta), Home/End vão à primeira/última. URL `?linha=feminino|masculino|nicho|arabe` (lista branca em
  `src/data/tabs.js`; inválido → feminino) via `history.replaceState`.
- Topo de cada aba: contador animado ("11 fragrâncias") + frase:
  - Feminino: "Florais, gourmands e orientais para todas as ocasiões."
  - Masculino: "Amadeirados, aromáticos e aquáticos de presença marcante."
  - Perfumes de Nicho: "Composições raras, de assinatura exclusiva."
  - Árabes: "Intensidade, riqueza de notas e fixação prolongada."
- Mobile: abas com rolagem horizontal e scroll-snap; aba ativa sublinhada em dourado gradiente.
- **Abas e cards gerados no build** (`scripts/lib/render-sections.mjs`, região `catalogo`): indexáveis e
  visíveis sem JS (sem JS, os 4 painéis aparecem em sequência, cada um com o título).
- **Card:** fundo `#141414`, borda 1 px sutil → dourada no hover; imagem 4:5 com zoom 1.04 em 900 ms;
  família (eyebrow dourado), nome (Cormorant), "Ref.: X" pequeno e cinza, descrição com line-clamp de
  2 linhas; preço com promoção (~~R$ 250,00~~ cinza + **R$ 199,90** dourado + selo "PROMOÇÃO"); botões
  "Detalhes" (outline) e "Pedir no WhatsApp" (primário).
- **Mensagem do produto:** "Olá! Tenho interesse no perfume [nome] por R$ 199,90." (sem promoção:
  "Olá! Tenho interesse no perfume [nome].").
- **Grade:** 4 colunas ≥ 1280 · 3 ≥ 1024 · 2 ≥ 600 · 2 compactas no mobile (≥ 360) · 1 abaixo disso.
- **Imagens:** uma por produto (`images-src/produtos/<slug>.*` → `npm run images`), AVIF/WebP/JPG em
  400/800/1200 w (só até a largura real; ≤ 150 KB no 800 w). Card: `cover`, `object-position: center
  35%`; campo **`foco`** quando o frasco seria cortado: `topo | base | esquerda | direita | inteiro`
  (`inteiro` = `contain`). Sem imagem: placeholder `#0A0A0A` com o nome em Cormorant dourado.
  `alt="Perfume [nome] — família [família] — 303 Parfum"`.
- **Modal `<dialog>`** (escuro): desktop em 2 colunas — arte **inteira** (`contain`, máx. 85vh) à esquerda;
  à direita nome, referência, família, descrição, preço, pirâmide **Topo / Corpo / Fundo** com linhas em
  dourado gradiente, CTAs "Pedir no WhatsApp" e "Quero revender". Mobile: arte no topo e rolagem
  interna. Foco preso, ESC fecha, foco devolvido ao botão do card, `aria-labelledby`.
- **Segurança:** HTML gerado com escape no build; no navegador só `textContent`/atributos (nunca
  `innerHTML` com dados). Validação de slug, nome, categorias e imagem em `src/js/product-schema.js`.

### Seja Revendedor (`#revenda`)
- Abertura (Oportunidade 303 · "Transforme fragrâncias em renda."), **Como funciona?** (01 Cadastro →
  02 Escolha seu kit → 03 Comece a vender), **Por que vender 303?** (5 benefícios) e **formulário** `#cadastro`.
- **Não há bloco de modelos/comparativo nem representante.**
- Formulário: nome, WhatsApp (máscara), cidade (Recife/Garanhuns/Outra → "Qual cidade?"), já vende algo?
  (opcional), mensagem (opcional, 500), LGPD. Mensagem: **"Olá! Quero ser revendedor(a) 303 PARFUM."** + dados.

### FAQ (`#faq`)
- Fundo **#FFFFFF**, coluna única de **~820 px**; perguntas em preto (Cormorant, grandes), respostas `#2A2A2A`.
- `<details>/<summary>` nativo. Perguntas em `src/data/faq.js` (mesma fonte do schema FAQPage). Respostas:
  - Pagamento: "Aceitamos cartão de crédito, cartão de débito e Pix."
  - Entrega: "O prazo de entrega é de 5 a 7 dias."
  - Regiões: "Atendemos em Recife e em Garanhuns, em Pernambuco. Para outras cidades, fale com a gente pelo WhatsApp."

### Contato
- **Recife:** Rua Teixeira de Freitas, 135 — Várzea, Recife - PE.
- **Garanhuns:** Rua Ary Barroso, 135 — Magano, Garanhuns - PE.
- **Horário:** "Seg. a sex., 9h às 18h · Sáb., 9h às 13h". **E-mail:** larissa.ifpe4@gmail.com.
  **Instagram:** @303parfum [CONFIRMAR].
- Mapa com abas Recife/Garanhuns; o Google só carrega **após o clique** (LGPD); "Abrir no Google Maps".
- Formulário (nome, WhatsApp ou e-mail, mensagem, LGPD).

### Rodapé
- Fundo `#0A0A0A`; **logo** + frase "Alta perfumaria. *Preço justo.*"
- **Centralizado:** logo e frase ao centro; colunas lado a lado e centralizadas no desktop, empilhadas no celular.
- Colunas: **Coleção** (4 abas + Capilares e Óleos Corporais pelo WhatsApp) · **Navegação** (Coleção, Seja
  Revendedor, FAQ, Contato) · **Contato** (mesmos dados da seção Contato) · **Instagram**.
- Base, centralizada: em cima **Política de Privacidade**; embaixo **"© [ano dinâmico] 303 PARFUM TODOS OS
  DIREITOS RESERVADOS | SITE CRIADO POR TOP SITE"** — "TOP SITE" em negrito, link para
  https://topsitebr.com.br (nova aba). No celular o crédito vai para a linha de baixo, sem a barra.
  **Sem razão social/CNPJ.**

## 5. Dados e configuração
- **Os HTML da raiz são completos** (abrem com duplo clique): o `npm run sync` (automático no
  `start`/`dev`/`build`) reescreve as regiões `<!-- @region … -->` (rodapé, FAQ, contato, SEO,
  **catalogo**, **promocao**), os `data-site`/`data-site-*`, o `srcset` do hero e o `href` dos links
  `data-whatsapp-message` (mensagem já codificada — funciona sem JS).
- **Empresa e domínio:** `config/site.mjs` (fonte única). Rodapé: `src/partials/footer.html`.
- **Produtos:** `src/data/products.json` — array de `{ id, slug, nome, referencia, categorias[], familia,
  descricao, notas { topo, corpo, fundo }, imagem, foco? }`. O campo **`confirmar`** é interno: nunca
  aparece no site (só no relatório). Contagens atuais: Feminino 11 · Masculino 14 · Nicho 5 · Árabes 4.
- **Promoção:** `src/data/config.json` → `{"promocao":{"ativa":true,"preco_de":250.00,"preco_por":199.90,"texto":"Por tempo limitado"}}`.
  Lida por cards, modal, hero, mensagens de WhatsApp e JSON-LD. Formato `Intl.NumberFormat('pt-BR',
  {style:'currency', currency:'BRL'})` (`src/js/price.js`).
- **Abas:** `src/data/tabs.js`. **FAQ:** `src/data/faq.js`. **Headers/CSP:** `config/security-headers.mjs`.

## 6. Requisitos técnicos
- Vite, HTML/CSS/JS puros, módulos ES. **Nenhum script inline, handler inline ou `innerHTML` com dados.**
- CSP estrita (`'self'`, Trusted Types, iframe só Google Maps), HSTS, nosniff, X-Frame-Options DENY,
  Referrer-Policy, Permissions-Policy, COOP/CORP; arquivos para Netlify, Vercel e Apache/Hostinger.
- **Metas:** Lighthouse mobile ≥ 90 nas 4 categorias; LCP < 2,5 s (imagem do hero); CLS < 0,1.
- WCAG 2.1 AA: contraste, teclado, leitores de tela, áreas de toque ≥ 44 px.
- LGPD: consentimento nos formulários; nenhum cookie/rastreador; mapa só após clique.
- **SEO:** canonical, Open Graph (og-image com o logo), meta description com R$ 199,90 e Recife/Garanhuns,
  JSON-LD gerado no build: Organization, WebSite, **2 × Store** (Recife e Garanhuns: PostalAddress,
  +55 87 99212-0334, e-mail, `openingHours` "Mo-Fr 09:00-18:00" e "Sa 09:00-13:00", areaServed),
  FAQPage e **ItemList** com todos os produtos (name, description, image, category, brand "303 Parfum";
  com promoção ativa: `offers` 199.90 BRL InStock). `robots.txt`, `sitemap.xml`.

## 7. Pendências da cliente [CONFIRMAR]
- Gênero do **Oriental Âmbar** (feminino ou unissex) e abas do **Vibrato** (masculino + nicho?).
- @ do Instagram (@303parfum).
- Logo oficial: o arquivo diz **"303 MAN"** e tem só 68 px de altura útil (ideal: versão "303 PARFUM" em alta).
- Banner do hero mostra o frasco **"212 MEN"** (marca de terceiro) em destaque.
- Fotos de produto em baixa resolução (Good Girl 240 px; Acqua di Giò e Boss Bottled Beyond 225 px).
- Domínio definitivo; condições de revenda; revisão jurídica da política.
