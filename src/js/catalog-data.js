/**
 * Dados do catálogo no navegador: products.json validado (product-schema.js)
 * e a promoção de config.json. Nada aqui toca o DOM.
 *
 * Os cards já vêm prontos no HTML (gerados no build); estes dados servem ao
 * modal e às mensagens de WhatsApp.
 */
import rawProducts from '../data/products.json';
import config from '../data/config.json';
import { activePromo } from './price.js';
import { normalizeProducts } from './product-schema.js';

let cache = null;

/** @returns {{ produtos: ReadonlyArray<object>, promo: {de:number,por:number,texto:string}|null }} */
export function getCatalogData() {
  cache ??= Object.freeze({ produtos: normalizeProducts(rawProducts), promo: activePromo(config) });
  return cache;
}
