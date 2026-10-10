#!/usr/bin/env node
/*
 * Regenerates the generated regions of hub pages from assets/js/tools.js.
 *
 *   node scripts/build.mjs
 *
 * Generated regions are delimited by marker comments, e.g.
 *   <!-- @header -->…<!-- /@header -->
 * Anything outside the markers is hand-written and left untouched.
 * Also rewrites sitemap.xml.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://digitaltoolshub.github.io/";
const ICONS = "assets/img/icons.svg";

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/js/tools.js"), "utf8"), ctx);
const TOOLS = ctx.window.DTH_TOOLS;
const CATS = ctx.window.DTH_CATEGORIES;
const catName = (id) => CATS.find((c) => c.id === id).name;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const icon = (name, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="${ICONS}#${name}"></use></svg>`;
const year = new Date().getFullYear();

// Pages that use the hub design system (header/footer/head generated here).
const HUB_PAGES = {
  "index.html": { nav: "tools" },
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
};

function head() {
  return `
    <link rel="icon" href="favicon.ico" sizes="any">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="apple-touch-icon" href="apple-touch-icon.png">
    <link rel="manifest" href="site.webmanifest">
    <meta name="theme-color" content="#f7f7fb" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#0b0d14" media="(prefers-color-scheme: dark)">
    <script>try{var t=localStorage.getItem("dth:theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
    <link rel="stylesheet" href="assets/css/hub.css">
    <link rel="preload" href="${ICONS}" as="image" type="image/svg+xml">
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-R4N9RB1SNN"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-R4N9RB1SNN");</script>
    <script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="b84b76df-2fc0-4c4c-856d-b4b09a8e3c7f" async></script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3518482809806042" crossorigin="anonymous"></script>
    `;
}

function header(page) {
  const cur = (k) => (HUB_PAGES[page].nav === k ? ' aria-current="page"' : "");
  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
        <div class="container">
            <a class="brand" href="./" aria-label="Digital Tools Hub home"><span class="brand-mark">${icon("layout-grid", "")}</span>Digital Tools Hub</a>
            <nav class="site-nav" aria-label="Main">
                <a href="./"${cur("tools")}>All tools</a>
                <a href="about.html"${cur("about")}>About</a>
                <a href="contact.html"${cur("contact")}>Contact</a>
            </nav>
            <div class="header-actions">
                <button class="search-trigger" type="button" data-open-palette aria-label="Search tools">${icon("search")}<span class="label">Search tools…</span><span class="kbd" data-mod-key>Ctrl K</span></button>
                <button class="icon-btn" type="button" data-theme-toggle aria-label="Change theme">${icon("monitor", "")}</button>
            </div>
        </div>
    </header>
    `;
}

function footer() {
  const popular = TOOLS.filter((t) => t.featured).slice(0, 6);
  return `
    <footer class="site-footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-about">
                    <a class="brand" href="./"><span class="brand-mark">${icon("layout-grid", "")}</span>Digital Tools Hub</a>
                    <p>${TOOLS.length} free tools for money, health, work and code. No sign-up, no paywalls, and your data stays in your browser.</p>
                </div>
                <div>
                    <h4>Popular</h4>
                    <ul>
${popular.map((t) => `                        <li><a href="${t.url}">${esc(t.name)}</a></li>`).join("\n")}
                    </ul>
                </div>
                <div>
                    <h4>Categories</h4>
                    <ul>
${CATS.map((c) => `                        <li><a href="./?cat=${c.id}">${esc(c.name)}</a></li>`).join("\n")}
                    </ul>
                </div>
                <div>
                    <h4>Company</h4>
                    <ul>
                        <li><a href="about.html">About</a></li>
                        <li><a href="contact.html">Contact</a></li>
                        <li><a href="privacy.html">Privacy policy</a></li>
                        <li><a href="terms.html">Terms of service</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <span>© ${year} Digital Tools Hub. Built by <a href="about.html">Rabeeh</a>.</span>
                <span>Tip: press <span class="kbd" data-mod-key>Ctrl K</span> anywhere to jump to a tool.</span>
            </div>
        </div>
    </footer>
    `;
}

function scripts() {
  return `
    <script src="assets/js/tools.js" defer></script>
    <script src="assets/js/shell.js" defer></script>
    <script src="assets/js/hub.js" defer></script>
    `;
}

function card(t) {
  return `
                <article class="card" data-id="${t.id}" data-cat="${t.cat}" data-name="${esc(t.name)}"${t.isNew ? ' data-new="1"' : ""}>
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
                <button class="chip" type="button" data-filter="${c.id}" aria-pressed="false">${icon(c.icon, "")}${esc(c.name)} <span class="count">${TOOLS.filter((t) => t.cat === c.id).length}</span></button>`).join("") + "\n                ";
}

function itemList() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free online tools",
    itemListElement: TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: SITE + t.url })),
  };
  return `\n    <script type="application/ld+json">${JSON.stringify(data)}</script>\n    `;
}

function replaceRegion(html, name, content, file) {
  const re = new RegExp(`(<!-- @${name} -->)[\\s\\S]*?(<!-- /@${name} -->)`, "g");
  if (!re.test(html)) return html;
  return html.replace(re, (_, a, b) => a + content + b);
}

let changed = 0;
for (const page of Object.keys(HUB_PAGES)) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) { console.warn("skip (missing):", page); continue; }
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = replaceRegion(html, "head", head(), page);
  html = replaceRegion(html, "header", header(page), page);
  html = replaceRegion(html, "footer", footer(), page);
  html = replaceRegion(html, "scripts", scripts(), page);
  html = replaceRegion(html, "cards", TOOLS.map(card).join("") + "\n            ", page);
  html = replaceRegion(html, "chips", chips(), page);
  html = replaceRegion(html, "itemlist", itemList(), page);
  html = html.replace(/<!-- @count -->[\s\S]*?<!-- \/@count -->/g, `<!-- @count -->${TOOLS.length}<!-- /@count -->`);
  if (html !== before) { fs.writeFileSync(file, html); changed++; console.log("updated", page); }
}

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: SITE, pr: "1.0", cf: "weekly" },
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

console.log(`done: ${changed} page(s) updated, sitemap has ${urls.length} URLs`);
