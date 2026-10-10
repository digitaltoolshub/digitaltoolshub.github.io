#!/usr/bin/env node
/*
 * Regenerates the generated parts of the site from assets/js/tools.js.
 *
 *   node scripts/build.mjs
 *
 * - Hub pages: generated regions are delimited by marker comments, e.g.
 *     <!-- @header -->…<!-- /@header -->
 *   Anything outside the markers is hand-written and left untouched.
 * - Category landing pages (finance-tools.html, …) are generated in full
 *   from scripts/categories.mjs.
 * - Also rewrites sitemap.xml and stamps the service-worker cache version.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { CATEGORY_PAGES } from "./categories.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://digitaltoolshub.github.io/";
const ICONS = "assets/img/icons.svg";

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/js/tools.js"), "utf8"), ctx);
const TOOLS = ctx.window.DTH_TOOLS;
const CATS = ctx.window.DTH_CATEGORIES;
const catById = (id) => CATS.find((c) => c.id === id);
const catName = (id) => catById(id).name;
const inCat = (id) => TOOLS.filter((t) => t.cat === id);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const icon = (name, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="${ICONS}#${name}"></use></svg>`;
const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
const year = new Date().getFullYear();

// Pages that use the hub design system (header/footer/head generated here).
const HUB_PAGES = {
  "index.html": { nav: "home" },
  "about.html": { nav: "about" },
  "contact.html": { nav: "contact" },
  "privacy.html": {},
  "terms.html": {},
  "404.html": {},
  "json-formatter.html": { nav: "tools" },
  "unit-converter.html": { nav: "tools" },
  "pomodoro.html": { nav: "tools" },
  "loan-calculator.html": { nav: "tools" },
  "flight.html": { nav: "tools" },
  "percentage-calculator.html": { nav: "tools" },
  "compound-interest-calculator.html": { nav: "tools" },
  "date-calculator.html": { nav: "tools" },
  "image-compressor.html": { nav: "tools" },
  "base64-encoder.html": { nav: "tools" },
  "hash-generator.html": { nav: "tools" },
  "uuid-generator.html": { nav: "tools" },
};
for (const c of CATS) HUB_PAGES[c.slug] = { nav: "tools", category: c.id };

const FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

function head(page) {
  return `
    <link rel="icon" href="favicon.ico" sizes="any">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="apple-touch-icon" href="apple-touch-icon.png">
    <link rel="manifest" href="site.webmanifest">
    <meta name="theme-color" content="#f6f7fb" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#090b13" media="(prefers-color-scheme: dark)">
    <meta name="robots" content="${page === "404.html" ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}">
    <meta name="author" content="Rabeeh">
    <script>try{var t=localStorage.getItem("dth:theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${FONT}" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="${FONT}"></noscript>
    <link rel="stylesheet" href="assets/css/hub.css">
    <link rel="preload" href="${ICONS}" as="image" type="image/svg+xml">
    <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
    <link rel="dns-prefetch" href="https://www.googletagmanager.com">
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-R4N9RB1SNN"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-R4N9RB1SNN");</script>
    <script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="b84b76df-2fc0-4c4c-856d-b4b09a8e3c7f" async></script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3518482809806042" crossorigin="anonymous"></script>
    `;
}

function megaMenu() {
  return CATS.map((c) => `
                        <a href="${c.slug}" data-cat="${c.id}"><span class="tool-icon">${icon(c.icon, "")}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.tagline)}</small></span></a>`).join("");
}

function header(page) {
  const cur = (k) => (HUB_PAGES[page].nav === k ? ' aria-current="page"' : "");
  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
        <div class="container">
            <a class="brand" href="./" aria-label="Digital Tools Hub home"><span class="brand-mark">${icon("layout-grid", "")}</span>Digital Tools Hub</a>
            <nav class="site-nav" aria-label="Main">
                <div class="nav-dd">
                    <button type="button" aria-haspopup="true">Tools${icon("chevron-down", "")}</button>
                    <div class="mega">${megaMenu()}
                        <div class="mega-foot"><span>${TOOLS.length} free tools, no sign-up</span><a href="./#tools">Browse all tools →</a></div>
                    </div>
                </div>
                <a href="./#popular">Popular</a>
                <a href="./#new">New</a>
                <a href="about.html"${cur("about")}>About</a>
                <a href="contact.html"${cur("contact")}>Contact</a>
            </nav>
            <div class="header-actions">
                <button class="search-trigger" type="button" data-open-palette aria-label="Search tools">${icon("search")}<span class="label">Search ${TOOLS.length} tools…</span><span class="kbd" data-mod-key>Ctrl K</span></button>
                <button class="icon-btn" type="button" data-theme-toggle aria-label="Change theme">${icon("monitor", "")}</button>
                <button class="icon-btn menu-btn" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">${icon("menu", "")}</button>
            </div>
        </div>
    </header>
    <div class="mobile-menu" id="mobile-menu">
        <nav aria-label="Mobile">
            <a href="./"><span class="tool-icon">${icon("house", "")}</span>Home</a>
            <a href="./#popular"><span class="tool-icon">${icon("flame", "")}</span>Popular tools</a>
            <a href="./#new"><span class="tool-icon">${icon("sparkles", "")}</span>New tools</a>
        </nav>
        <h4>Categories</h4>
        <nav aria-label="Categories">${CATS.map((c) => `
            <a href="${c.slug}" data-cat="${c.id}"><span class="tool-icon">${icon(c.icon, "")}</span><span>${esc(c.name)}<small>${inCat(c.id).length} tools</small></span></a>`).join("")}
        </nav>
        <h4>Digital Tools Hub</h4>
        <nav aria-label="Company">
            <a href="about.html"><span class="tool-icon">${icon("info", "")}</span>About</a>
            <a href="contact.html"><span class="tool-icon">${icon("mail", "")}</span>Contact</a>
        </nav>
    </div>
    `;
}

function footer() {
  const popular = TOOLS.filter((t) => t.featured).slice(0, 7);
  const fresh = TOOLS.filter((t) => t.isNew).slice(0, 7);
  return `
    <footer class="site-footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-about">
                    <a class="brand" href="./"><span class="brand-mark">${icon("layout-grid", "")}</span>Digital Tools Hub</a>
                    <p>${TOOLS.length} free tools for money, health, work and code. No sign-up, no paywalls, and your data stays in your browser.</p>
                    <div class="footer-badges"><span>${icon("lock", "")}Private</span><span>${icon("zap", "")}Instant</span><span>${icon("wifi-off", "")}Works offline</span></div>
                </div>
                <div>
                    <h4>Popular</h4>
                    <ul>
${popular.map((t) => `                        <li><a href="${t.url}">${esc(t.name)}</a></li>`).join("\n")}
                    </ul>
                </div>
                <div>
                    <h4>New tools</h4>
                    <ul>
${fresh.map((t) => `                        <li><a href="${t.url}">${esc(t.name)}</a></li>`).join("\n")}
                    </ul>
                </div>
                <div>
                    <h4>Categories</h4>
                    <ul>
${CATS.map((c) => `                        <li><a href="${c.slug}">${esc(c.name)} tools</a></li>`).join("\n")}
                    </ul>
                </div>
                <div>
                    <h4>Company</h4>
                    <ul>
                        <li><a href="about.html">About</a></li>
                        <li><a href="contact.html">Contact</a></li>
                        <li><a href="privacy.html">Privacy policy</a></li>
                        <li><a href="terms.html">Terms of service</a></li>
                        <li><a href="sitemap.xml">Sitemap</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <span>© ${year} Digital Tools Hub. Built by <a href="about.html">Rabeeh</a>.</span>
                <span>Tip: press <span class="kbd" data-mod-key>Ctrl K</span> anywhere to jump to a tool.</span>
            </div>
        </div>
    </footer>
    <button class="to-top" type="button" aria-label="Back to top">${icon("arrow-up", "")}</button>
    `;
}

function scripts() {
  return `
    <script src="assets/js/tools.js" defer></script>
    <script src="assets/js/shell.js" defer></script>
    <script src="assets/js/hub.js" defer></script>
    `;
}

function card(t, extra = "") {
  return `
                <article class="card" data-id="${t.id}" data-cat="${t.cat}" data-name="${esc(t.name)}"${t.isNew ? ' data-new="1"' : ""}>${extra}
                    <div class="card-top">
                        <span class="tool-icon">${icon(t.icon)}</span>
                        <div class="card-badges">${t.isNew ? '<span class="badge badge-new">New</span>' : ""}<button class="fav-btn" type="button" aria-pressed="false" aria-label="Add ${esc(t.name)} to favourites">${icon("star", "")}</button></div>
                    </div>
                    <h3><a href="${t.url}">${esc(t.name)}</a></h3>
                    <p>${esc(t.desc)}</p>
                    <div class="card-foot"><span class="cat-label">${catName(t.cat)}</span>${icon("arrow-right")}</div>
                </article>`;
}

function chips() {
  const all = `
                <button class="chip" type="button" data-filter="all" aria-pressed="true">${icon("layout-grid", "")}All <span class="count">${TOOLS.length}</span></button>`;
  return all + CATS.map((c) => `
                <button class="chip" type="button" data-filter="${c.id}" aria-pressed="false">${icon(c.icon, "")}${esc(c.name)} <span class="count">${inCat(c.id).length}</span></button>`).join("") + "\n                ";
}

function popular() {
  return TOOLS.filter((t) => t.featured).slice(0, 10).map((t) => card(t, '<span class="glow" aria-hidden="true"></span>')).join("") + "\n            ";
}

function fresh() {
  return TOOLS.filter((t) => t.isNew).map((t) => card(t)).join("") + "\n            ";
}

function catTiles(current) {
  return CATS.filter((c) => c.id !== current).map((c) => `
                <a class="cat-tile" href="${c.slug}" data-cat="${c.id}">
                    <span class="tool-icon">${icon(c.icon)}</span>
                    <h3>${esc(c.name)} tools</h3>
                    <p>${esc(c.tagline)}.</p>
                    <span class="count">${inCat(c.id).length} tools ${icon("arrow-right", "")}</span>
                </a>`).join("") + "\n            ";
}

function quickLinks() {
  return ["currency", "compound", "percent", "image", "json", "password", "bmi"].map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean)
    .map((t) => `<a href="${t.url}" data-cat="${t.cat}">${icon(t.icon, "")}${esc(t.name.replace(/ (Calculator|Converter|Generator|Formatter|& Resizer)$/, ""))}</a>`).join("");
}

function related(page) {
  const t = TOOLS.find((x) => x.url === page);
  if (!t) return "";
  const c = catById(t.cat);
  const same = inCat(t.cat).filter((x) => x !== t);
  const picks = same.concat(TOOLS.filter((x) => x !== t && x.cat !== t.cat && x.featured)).slice(0, 4);
  return `
        <section class="section reveal" aria-labelledby="rel-h" style="margin-top:32px">
            <div class="section-head"><h2 id="rel-h">${icon("layers", "")}Related tools</h2><a class="see-all" href="${c.slug}">All ${esc(c.name.toLowerCase())} tools${icon("arrow-right", "")}</a></div>
            <div class="grid">${picks.map((x) => card(x)).join("")}
            </div>
        </section>
        `;
}

function itemList() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free online tools",
    itemListElement: TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: SITE + t.url })),
  };
  return `\n    ${ld(data)}\n    `;
}

function replaceRegion(html, name, content) {
  const re = new RegExp(`(<!-- @${name} -->)[\\s\\S]*?(<!-- /@${name} -->)`, "g");
  if (!re.test(html)) return html;
  return html.replace(re, (_, a, b) => a + content + b);
}

// ---------- category landing pages ----------
function categoryPage(c) {
  const copy = CATEGORY_PAGES[c.id];
  const tools = inCat(c.id);
  const url = SITE + c.slug;
  const title = `${copy.title} | Digital Tools Hub`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: copy.title, url, description: copy.description, isPartOf: { "@type": "WebSite", name: "Digital Tools Hub", url: SITE } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: `${c.name} tools`, item: url },
      ] },
      { "@type": "ItemList", itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: SITE + t.url })) },
      { "@type": "FAQPage", mainEntity: copy.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  };
  return `<!DOCTYPE html>
<html lang="en" data-hub>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Generated by scripts/build.mjs from scripts/categories.mjs. Do not edit by hand. -->
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(copy.description)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Digital Tools Hub">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(copy.description)}">
    <meta property="og:image" content="${SITE}preview.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(copy.description)}">
    <!-- @head -->${head(c.slug)}<!-- /@head -->
    ${ld(data)}
</head>
<body>
    <!-- @header -->${header(c.slug)}<!-- /@header -->

    <main id="main">
        <section class="hero" data-cat="${c.id}">
            <div class="hero-bg" aria-hidden="true"><span class="blob blob-1"></span><span class="blob blob-2"></span></div>
            <div class="container">
                <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a>${icon("chevron-right", "")}<span>${esc(c.name)} tools</span></nav>
                <span class="eyebrow"><span class="pill">${tools.length} tools</span>Free · private · no sign-up</span>
                <h1><span class="grad">${esc(copy.h1.split(" ")[0])}</span> ${esc(copy.h1.split(" ").slice(1).join(" "))}</h1>
                <p class="lead">${esc(copy.intro)}</p>
            </div>
        </section>

        <div class="container">
            <section class="section" aria-label="${esc(c.name)} tools">
                <div class="grid" id="cat-grid">${tools.map((t) => card(t)).join("")}
                </div>
            </section>

            <section class="section reveal" aria-labelledby="guide-h">
                <div class="cols-2" style="align-items:start;gap:40px">
                    <div class="prose">
                        <h2 id="guide-h" style="margin-top:0">About our ${esc(c.name.toLowerCase())} tools</h2>
${copy.body.map((p) => `                        <p>${p}</p>`).join("\n")}
                        <h3>All ${esc(c.name.toLowerCase())} tools</h3>
                        <ul>
${tools.map((t) => `                            <li><a href="${t.url}"><strong>${esc(t.name)}</strong></a>: ${esc(t.desc)}</li>`).join("\n")}
                        </ul>
                    </div>
                    <div>
                        <h2 style="font-size:1.4rem">Frequently asked questions</h2>
                        <div class="faq">
${copy.faq.map(([q, a]) => `                            <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}
                        </div>
                    </div>
                </div>
            </section>

            <section class="section reveal" aria-labelledby="more-h">
                <div class="section-head"><h2 id="more-h">${icon("layers", "")}Explore other categories</h2><a class="see-all" href="./#tools">All ${TOOLS.length} tools${icon("arrow-right", "")}</a></div>
                <div class="cat-grid">${catTiles(c.id)}</div>
            </section>
        </div>
    </main>

    <!-- @footer -->${footer()}<!-- /@footer -->

    <!-- @scripts -->${scripts()}<!-- /@scripts -->
</body>
</html>
`;
}

for (const c of CATS) {
  if (!CATEGORY_PAGES[c.id]) throw new Error("missing category copy for " + c.id);
  fs.writeFileSync(path.join(ROOT, c.slug), categoryPage(c));
}

let changed = 0;
for (const page of Object.keys(HUB_PAGES)) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) { console.warn("skip (missing):", page); continue; }
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = replaceRegion(html, "head", head(page));
  html = replaceRegion(html, "header", header(page));
  html = replaceRegion(html, "footer", footer());
  html = replaceRegion(html, "scripts", scripts());
  html = replaceRegion(html, "cards", TOOLS.map((t) => card(t)).join("") + "\n            ");
  html = replaceRegion(html, "popular", popular());
  html = replaceRegion(html, "new", fresh());
  html = replaceRegion(html, "cats", catTiles());
  html = replaceRegion(html, "quick", quickLinks());
  html = replaceRegion(html, "chips", chips());
  html = replaceRegion(html, "related", related(page));
  html = replaceRegion(html, "itemlist", itemList());
  html = html.replace(/<!-- @count -->[\s\S]*?<!-- \/@count -->/g, `<!-- @count -->${TOOLS.length}<!-- /@count -->`);
  html = html.replace(/<!-- @catcount -->[\s\S]*?<!-- \/@catcount -->/g, `<!-- @catcount -->${CATS.length}<!-- /@catcount -->`);
  if (html !== before) { fs.writeFileSync(file, html); changed++; console.log("updated", page); }
}

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: SITE, pr: "1.0", cf: "daily" },
  ...CATS.map((c) => ({ loc: SITE + c.slug, pr: "0.9", cf: "weekly" })),
  ...TOOLS.map((t) => ({ loc: SITE + t.url, pr: t.featured ? "0.9" : "0.8", cf: "monthly" })),
  ...["about.html", "contact.html", "privacy.html", "terms.html"].map((p) => ({ loc: SITE + p, pr: "0.4", cf: "yearly" })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.cf}</changefreq><priority>${u.pr}</priority></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
// Stamp the service worker cache version from the shared assets so returning
// visitors pick up new CSS/JS.
const hash = crypto.createHash("sha256");
for (const f of ["assets/css/hub.css", "assets/js/tools.js", "assets/js/shell.js", "assets/js/hub.js", "assets/js/fx.js", "assets/img/icons.svg", ...Object.keys(HUB_PAGES)]) {
  if (fs.existsSync(path.join(ROOT, f))) hash.update(fs.readFileSync(path.join(ROOT, f)));
}
const swFile = path.join(ROOT, "sw.js");
const sw = fs.readFileSync(swFile, "utf8").replace(/const VERSION = "[^"]*";/, `const VERSION = "dth-${hash.digest("hex").slice(0, 8)}";`);
fs.writeFileSync(swFile, sw);

console.log(`done: ${changed} page(s) updated, ${CATS.length} category pages, sitemap has ${urls.length} URLs`);
