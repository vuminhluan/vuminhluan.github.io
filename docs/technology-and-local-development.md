# Technology and Local Development

## Requirements

- Node.js 20 or later.
- npm, included with Node.js.

## Current Technology Stack

| Area | Technology | Responsibility |
| --- | --- | --- |
| Templates | Pug | Renders one shared template tree for Vietnamese and English. |
| Data and i18n | JSON and Node.js | `data/profile.json` contains shared data; `locales/*.json` contains localized copy. |
| CSS | Tailwind CSS 4 and `@tailwindcss/cli` | Compiles the deployable stylesheet at `assets/css/style.css`. |
| UI JavaScript | Local jQuery | Controls the expanded and collapsed sidebar state. |
| Development server | BrowserSync | Serves the repository root and reloads after HTML, CSS, JavaScript, or image changes. |
| Watchers | Nodemon and Tailwind CLI | Watches Pug/JSON and source CSS changes. |
| Process orchestration | Concurrently | Runs the HTML watcher, CSS watcher, and local server in one command. |
| Tests | Node.js built-in test runner | Validates generated output, locale parity, CSS, legacy assets, and npm scripts. |

Bootstrap, Sass, Vite, React, and other bundlers or application frameworks are not required.

## Important Structure

```text
assets/tailwind/input.css   # Tailwind theme tokens, state rules, and print rules
assets/css/style.css        # Generated CSS committed for deployment
data/profile.json           # Shared resume data
locales/vi.json             # Vietnamese content
locales/en.json             # English content
layout/                     # Master page, Pug partials, and page entry
scripts/build-html.js       # Pug renderer for index.html and vi.html
tests/                      # Node test suite
```

## Start the Local Server

From the repository root:

```bash
npm ci
npm run dev
```

The `dev` command performs an initial build, then runs these processes together:

1. A Pug/JSON watcher that regenerates `index.html` and `vi.html`.
2. A Tailwind watcher that regenerates `assets/css/style.css`.
3. A BrowserSync server with live reload.

BrowserSync serves the project at `http://localhost:3000/` by default.

- English: `http://localhost:3000/`
- Vietnamese: `http://localhost:3000/vi.html`

Press `Ctrl+C` in the terminal to stop all development processes.

## Common Commands

```bash
# Render HTML for both locales
npm run build:html

# Compile Tailwind CSS
npm run build:css

# Generate all deployable output
npm run build

# Run the test suite
npm test
```

Before committing UI or content changes, run:

```bash
npm run build
npm test
```

`index.html`, `vi.html`, and `assets/css/style.css` are generated files that must be committed to preserve compatibility with the current GitHub Pages deployment flow.
