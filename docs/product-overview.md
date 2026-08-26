# Product Overview

## Purpose

This is the static resume website of **Vu Minh Luan**. It presents personal information, career objectives, education, work experience, skills, activities, and interests. The site is designed to deploy directly from this repository through GitHub Pages; generated HTML and CSS files remain committed to the repository.

## User Experience

- Vietnamese page: `/` (the `index.html` file).
- English page: `/en.html` (the `en.html` file).
- Both pages use one shared template: a Projects section (interactive product simulations — see [`docs/ui-simulation-concept.md`](ui-simulation-concept.md)) followed by a single-column, print-style resume (name, contact line, then Professional Summary, Work Experience, Education, Technical Skills, and Soft Skills sections), with a `VI / EN` language control in the upper-right corner.
- The language control uses static links, marks the current page with `aria-current="page"`, and does not rely on cookies or automatic language detection.
- A floating "Print / Save as PDF" button triggers `window.print()`; the page relies on `@media print` rules (including an `@page` size/margin) rather than a pre-rendered PDF file, so visitors export the résumé straight from the browser's print dialog.
- The print layout hides the language control and the print button.

## Content and Data

Content is separated from templates so both languages always follow the same structure:

| Source | Responsibility |
| --- | --- |
| `data/profile.json` | Language-neutral resume details: name, phone, email, and website. |
| `data/simulations.json` | Language-neutral structural data for the Projects simulations (lessons, dialogue, code snippets). |
| `locales/vi.json` | Vietnamese copy. |
| `locales/en.json` | English copy. |
| `layout/` | The shared Pug template tree for both pages. |

The build script requires every translation key to exist and contain a value. Locale tests also verify that both locale files have the same key set and no empty strings.

## Publishing Flow

`npm run build` regenerates these deployable artifacts:

- `index.html`
- `en.html`
- `assets/css/style.css`

There is no browser-side i18n runtime. Both language versions are rendered at build time, so their URLs work even when JavaScript is disabled.

## Intentional Constraints

- There is no application framework, backend API, database, or CMS.
- There are no locale-prefixed routes, automatic locale selection, or stored user preferences.
- Bootstrap and Sass are no longer website dependencies. The word “Bootstrap” may still appear in the resume as a skill, but no Bootstrap library is loaded by the site.
