const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');

const projectRoot = path.resolve(__dirname, '..');
const templatePath = path.join(projectRoot, 'layout', 'pages', 'index.pug');
const localeOutputs = {
  vi: 'index.html',
  en: 'en.html',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function createTranslator(messages) {
  return (key) => {
    const value = key.split('.').reduce((current, part) => {
      if (!current || !Object.prototype.hasOwnProperty.call(current, part)) {
        throw new Error(`Missing translation for "${key}"`);
      }

      return current[part];
    }, messages);

    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Invalid translation for "${key}"`);
    }

    return value;
  };
}

function buildAll({ outputDir = projectRoot } = {}) {
  const profile = readJson(path.join(projectRoot, 'data', 'profile.json'));
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [locale, outputFile] of Object.entries(localeOutputs)) {
    const messages = readJson(path.join(projectRoot, 'locales', `${locale}.json`));
    const html = pug.renderFile(templatePath, {
      locale,
      lang: locale,
      profile,
      t: createTranslator(messages),
    });

    fs.writeFileSync(path.join(outputDir, outputFile), html, 'utf8');
  }
}

if (require.main === module) {
  buildAll();
}

module.exports = { buildAll, createTranslator, localeOutputs };
