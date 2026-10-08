/**
 * Motor de formulários reutilizável (revenda, contato…).
 *
 * Cada formulário é descrito por uma configuração (ver reseller-form.js):
 *
 *   createForm(formEl, {
 *     fields: {
 *       nome: { label: 'Nome', maxLength: 80, rules: [required(), minLength(3)] },
 *       ...
 *     },
 *     honeypot: 'empresa',          // name do campo-armadilha
 *     cooldownMs: 10_000,            // bloqueio entre envios
 *     minFillMs: 1_500,              // envio mais rápido que isso = robô
 *     buildMessage: (values) => '',  // texto que vai para o WhatsApp
 *     successEl,                     // elemento de sucesso (opcional)
 *   });
 *
 * Convenções de marcação (por campo `x`):
 *   [data-field="x"]       wrapper (pode ter `hidden` → campo ignorado)
 *   name="x"               controle(s); radios compartilham o name
 *   [data-error-for="x"]   parágrafo de erro, já referenciado em aria-describedby
 *
 * Nada aqui envia dados para servidor: o "envio" monta a mensagem e abre o
 * WhatsApp. Dados do usuário só entram no DOM via textContent.
 */
import { buildWhatsAppLink } from './whatsapp.js';

// ==========================================================================
// Sanitização
// ==========================================================================

// Controles C0/C1 (exceto \n) + caracteres invisíveis de largura zero e de
// direção de texto (usados para disfarçar conteúdo).
const CONTROL_CHARS = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

/**
 * @param {unknown} value
 * @param {{ maxLength?: number, multiline?: boolean }} [options]
 * @returns {string}
 */
export function sanitizeText(value, { maxLength = 200, multiline = false } = {}) {
  let text = String(value ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROL_CHARS, '');

  if (multiline) {
    text = text
      .split('\n')
      .map((line) => line.replace(/ {2,}/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // no máximo uma linha em branco seguida
  } else {
    text = text.replace(/\s+/g, ' ');
  }

  // Corta por caractere visível (code point), não por unidade UTF-16
  return Array.from(text.trim()).slice(0, maxLength).join('').trim();
}

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

// ==========================================================================
// Telefone BR: máscara (00) 00000-0000
// ==========================================================================

/** Normaliza para 11 dígitos nacionais (remove +55 colado). */
export function normalizePhoneBR(value) {
  let digits = onlyDigits(value);
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  return digits.slice(0, 11);
}

export function formatPhoneBR(value) {
  const d = normalizePhoneBR(value);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Aplica a máscara enquanto digita, preservando a posição do cursor. */
export function attachPhoneMask(input) {
  input.addEventListener('input', () => {
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = onlyDigits(input.value.slice(0, caret)).length;
    const formatted = formatPhoneBR(input.value);
    input.value = formatted;

    // Reposiciona o cursor após o mesmo número de dígitos
    let pos = 0;
    for (let seen = 0; pos < formatted.length && seen < digitsBeforeCaret; pos++) {
      if (/\d/.test(formatted[pos])) seen++;
    }
    input.setSelectionRange(pos, pos);
  });
}

// ==========================================================================
// Regras de validação: (value, values) => mensagem de erro | ''
// ==========================================================================

export const rules = {
  required: (message = 'Campo obrigatório.') => (value) =>
    value === '' || value === false || value === null ? message : '',

  minLength: (min, message) => (value) =>
    value && Array.from(value).length < min ? message ?? `Digite pelo menos ${min} caracteres.` : '',

  maxLength: (max, message) => (value) =>
    value && Array.from(value).length > max ? message ?? `Use no máximo ${max} caracteres.` : '',

  hasLetters: (message = 'Use letras neste campo.') => (value) =>
    value && !/\p{L}{2,}/u.test(value) ? message : '',

  phoneBR: (message = 'Informe um WhatsApp válido com DDD, ex.: (87) 99999-9999.') => (value) =>
    value && !isPhoneBR(value) ? message : '',

  oneOf: (options, message = 'Escolha uma das opções.') => (value) =>
    value && !options.includes(value) ? message : '',

  email: (message = 'Informe um e-mail válido.') => (value) =>
    value && !isEmail(value) ? message : '',

  phoneOrEmail: (message = 'Informe um WhatsApp com DDD ou um e-mail válido.') => (value) =>
    value && !isEmail(value) && !isPhoneBR(value) ? message : '',

};

// ==========================================================================
// Utilitários de contato
// ==========================================================================

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value));

export function isPhoneBR(value) {
  if (/[^\d\s()+-]/.test(String(value))) return false;
  const d = normalizePhoneBR(value);
  const ddd = Number(d.slice(0, 2));
  return d.length === 11 && ddd >= 11 && ddd <= 99 && d[2] === '9';
}


// ==========================================================================
// Formulário
// ==========================================================================

const COOLDOWN_KEY = (id) => `303:form-cooldown:${id}`;
const MAX_MESSAGE_LENGTH = 1_800;

const storage = {
  get(key) {
    try {
      return Number(sessionStorage.getItem(key)) || 0;
    } catch {
      return 0;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, String(value));
    } catch {
      /* modo privado / bloqueado: o controle em memória continua valendo */
    }
  },
};

