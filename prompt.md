# 303 PARFUM — especificação do site (fonte da verdade)

> Documento de referência para qualquer alteração no projeto. Em conflito entre
> este arquivo e o código, este arquivo vence — e o código deve ser ajustado.
> Itens marcados **[CONFIRMAR]** dependem da cliente.

## 1. Marca e objetivo

- **Marca:** 303 PARFUM — alta perfumaria a preço justo.
- **Atuação:** Recife e Garanhuns (Pernambuco).
- **WhatsApp:** (87) 99212-0334 — `5587992120334`. Todo CTA de conversão termina no WhatsApp.
- **Objetivos do site:** apresentar a coleção, **captar revendedores** e receber contatos.
- **Tom de voz:** sofisticado, acolhedor, direto. Português do Brasil.
- **Regras de conteúdo:**
  - Nunca citar marcas de terceiros (perfumarias, grifes, "inspirado em", "contratipo").
  - Nunca prometer ganhos, renda ou valores. A ressalva "sem promessas de ganhos" deve permanecer.
  - Modelo comercial: **somente revendedor**. Não existe "representante".
  - Não existe agendamento de atendimento nem "Área do Revendedor".

## 2. Identidade visual

### Cores
| Token | Valor | Uso |
|---|---|---|
| `--color-black` | `#0A0A0A` | fundo escuro principal, texto sobre claro |
| `--color-ivory` | `#F6F4F0` | fundo claro (Sobre, Coleção, Contato) |
| `--color-white` | `#FFFFFF` | fundo do FAQ |
| `--color-text-soft` | `#2A2A2A` | respostas do FAQ |

### Dourado (substitui o antigo champanhe)
- `--gold-solid: #C9A13B` — fallback, ícones e bordas simples, foco no escuro.
- `--gold-gradient: linear-gradient(135deg, #8C6B2E 0%, #C9A13B 22%, #F3E2A4 48%, #D4AF37 70%, #8C6B2E 100%)` — **identidade**.
- Variantes **por contraste** (WCAG AA):
  - `--gold-gradient-text` — texto **pequeno** sobre escuro (pontas `#B08A3A`, ≥ 5,7:1).
  - `--gold-gradient-deep` — texto **grande** e ícones sobre **claro** (≥ 3,8:1).
  - `--gold-deep: #7A5C1E` — foco visível e linhas de foco sobre claro (6,2:1).
- **Regras:**
  - Texto dourado = `background-clip: text` com o gradiente; `color` sólido como fallback (`@supports`).
  - Linhas finas e divisores = 1 px de gradiente.
  - Bordas = pseudo-elemento + máscara (círculos) ou `border-image: var(--gold-gradient) 1` (retângulos).
  - Botão primário no hover: preenchimento com o gradiente e texto preto (desliza da esquerda); brilho
    sutil (gradiente deslizando) só no hover e desligado com `prefers-reduced-motion`.
  - **Texto pequeno sobre fundo claro/branco é sempre preto.** Dourado no claro só em texto grande/decorativo.
- Aplicação centralizada em `src/css/gold.css`.

### Tipografia
- **Cormorant Garamond** (títulos; 300/400/500 + itálico 300/400) e **Manrope** (texto; 300–600).
- Auto-hospedadas (subset latino, `font-display: swap`), sem Google Fonts.
- Escala fluida com `clamp()` entre 360 px e 1440 px.

### Layout e ritmo
- Container de 1280 px; header, hero, seções e rodapé alinhados na mesma coluna.
- Espaço entre seções: `clamp(96px … 160px)`; entre blocos: `clamp(64px … 96px)`.
- Grid editorial de 12 colunas; áreas de toque ≥ 44 px em telas de toque.

### Movimento
- Revelação ao rolar (fade + 24 px, 800 ms, `cubic-bezier(0.22, 1, 0.36, 1)`), cascata por lote.
- Títulos H2 revelados por linha; linhas douradas que se desenham; faixa (marquee) com as linhas.
- Só `transform`/`translate`/`opacity`. Com `prefers-reduced-motion`, nada se move (só cor).
- **Sem parallax.**

## 3. Estrutura da página (`index.html`, nesta ordem)

