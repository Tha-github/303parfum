/**
 * Abas do catálogo — ordem, rótulos, frases e a LISTA BRANCA de ?linha=.
 * Usado no build (cards gerados no HTML) e no navegador (troca de abas).
 * A primeira aba é a inicial e o destino de qualquer ?linha= inválido.
 */
export const TABS = [
  { slug: 'feminino', label: 'Feminino', menu: 'Perfumes Femininos', frase: 'Florais, gourmands e orientais para todas as ocasiões.' },
  { slug: 'masculino', label: 'Masculino', menu: 'Perfumes Masculinos', frase: 'Amadeirados, aromáticos e aquáticos de presença marcante.' },
  { slug: 'nicho', label: 'Perfumes de Nicho', menu: 'Perfumes de Nicho', frase: 'Composições raras, de assinatura exclusiva.' },
  { slug: 'arabe', label: 'Árabes', menu: 'Perfumes Árabes', frase: 'Intensidade, riqueza de notas e fixação prolongada.' },
];

export const DEFAULT_TAB = TABS[0].slug;
export const TAB_SLUGS = TABS.map((t) => t.slug);

/** ?linha=… validado contra a lista branca; inválido → aba inicial. */
export const validTab = (value) => (TAB_SLUGS.includes(value) ? value : DEFAULT_TAB);
