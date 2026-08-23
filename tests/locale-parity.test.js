const test = require('node:test');
const assert = require('node:assert/strict');

function flattenLeaves(value, prefix = '') {
  if (typeof value === 'string') {
    return { [prefix]: value };
  }

  return Object.entries(value).reduce((leaves, [key, child]) => ({
    ...leaves,
    ...flattenLeaves(child, prefix ? `${prefix}.${key}` : key),
  }), {});
}

test('Vietnamese and English locale files have identical non-empty leaves', () => {
  const vi = require('../locales/vi.json');
  const en = require('../locales/en.json');
  const viLeaves = flattenLeaves(vi);
  const enLeaves = flattenLeaves(en);

  assert.deepEqual(Object.keys(viLeaves).sort(), Object.keys(enLeaves).sort());
  for (const [key, value] of Object.entries({ ...viLeaves, ...enLeaves })) {
    assert.equal(typeof value, 'string', `${key} must be a string`);
    assert.notEqual(value.trim(), '', `${key} must not be empty`);
  }
});

test('locale outputs remain stable', () => {
  const { localeOutputs } = require('../scripts/build-html');

  assert.deepEqual(localeOutputs, { vi: 'index.html', en: 'en.html' });
});
