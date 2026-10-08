/**
 * Mapa sob demanda (#contato).
 *
 * Até o clique em "Ver no mapa" nenhuma requisição vai para o Google
 * (privacidade/LGPD + performance): mostramos um placeholder local.
 * Depois do clique, o iframe é criado e a troca de cidade só atualiza o src.
 */

import { SITE } from '../../config/site.mjs';

// Endereços e buscas do mapa: editar em config/site.mjs (SITE.places)
export const PLACES = Object.freeze(
  Object.fromEntries(
    Object.entries(SITE.places).map(([key, p]) => [key, { label: p.label, query: p.mapsQuery }]),
  ),
);

const embedUrl = (query) => `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
const externalUrl = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export function initMap(root = document.querySelector('[data-map]')) {
  if (!root) return null;

  const frame = root.querySelector('[data-map-frame]');
  const placeholder = root.querySelector('[data-map-placeholder]');
  const label = root.querySelector('[data-map-label]');
  const loadBtn = root.querySelector('[data-map-load]');
  const loadSr = root.querySelector('[data-map-load-sr]');
  const external = root.querySelector('[data-map-external]');
  const tabs = [...root.querySelectorAll('[data-map-place]')];

  let current = tabs.find((t) => t.getAttribute('aria-pressed') === 'true')?.dataset.mapPlace ?? 'recife';
  let iframe = null;

  function render() {
    const place = PLACES[current];
    tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.mapPlace === current)));
    if (label) label.textContent = place.label;
    if (loadSr) loadSr.textContent = `: ${place.label}`;
    if (external) external.href = externalUrl(place.query);
    if (iframe) {
      iframe.src = embedUrl(place.query);
      iframe.title = `Mapa do Google: ${place.label}`;
    }
  }

  function load() {
    if (iframe) return;
    const place = PLACES[current];
    iframe = document.createElement('iframe');
    iframe.className = 'map__iframe';
    iframe.src = embedUrl(place.query);
    iframe.title = `Mapa do Google: ${place.label}`;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    placeholder.replaceWith(iframe);
    frame.classList.add('is-loaded');
    // o botão sumiu: o foco segue para o mapa em vez de cair no <body>
    iframe.focus();
  }

  loadBtn?.addEventListener('click', load);
  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      if (!PLACES[tab.dataset.mapPlace]) return;
      current = tab.dataset.mapPlace;
      render();
    }),
  );

  render();
  return { load };
}
