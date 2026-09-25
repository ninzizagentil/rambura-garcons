import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, validateField, applyKindErrors, PHONE_MIN_DIGITS, PHONE_MAX_DIGITS } from './validators.js';

test('name: keeps letters only, strips digits and symbols', () => {
  assert.equal(sanitize('name', 'Jean-Claude 123 O’Brien!'), 'Jean-Claude O’Brien');
  assert.equal(sanitize('name', 'Iradukunda  Eric'), 'Iradukunda Eric');
  assert.equal(sanitize('name', 'Uwimana Ålice éèç'), 'Uwimana Ålice éèç');
  assert.equal(validateField('name', 'Habimana Jean Claude'), '');
  assert.notEqual(validateField('name', 'Eric2'), '');
});

test('alnum: letters and numbers both allowed, dangerous symbols blocked', () => {
  assert.equal(sanitize('alnum', 'Chalk Boxes 12 <b>x</b>$%^*=|'), 'Chalk Boxes 12 bx/b');
  assert.equal(validateField('alnum', 'Class L4 (Year 2)'), '');
  assert.notEqual(validateField('alnum', '<script>'), '');
});

test('code / username: no spaces', () => {
  assert.equal(sanitize('code', 'RICE 2026/09-A!'), 'RICE2026/09-A');
  assert.equal(sanitize('username', 'gr ace@2026'), 'grace2026');
  assert.equal(validateField('code', 'ELT-015'), '');
});

test('integer / decimal / digits: numbers only', () => {
  assert.equal(sanitize('integer', '12abc.5-'), '125');
  assert.equal(sanitize('decimal', '1a2,5.7e-3'), '12.573');
  assert.equal(sanitize('decimal', 'abc'), '');
  assert.equal(sanitize('digits', '12 34-56'), '123456');
  assert.equal(validateField('decimal', '12.5'), '');
  assert.notEqual(validateField('decimal', '1.2.3'), '');
  assert.notEqual(validateField('integer', '12.5'), '');
});

test('phone: digits only, 10 to 12 digits, optional leading +', () => {
  assert.equal(PHONE_MIN_DIGITS, 10);
  assert.equal(PHONE_MAX_DIGITS, 12);
  assert.equal(sanitize('phone', '+250 788-123 456abc'), '+250788123456');
  assert.equal(sanitize('phone', '2507881234567890'), '250788123456'); // capped at 12 digits
  assert.equal(sanitize('phone', '25+0788'), '250788'); // + only allowed first
  assert.equal(validateField('phone', '250788123456'), '');      // 12 digits
  assert.equal(validateField('phone', '+250788123456'), '');     // 12 digits with +
  assert.equal(validateField('phone', '25078812345'), '');       // 11 digits
  assert.equal(validateField('phone', '0788123456'), '');        // 10 digits: accepted
  assert.notEqual(validateField('phone', '078812345'), '');      // 9 digits: too short
  assert.notEqual(validateField('phone', '2507881234567'), '');  // 13 digits: too long
  assert.notEqual(validateField('phone', '25078a123456'), '');
  assert.equal(validateField('phone', ''), '');                  // empty is "required"'s job
});

test('email: strips spaces and checks shape', () => {
  assert.equal(sanitize('email', ' a b@x .com'), 'ab@x.com');
  assert.equal(validateField('email', 'grace@example.com'), '');
  assert.notEqual(validateField('email', 'grace@example'), '');
  assert.notEqual(validateField('email', 'grace.example.com'), '');
});

test('applyKindErrors keeps existing errors and fills missing ones', () => {
  const errors = { name: 'Required' };
  applyKindErrors(errors, { name: '123', phone: '12', email: 'ok@x.rw' }, { name: 'name', phone: 'phone', email: 'email' });
  assert.equal(errors.name, 'Required');
  assert.ok(errors.phone);
  assert.equal(errors.email, undefined);
});

test('translated messages are used when the key exists', () => {
  const t = (key) => (key === 'validationPhone' ? 'Telefoni ni ibiharuro 10 kugeza 12' : key);
  assert.equal(validateField('phone', '123', t), 'Telefoni ni ibiharuro 10 kugeza 12');
  assert.match(validateField('name', '123', t), /letters only/);
});
