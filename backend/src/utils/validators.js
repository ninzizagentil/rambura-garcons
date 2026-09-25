const withOptions = (rule, options = {}) => ({ ...rule, ...options });

const textRule = (pattern, message) => ({ pattern, message });

export const rules = {
  name(label, options = {}) {
    return withOptions(textRule(/^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u, `${label} has an invalid format`), options);
  },

  alnum(label, options = {}) {
    return withOptions(textRule(/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.,;:!?'’&()#+/_-]*$/u, `${label} has an invalid format`), options);
  },

  code(label, options = {}) {
    return withOptions(textRule(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, `${label} has an invalid format`), options);
  },

  username(label, options = {}) {
    return withOptions(textRule(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, `${label} has an invalid format`), options);
  },

  integer(label, options = {}) {
    return withOptions(textRule(/^\d+$/, `${label} must be a whole number`), options);
  },

  number(label, options = {}) {
    return withOptions(textRule(/^(\d+\.?\d*|\.\d+)$/, `${label} must be a valid number`), options);
  },

  phone(label, options = {}) {
    return withOptions({
      validate: (value) => {
        if (!/^\+?\d+$/.test(String(value))) return false;
        const digits = String(value).replace(/\D/g, '').length;
        return digits >= 10 && digits <= 12;
      },
      message: `${label} must contain 10 to 12 digits`,
    }, options);
  },
};

// --- Phone clean-up helpers (used by `npm run fix:phones`) -------------------------------------
const PHONE_OK = /^\+?\d{10,12}$/; // same rule as rules.phone: optional "+", 10 to 12 digits

/**
 * Cleans a stored phone number: keeps a leading "+", drops spaces, dots, dashes and brackets.
 * `valid` says whether the cleaned number now follows the 10-12 digit rule. Text that contains
 * anything else (letters, "/" between two numbers, ...) is never guessed at - it is returned
 * unchanged with valid=false so a person can fix it by hand.
 */
export function normalizePhone(value) {
  const original = String(value ?? '').trim();
  if (!original) return { value: original, valid: true, changed: false };
  if (!/^\+?[\d\s().-]+$/.test(original)) return { value: original, valid: false, changed: false };
  const cleaned = (original.startsWith('+') ? '+' : '') + original.replace(/\D/g, '');
  return { value: cleaned, valid: PHONE_OK.test(cleaned), changed: cleaned !== original };
}

const readPath = (object, path) => path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), object);

/** Returns what to change (`fixes`) and what needs a person (`manual`) without touching the database. */
export function collectPhoneFixes(docs, fields, describe = (doc) => String(doc._id)) {
  const fixes = [];
  const manual = [];
  for (const doc of docs) {
    for (const field of fields) {
      const current = readPath(doc, field);
      if (current == null || String(current).trim() === '') continue;
      const result = normalizePhone(current);
      if (result.valid && !result.changed) continue;
      const row = { id: doc._id, who: describe(doc), field, from: String(current), to: result.value };
      (result.valid ? fixes : manual).push(row);
    }
  }
  return { fixes, manual };
}
