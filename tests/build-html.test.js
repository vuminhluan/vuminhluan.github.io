const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('buildAll renders the stable Vietnamese and English outputs', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-build-'));
  const { buildAll } = require('../scripts/build-html');

  buildAll({ outputDir });

  const outputFiles = fs.readdirSync(outputDir).sort();
  assert.deepEqual(outputFiles, ['en.html', 'index.html']);

  const vi = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
  const en = fs.readFileSync(path.join(outputDir, 'en.html'), 'utf8');
  assert.match(vi, /<html lang="vi">/);
  assert.match(en, /<html lang="en">/);
  assert.match(vi, /assets\/css\/style\.css/);
  assert.match(en, /assets\/css\/style\.css/);
  assert.doesNotMatch(`${vi}\n${en}`, /bootstrap/i);
});
