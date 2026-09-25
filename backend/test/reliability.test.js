import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedImageBuffer, validatePassword } from '../src/middleware/validate.js';

test('password validation requires at least eight characters', () => {
  assert.equal(validatePassword('short'), false);
  assert.equal(validatePassword('secure-pass'), true);
});

test('image validation checks file signatures, not only MIME type', () => {
  assert.equal(isAllowedImageBuffer(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'), true);
  assert.equal(isAllowedImageBuffer(Buffer.from('not an image'), 'image/png'), false);
});