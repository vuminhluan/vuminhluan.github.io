
# vuminhluan.github.io

## Development

```bash
npm ci
npm run dev
npm test
npm run build
```

`npm run dev` rebuilds Pug and Tailwind sources, serves the repository root, and live-reloads changed HTML, CSS, JavaScript, and images. `npm run build` regenerates the deployable `index.html`, `vi.html`, and `assets/css/style.css` files.

English is the default and is served at `/`; Vietnamese is available at `/vi.html`. These generated files remain committed so the existing GitHub Pages deployment continues to work.
permalink: /index.html
