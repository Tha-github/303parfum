/**
 * WhatsApp — fonte única do número e das mensagens.
 *
 * Uso no HTML (progressive enhancement):
 *   <a href="https://wa.me/{{site.whatsapp.number}}" data-whatsapp
 *      data-whatsapp-message="Texto opcional">…</a>
 * O href já funciona sem JS; initWhatsAppLinks() acrescenta a mensagem.
 */

import { SITE } from '../../config/site.mjs';

export const WHATSAPP_NUMBER = SITE.whatsapp.number; // editar em config/site.mjs

export const MENSAGENS = Object.freeze({
  geral: 'Olá! Vim pelo site da 303 Parfum e gostaria de saber mais sobre as fragrâncias.',
  revenda: 'Olá! Vim pelo site da 303 Parfum e tenho interesse em ser revendedor(a).',
  produto: (nome, volumeMl) =>
    volumeMl
      ? `Olá! Tenho interesse no perfume ${nome} (${volumeMl}ml).`
      : `Olá! Tenho interesse no perfume ${nome}.`,
  revendaProduto: (nome) => `Olá! Tenho interesse em revender o perfume ${nome}.`,
  linha: (linha) => `Olá! Gostaria de saber quando chegam novidades da linha ${linha}.`,
});

/**
 * Monta o link do WhatsApp com a mensagem codificada.
 * @param {string} [mensagem] Texto livre; vazio gera link sem ?text=.
 * @returns {string}
 */
export function buildWhatsAppLink(mensagem = MENSAGENS.geral) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  const texto = String(mensagem ?? '').trim();
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/**
 * Aplica buildWhatsAppLink a todos os [data-whatsapp] dentro de `root`.
 * @param {ParentNode} [root]
 */
export function initWhatsAppLinks(root = document) {
  root.querySelectorAll('[data-whatsapp]').forEach((link) => {
    link.href = buildWhatsAppLink(link.dataset.whatsappMessage || MENSAGENS.geral);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}