| Âncora | Seção | Fundo |
|---|---|---|
| — | Header fixo | **preto `#0A0A0A` sempre** (topo e ao rolar) |
| `#inicio` | Hero | escuro |
| `#sobre` | Manifesto + 3 pilares | marfim |
| `#linhas` | 6 linhas de produto | escuro |
| — | Faixa (marquee) | escuro |
| `#colecao` | Catálogo | marfim |
| `#revenda` | Seja Revendedor (+ `#cadastro`) | escuro |
| `#faq` | Perguntas frequentes | **branco** |
| `#contato` | Contato + mapa + formulário | marfim |
| — | Rodapé | `#0A0A0A` |

Outras páginas: `politica-de-privacidade.html` (LGPD) e `404.html`.

## 4. Requisitos por seção

### Header
- Wordmark "303 PARFUM" (303 em itálico dourado). Navegação: **Coleção, Sobre, Revenda, Contato**.
  CTA outline "Seja Revendedor". **Sem "Área do Revendedor".**
- **Fundo preto fixo (`#0A0A0A`)** do topo ao fim da página — inclusive sem JS — com borda inferior
  dourada sutil. Ao passar de **80 px** (`.is-scrolled`, mantida até voltar ao topo) a barra só fica
  mais baixa. Sem `backdrop-filter` (prenderia o menu mobile, que é `position: fixed`).
- Menu mobile (< 1024 px): tela cheia, `aria-expanded`, foco preso, ESC fecha, trava de scroll.

### Hero
- Eyebrow "Alta perfumaria · Recife & Garanhuns"; H1 "Alta perfumaria. *Preço justo.*" (único H1);
  subtítulo; CTAs "Conheça a coleção" (primário) e "Quero revender" (outline).
- **Imagem: `src/assets/img/banner.png`** (modelo com o frasco, fundo transparente), convertida no
  build para AVIF/WebP/PNG em 480/800/1200/1600 w **limitadas à largura real** (a atual tem 550 px →
  variantes 480 e 550), com `srcset`, `fetchpriority="high"` e preload no `<head>`.
  `alt="Mulher elegante representando as fragrâncias 303 PARFUM"`. **É o LCP da página.**
- **Regra principal:** a imagem termina exatamente onde termina a seção e aparece **sempre inteira**:
  `position: absolute; bottom: 0; right: 0; height: 100%; width: auto; object-fit: contain;
  object-position: bottom right`. **Nunca `object-fit: cover`.** A seção corta só nas laterais.
- Legibilidade: degradê da esquerda (`rgba(10,10,10,.95)` → transparente em ~58%) atrás do texto,
  sem cobrir a modelo.
- Mobile (< 768 px): a imagem fica **abaixo do texto**, no fluxo, encostada na base da seção, inteira.
- Sem animação de entrada na imagem (o LCP ignora imagens pintadas com opacidade 0).

### Sobre / Manifesto
- "303" decorativo em contorno; título "O luxo está no que *toca a pele*."; texto do manifesto;
  pilares 01/02/03 (Rigor técnico · Notas ricas e duradouras · Preço justo).

### Linhas de produto
- Masculino, Feminino, Nicho, Árabe, Capilar, Óleo Corporal. Card 4:5 → "Ver fragrâncias →";
  o clique filtra o catálogo (evento `filter:category`). 3 col. desktop, 2 tablet, carrossel no mobile.

### Coleção (catálogo)
- **Título da seção: "A Coleção"** (h2 com aparência de eyebrow) + contador "X fragrâncias".
  **Não usar "Fragrâncias com assinatura."**
- Filtros (Todos + 6 linhas, `aria-pressed`, URL `?linha=`), cards de `src/data/products.json`,
  modal `<dialog>` com pirâmide olfativa, CTA "Pedir no WhatsApp".

### Seja Revendedor (`#revenda`)
- Abertura (Oportunidade 303 · "Transforme fragrâncias em renda."), **Como funciona** (01 Cadastro →
  02 Escolha seu kit → 03 Comece a vender), **Benefícios** (5 itens) e **formulário** `#cadastro`.