export function createForm(form, config) {
  if (!form) return null;

  const {
    fields,
    honeypot,
    cooldownMs = 10_000,
    minFillMs = 1_500,
    buildMessage,
    successEl = null,
    onSuccess,
  } = config;

  const id = form.id || form.dataset.form || 'form';
  const statusEl = form.querySelector('[data-form-status]');
  let lastSubmit = storage.get(COOLDOWN_KEY(id));
  let attempted = false; // após a 1ª tentativa, valida também no blur/input
  let readyAt = performance.now(); // para o tempo mínimo de preenchimento

  // ---- Acesso aos campos ------------------------------------------------
  const wrapper = (name) => form.querySelector(`[data-field="${name}"]`);
  const isActive = (name) => !wrapper(name)?.hidden;
  const controls = (name) => {
    const el = form.elements.namedItem(name);
    if (!el) return [];
    return el instanceof RadioNodeList ? [...el] : [el];
  };

  function rawValue(name) {
    const els = controls(name);
    if (els.length === 0) return '';
    const [first] = els;
    if (first.type === 'radio') return els.find((el) => el.checked)?.value ?? '';
    if (first.type === 'checkbox') return first.checked;
    return first.value;
  }

  function readValues() {
    const values = {};
    for (const [name, field] of Object.entries(fields)) {
      if (!isActive(name)) continue;
      const raw = rawValue(name);
      values[name] = typeof raw === 'boolean'
        ? raw
        : sanitizeText(raw, { maxLength: field.maxLength ?? 200, multiline: field.multiline });
    }
    return values;
  }

  // ---- Erros acessíveis ------------------------------------------------
  function setError(name, message) {
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) errorEl.textContent = message;
    wrapper(name)?.classList.toggle('is-invalid', Boolean(message));
    for (const el of controls(name)) {
      if (message) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }
  }

  function validateField(name, values = readValues()) {
    const field = fields[name];
    if (!field || !isActive(name)) {
      setError(name, '');
      return '';
    }
    const message = (field.rules ?? []).map((rule) => rule(values[name], values)).find(Boolean) ?? '';
    setError(name, message);
    return message;
  }

  function validateAll() {
    const values = readValues();
    const invalid = Object.keys(fields).filter((name) => validateField(name, values));
    return { values, invalid };
  }

  function focusField(name) {
    const els = controls(name);
    const target = els.find((el) => el.checked) ?? els[0];
    target?.focus();
  }

  const setStatus = (message) => {
    if (statusEl) statusEl.textContent = message;
  };

  // ---- Validação ao vivo (depois da primeira tentativa) ----------------
  const fieldNameOf = (target) => target.closest('[data-field]')?.dataset.field;

  form.addEventListener('focusout', (event) => {
    const name = fieldNameOf(event.target);
    if (name && (attempted || event.target.value)) validateField(name);
  });

  form.addEventListener('input', (event) => {
    const name = fieldNameOf(event.target);
    // Só limpa/atualiza erro de campo já marcado; não acusa enquanto digita
    if (name && wrapper(name)?.classList.contains('is-invalid')) validateField(name);
  });

  form.addEventListener('change', (event) => {
    const name = fieldNameOf(event.target);
    if (name && attempted) validateField(name);
  });

  // ---- Máscaras e contadores -------------------------------------------
  form.querySelectorAll('[data-mask="phone-br"]').forEach(attachPhoneMask);
  form.querySelectorAll('[data-counter]').forEach(attachCounter);

  // ---- Envio ----------------------------------------------------------
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    attempted = true;
    setStatus('');

    // Antispam silencioso (1/2): honeypot preenchido. O robô vê um sucesso
    // falso e nada é aberto.
    if (honeypot && rawValue(honeypot)) {
      showSuccess({}, null);
      return;
    }

    const { values, invalid } = validateAll();
    if (invalid.length) {
      setStatus(
        invalid.length === 1
          ? 'Há 1 campo para corrigir.'
          : `Há ${invalid.length} campos para corrigir.`,
      );
      focusField(invalid[0]);
      return;
    }

    // Antispam silencioso (2/2): formulário VÁLIDO enviado rápido demais
    // (nenhuma pessoa rola até aqui e preenche tudo em 1,5 s). Vem depois da
    // validação: um clique acidental num form vazio ainda mostra os erros.
    if (performance.now() - readyAt < minFillMs) {
      showSuccess({}, null);
      return;
    }

    const now = Date.now();
    const wait = Math.ceil((lastSubmit + cooldownMs - now) / 1000);
    if (wait > 0) {
      setStatus(`Aguarde ${wait} segundo${wait > 1 ? 's' : ''} antes de enviar novamente.`);
      return;
    }
    lastSubmit = now;
    storage.set(COOLDOWN_KEY(id), now);

    // Limite final de tamanho: os campos já têm teto, isto é a última barreira
    const message = Array.from(buildMessage(values)).slice(0, MAX_MESSAGE_LENGTH).join('');
    const link = buildWhatsAppLink(message);
    // Abre na mesma interação do clique (não é bloqueado como pop-up)
    window.open(link, '_blank', 'noopener,noreferrer');
    showSuccess(values, link);
    onSuccess?.(values, link);
  });

  // ---- Sucesso / reinício ---------------------------------------------
  function showSuccess(values, link) {
    if (!successEl) {
      setStatus('Tudo pronto! Conclua o envio na conversa do WhatsApp.');
      return;
    }
    const nameEl = successEl.querySelector('[data-success-name]');
    if (nameEl) nameEl.textContent = (values.nome ?? '').split(' ')[0] || 'obrigado';
    const linkEl = successEl.querySelector('[data-success-link]');
    if (linkEl) {
      linkEl.hidden = !link;
      if (link) linkEl.href = link;
    }
    form.hidden = true;
    successEl.hidden = false;
    successEl.focus();
  }

  function reset() {
    form.reset();
    readyAt = performance.now();
    attempted = false;
    Object.keys(fields).forEach((name) => setError(name, ''));
    form.querySelectorAll('[data-counter]').forEach((el) => el.dispatchEvent(new Event('input')));
    setStatus('');
    form.dispatchEvent(new CustomEvent('form:reset'));
    if (successEl) successEl.hidden = true;
    form.hidden = false;
    focusField(Object.keys(fields)[0]);
  }

  successEl?.querySelector('[data-form-reset]')?.addEventListener('click', reset);

  return { validateAll, reset, readValues, setError };
}

// ==========================================================================
// Contador de caracteres
// ==========================================================================

/**
 * Contador visual (aria-hidden) + anúncio para leitor de tela só em marcos
 * (50, 20 e 0 restantes), para não falar a cada tecla.
 */
function attachCounter(field) {
  const counter = document.getElementById(field.dataset.counter);
  const live = field.closest('[data-field]')?.querySelector('[data-counter-live]');
  const max = Number(field.getAttribute('maxlength')) || 500;
  let lastBucket = null;

  field.addEventListener('input', () => {
    // .length (UTF-16) é a mesma unidade que o maxlength do navegador usa
    const remaining = max - field.value.length;
    if (counter) {
      counter.textContent = `${field.value.length}/${max}`;
      counter.classList.toggle('is-near-limit', remaining <= 50);
    }

    const bucket = remaining <= 0 ? 0 : remaining <= 20 ? 20 : remaining <= 50 ? 50 : null;
    if (live && bucket !== lastBucket) {
      if (bucket === null) live.textContent = '';
      else live.textContent = bucket === 0 ? 'Limite de caracteres atingido.' : `Restam ${remaining} caracteres.`;
    }
    lastBucket = bucket;
  });
}
