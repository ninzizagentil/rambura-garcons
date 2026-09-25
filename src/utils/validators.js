/**
 * Shared input rules for every form in the app.
 *
 * Each "kind" describes what a field is allowed to contain:
 *   name      letters only (+ space ' . -)          e.g. person names, districts
 *   lettersOnly letters and spaces only              e.g. developer names and roles
 *   alnum     letters AND numbers (+ space . , ; : ! ? ' & ( ) # + / _ -)
 *             e.g. item names, book titles, addresses, school names
 *   code      letters + numbers, no spaces (+ . _ / -)   e.g. batch no., book code
 *   username  letters + numbers, no spaces (+ . _ -)
 *   integer   whole numbers only (0-9)                  e.g. number of copies
 *   decimal   numbers with an optional decimal point    e.g. quantity, price
 *   digits    digits only, no limit rules               e.g. 6-digit verification code
 *   phone     digits only (optional leading +), 10 to 12 digits
 *   email     no spaces, must look like name@domain.tld
 *
 * `sanitize()` runs while the person types/pastes (so an invalid character can
 * never enter the field). `validateField()` runs on submit and returns an
 * error message (or '' when the value is fine).
 */

// Phone numbers must have at least 10 digits (e.g. 0788123456) and NOT MORE than 12
// (e.g. 250788123456). Fewer than 10 digits is rejected.
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 12;

const collapseSpaces = (value) => value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');

export const SANITIZERS = {
  name: (value) => collapseSpaces(value.replace(/[^\p{L}\p{M}\s'’.-]/gu, '')),
  lettersOnly: (value) => collapseSpaces(value.replace(/[^\p{L}\p{M}\s]/gu, '')),
  itemName: (value) => collapseSpaces(value.replace(/[^\p{L}\p{M}\p{N}\s]/gu, '')),
  alnum: (value) => collapseSpaces(value.replace(/[^\p{L}\p{M}\p{N}\s.,;:!?'’&()#+/_-]/gu, '')),
  code: (value) => value.replace(/[^A-Za-z0-9._/-]/g, ''),
  username: (value) => value.replace(/[^A-Za-z0-9._-]/g, ''),
  integer: (value) => value.replace(/\D/g, ''),
  digits: (value) => value.replace(/\D/g, ''),
  decimal: (value) => {
    const cleaned = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const firstDot = cleaned.indexOf('.');
    return firstDot === -1 ? cleaned : `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`;
  },
  phone: (value) => {
    const plus = value.trimStart().startsWith('+') ? '+' : '';
    return plus + value.replace(/\D/g, '').slice(0, PHONE_MAX_DIGITS);
  },
  email: (value) => value.replace(/\s/g, '').slice(0, 254),
};

/** Extra props each kind gives the <input> (mobile keyboard + native hints). */
export const KIND_INPUT_PROPS = {
  name: { type: 'text', autoComplete: 'off' },
  lettersOnly: { type: 'text', autoComplete: 'off' },
  itemName: { type: 'text', autoComplete: 'off' },
  alnum: { type: 'text' },
  code: { type: 'text', autoCapitalize: 'characters', spellCheck: false },
  username: { type: 'text', autoCapitalize: 'none', spellCheck: false },
  integer: { type: 'text', inputMode: 'numeric' },
  digits: { type: 'text', inputMode: 'numeric' },
  decimal: { type: 'text', inputMode: 'decimal' },
  phone: { type: 'tel', inputMode: 'tel', maxLength: PHONE_MAX_DIGITS + 1 },
  email: { type: 'email', inputMode: 'email', autoCapitalize: 'none', spellCheck: false },
};

export function sanitize(kind, value) {
  const fn = SANITIZERS[kind];
  return fn && typeof value === 'string' ? fn(value) : value;
}

const MESSAGES = {
  name: ['validationLetters', 'Use letters only — numbers and symbols are not allowed.'],
  lettersOnly: ['validationLetters', 'Use letters only — numbers and symbols are not allowed.'],
  itemName: ['validationItemName', 'Use letters, numbers and spaces only.'],
  alnum: ['validationAlnum', 'Use letters and numbers only (no special symbols).'],
  code: ['validationCode', 'Use letters, numbers and - . _ / only (no spaces).'],
  username: ['validationUsername', 'Use letters, numbers and . _ - only (no spaces).'],
  integer: ['validationInteger', 'Enter a whole number (digits only).'],
  digits: ['validationInteger', 'Enter a whole number (digits only).'],
  decimal: ['validationNumber', 'Enter a valid number (digits only, e.g. 12 or 12.5).'],
  phone: ['validationPhone', `Phone number must have ${PHONE_MIN_DIGITS} to ${PHONE_MAX_DIGITS} digits (numbers only, e.g. 0788123456 or 250788123456).`],
  email: ['validationEmail', 'Enter a valid email address (e.g. name@example.com).'],
};

const TESTS = {
  name: (v) => /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u.test(v),
  lettersOnly: (v) => /^[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+)*$/u.test(v),
  itemName: (v) => /^[\p{L}\p{M}\p{N}]+(?:\s+[\p{L}\p{M}\p{N}]+)*$/u.test(v),
  alnum: (v) => /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.,;:!?'’&()#+/_-]*$/u.test(v),
  code: (v) => /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(v),
  username: (v) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v),
  integer: (v) => /^\d+$/.test(v),
  digits: (v) => /^\d+$/.test(v),
  decimal: (v) => /^(\d+\.?\d*|\.\d+)$/.test(v),
  phone: (v) => {
    if (!/^\+?\d+$/.test(v)) return false;
    const digits = v.replace(/\D/g, '').length;
    return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
  },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
};

/**
 * Returns an error message when `value` breaks the rule for `kind`, otherwise ''.
 * An empty value is NOT an error here — "required" stays the form's own check.
 * Pass the app's `t()` to get the message in the active language.
 */
export function validateField(kind, value, t) {
  const test = TESTS[kind];
  if (!test) return '';
  const text = typeof value === 'string' ? value.trim() : value == null ? '' : String(value);
  if (text === '') return '';
  if (test(text)) return '';
  const [key, fallback] = MESSAGES[kind];
  const translated = t ? t(key) : key;
  return translated && translated !== key ? translated : fallback;
}

/**
 * Validates many fields at once: `kinds` maps a field name to a kind.
 * Adds a message to `errors` only when the field has no error yet.
 *   applyKindErrors(next, form, { phone: 'phone', email: 'email' }, t)
 */
export function applyKindErrors(errors, values, kinds, t) {
  for (const [field, kind] of Object.entries(kinds)) {
    if (errors[field]) continue;
    const message = validateField(kind, values?.[field], t);
    if (message) errors[field] = message;
  }
  return errors;
}