- **Não há bloco de modelos/comparativo nem representante.**
- Formulário: nome, WhatsApp (máscara), cidade (Recife/Garanhuns/Outra → "Qual cidade?"), já vende algo?
  (opcional), mensagem (opcional, 500), LGPD. Sem campo de interesse.
- Mensagem enviada: **"Olá! Quero ser revendedor(a) 303 PARFUM."** + dados estruturados.

### FAQ (`#faq`)
- Fundo **#FFFFFF**, coluna única centralizada de **~820 px**.
- Perguntas em **preto #0A0A0A, Cormorant, grandes**; respostas **#2A2A2A, Manrope**.
- Dourado: filete do eyebrow (texto do eyebrow em preto), palavra "*frequentes*" do título, ícone +/−
  (gira e vira −), divisores de 1 px entre perguntas.
- `<details>/<summary>` nativo (linha inteira clicável, estado expandido exposto aos leitores de tela),
  abertura suave. Perguntas em `src/data/faq.js` (mesma fonte do schema FAQPage).

### Contato
- Endereços, WhatsApp, e-mail, horário, regiões e Instagram; mapa do Google **só após clique**;
  formulário (nome, WhatsApp ou e-mail, mensagem, LGPD).

### Rodapé
- Fundo `#0A0A0A`, textos brancos/cinza, detalhes em dourado (wordmark e filete superior).
- Wordmark "303 PARFUM" + frase "Alta perfumaria. *Preço justo.*"
- Colunas: **Navegação** (Coleção, Sobre, Revenda, FAQ, Contato) · **Linhas de produto** ·
  **Contato** (WhatsApp, e-mail, endereços, horário, Recife e Garanhuns) · **Instagram**.
- Linha final: "© [ano dinâmico] 303 PARFUM", razão social/CNPJ e link da Política de Privacidade.
- 4 colunas no desktop, 2 no tablet, 1 no mobile.

## 5. Dados e configuração
- **Os HTML da raiz são completos** (abrem com duplo clique, com rodapé, FAQ e dados): o `npm run sync`
  (também automático no `start`/`dev`/`build`) reescreve só as regiões `<!-- @region … -->`
  (rodapé, FAQ, contato, SEO), os elementos `data-site`/`data-site-*` e o `srcset` do hero.
- **Empresa e domínio:** `config/site.mjs` (fonte única). Rodapé: `src/partials/footer.html`.
- **Produtos:** `src/data/products.json` (id, slug, nome, categoria ∈ 6 linhas, genero, descrições,
  notas topo/coração/fundo, família, volume_ml, preco|null, imagem, imagem_alt, destaque).
- **FAQ:** `src/data/faq.js`. **Headers/CSP:** `config/security-headers.mjs`.

## 6. Requisitos técnicos
- Vite, HTML/CSS/JS puros, módulos ES. **Nenhum script inline, handler inline ou `innerHTML` com dados.**
- CSP estrita (`'self'`, Trusted Types, iframe só Google Maps), HSTS, nosniff, X-Frame-Options DENY,
  Referrer-Policy, Permissions-Policy, COOP/CORP; arquivos para Netlify, Vercel e Apache/Hostinger.
- **Metas:** Lighthouse mobile ≥ 90 nas 4 categorias; LCP < 2,5 s (imagem do hero); CLS < 0,1.
- WCAG 2.1 AA: contraste, teclado, leitores de tela, áreas de toque ≥ 44 px.
- LGPD: consentimento nos formulários; nenhum cookie/rastreador; mapa só após clique;
  analytics futuro exige banner de consentimento.
- SEO: canonical, Open Graph, JSON-LD (Organization, WebSite, FAQPage; produtos quando houver preço),
  `robots.txt`, `sitemap.xml`.

## 7. Pendências da cliente [CONFIRMAR]
- Versão maior do `banner.png` (a atual tem 550 px; ideal ≥ 1600 px, fundo transparente).
- Domínio, e-mail, Instagram, endereços, horário, razão social e CNPJ (`config/site.mjs`).
- Produtos (nomes, notas, preços), fotos das linhas/produtos, condições de revenda.
- FAQ: formas de pagamento, prazo de entrega, envio para outras cidades.
- Revisão jurídica da Política de Privacidade.
