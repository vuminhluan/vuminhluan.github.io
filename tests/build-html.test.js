const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function findFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? findFiles(filePath) : [filePath];
  });
}

test('buildAll renders the stable Vietnamese and English outputs', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-build-'));
  const { buildAll } = require('../scripts/build-html');

  buildAll({ outputDir });

  const outputFiles = fs.readdirSync(outputDir).sort();
  assert.deepEqual(outputFiles, ['index.html', 'vi.html']);

  const en = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
  const vi = fs.readFileSync(path.join(outputDir, 'vi.html'), 'utf8');
  assert.match(vi, /<html lang="vi">/);
  assert.match(en, /<html lang="en">/);
  assert.match(vi, /assets\/css\/style\.css/);
  assert.match(en, /assets\/css\/style\.css/);
  assert.doesNotMatch(`${vi}\n${en}`, /assets\/plugins\/(css|js)\/bootstrap/i);

  for (const [html, currentLocale] of [[vi, 'vi'], [en, 'en']]) {
    assert.match(html, /href="\/vi\.html"[^>]*>VI</);
    assert.match(html, /href="\/"[^>]*>EN</);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(
      html,
      currentLocale === 'vi'
        ? /href="\/vi\.html"[^>]*aria-current="page"/
        : /href="\/"[^>]*aria-current="page"/,
    );
  }
});

test('Pug sources and vendored assets contain no Bootstrap dependency', () => {
  const pugFiles = findFiles(path.join(projectRoot, 'layout'));
  const pluginFiles = findFiles(path.join(projectRoot, 'assets', 'plugins'));

  for (const filePath of pugFiles) {
    assert.doesNotMatch(fs.readFileSync(filePath, 'utf8'), /bootstrap/i, filePath);
  }

  for (const filePath of pluginFiles) {
    assert.doesNotMatch(path.basename(filePath), /bootstrap/i, filePath);
  }
});

test('Tailwind CSS output is generated for utilities used in Pug', () => {
  childProcess.execFileSync('npm', ['run', 'build:css'], {
    cwd: projectRoot,
    stdio: 'pipe',
  });

  const css = fs.readFileSync(path.join(projectRoot, 'assets', 'css', 'style.css'), 'utf8');
  assert.notEqual(css.trim(), '');
  // Canary proving Tailwind scanned the Pug tree rather than emitting only its
  // preflight. .max-w-6xl is the page container shared by every chapter, so it
  // is stable across layout changes. It replaced .min-h-screen, which existed
  // only for the on-screen A4 CV block that the resume timeline superseded.
  assert.match(css, /\.max-w-6xl\{max-width:var\(--container-6xl\)\}/);
  assert.doesNotMatch(css, /bootstrap/i);
  assert.doesNotMatch(css, /sourceMappingURL/i);
});

test('legacy Sass and runtime translation artifacts are absent', () => {
  assert.equal(fs.existsSync(path.join(projectRoot, 'assets', 'sass')), false);
  assert.equal(fs.existsSync(path.join(projectRoot, 'assets', 'css', 'style.css.map')), false);
  assert.equal(fs.existsSync(path.join(projectRoot, 'assets', 'js', 'dict.js')), false);

  for (const outputFile of ['index.html', 'vi.html']) {
    const html = fs.readFileSync(path.join(projectRoot, outputFile), 'utf8');
    assert.doesNotMatch(html, /\.scss|dict\.js|assets\/plugins\/(css|js)\/bootstrap/i);
  }
});
