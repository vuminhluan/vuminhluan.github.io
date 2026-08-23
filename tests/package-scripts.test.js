const test = require('node:test');
const assert = require('node:assert/strict');

const packageJson = require('../package.json');

test('package exposes the static-site development workflow', () => {
  for (const name of ['dev', 'build', 'build:html', 'build:css', 'watch:html', 'watch:css', 'serve']) {
    assert.equal(typeof packageJson.scripts[name], 'string', `missing ${name} script`);
  }

  assert.match(packageJson.scripts.dev, /^npm run build && concurrently -k/);
});
