# Digital Tools Hub

Free, private, client-side tools: calculators, converters and utilities for finance, health, productivity, development and design. No sign-up, and inputs never leave the browser.

**Live site:** [digitaltoolshub.github.io](https://digitaltoolshub.github.io)

## Highlights

- **41 tools**, including a currency converter, compound interest, percentage and date calculators, image compressor, JSON formatter, Base64/JWT decoder, hash and UUID generators, loan/EMI, BMI and macro calculators, Kanban board, Pomodoro timer, password generator, QR codes and a Rubik's cube solver.
- **Category landing pages** (`finance-tools.html`, `developer-tools.html`, …) with guides, FAQs and structured data, generated from `scripts/categories.mjs`.
- **Command palette** on every page: press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> to jump to any tool.
- **Favourites and recently used** tools, stored locally in the browser.
- **Light and dark themes** (follows the system by default).
- **Installable and offline-capable** (PWA with a service worker).

## Project structure

```
index.html, about.html, …    Hub pages (shared design system)
<category>-tools.html        Category landing pages (generated, don't edit by hand)
<tool>.html                  One self-contained page per tool
assets/css/hub.css           Design system (tokens, components, light/dark)
assets/js/tools.js           Tool registry: single source of truth for all tools
assets/js/shell.js           Loaded on every page: command palette, favourites,
                             recents, "All tools" dock and related-tools strip
assets/js/hub.js             Homepage directory (search, filters, sorting), theme
assets/js/fx.js              Shared exchange rates (live, cached, offline fallback) for currency-aware tools
assets/img/icons.svg         SVG icon sprite (Lucide, ISC licence)
sw.js                        Service worker (offline cache)
scripts/build.mjs            Regenerates homepage sections, shared header/footer,
                             category pages, sitemap.xml and the SW cache version
scripts/categories.mjs       Copy (intro, guide, FAQ) for the category pages
```

## Adding or changing a tool

1. Create the tool page (e.g. `my-tool.html`). New pages can copy the structure of `percentage-calculator.html` to get the shared header, footer, related tools and styles, then add the page to `HUB_PAGES` in `scripts/build.mjs`.
2. Add an entry to `assets/js/tools.js` (name, URL, category, icon, description, search tags).
3. If the page isn't hub-styled, add these lines before `</body>` so it gets the command palette and related tools:
   ```html
   <script src="assets/js/tools.js" defer></script>
   <script src="assets/js/shell.js" defer></script>
   ```
4. Run `node scripts/build.mjs` to regenerate the homepage, category pages, `sitemap.xml` and the service-worker cache version.

Generated regions in hub pages sit between `<!-- @name -->` and `<!-- /@name -->` markers. Don't edit inside them by hand.

## Local development

Any static server works:

```sh
npx http-server -p 8080
```

## Author

Built by [Rabeeh](https://digitaltoolshub.github.io/about.html).
