/**
 * Preço e promoção — funções puras, usadas no build (cards no HTML) e no
 * navegador (modal, mensagens). A configuração vem de src/data/config.json.
 */
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 199.9 → "R$ 199,90" (com espaço que não quebra entre R$ e o número). */
export const formatBRL = (value) => brl.format(value);

/** Para mensagens de WhatsApp: mesmo formato, com espaço comum. */
export const formatBRLText = (value) => formatBRL(value).replace(/ /g, ' ');

/** 199.9 → "199 reais e 90 centavos"; 250 → "250 reais"; 1 → "1 real". */
export function priceToWords(value) {
  const cents = Math.round(value * 100);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const parts = [];
  if (reais > 0) parts.push(`${reais} ${reais === 1 ? 'real' : 'reais'}`);
  if (centavos > 0) parts.push(`${centavos} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  return parts.join(' e ') || '0 reais';
}

/** Promoção ativa e válida, ou null. */
export function activePromo(config) {
  const p = config?.promocao;
  const ok = p && p.ativa === true && Number.isFinite(p.preco_de) && Number.isFinite(p.preco_por) && p.preco_por > 0;
  return ok ? { de: p.preco_de, por: p.preco_por, texto: String(p.texto ?? '').trim() } : null;
}

/** Promoção que vale para o produto (marcado com "promocao": true), ou null. */
export const promoFor = (product, promo) => (product?.promocao ? promo : null);

/** Texto acessível: "de 250 reais por 199 reais e 90 centavos". */
export const promoSpoken = (promo) => `de ${priceToWords(promo.de)} por ${priceToWords(promo.por)}`;
