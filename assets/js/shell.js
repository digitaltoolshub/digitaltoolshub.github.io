/*
 * Digital Tools Hub — shared shell, loaded on every page after tools.js.
 *
 *  - Command palette (Ctrl/Cmd+K) to jump to any tool, with recents.
 *  - Favourites + recently used tools (localStorage, never leaves the browser).
 *  - On tool pages: a small "All tools" dock and a "More tools" strip at the
 *    end of the page. Everything renders inside Shadow DOM so it can't clash
 *    with each tool's own CSS.
 *
 * Opt-outs on the <script> tag: data-dock="off", data-related="off".
 */
(function () {
  "use strict";
  if (window.DTH && window.DTH.__shell) return;

  var TOOLS = window.DTH_TOOLS || [];
  var CATS = window.DTH_CATEGORIES || [];
  var script = document.currentScript || document.querySelector('script[src*="shell.js"]');
  var base = script ? script.src.replace(/assets\/js\/shell\.js.*$/, "") : "/";
  var ICONS = base + "assets/img/icons.svg";
  var isHub = document.documentElement.hasAttribute("data-hub");

  // ---------- storage helpers ----------
  function read(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }
  function byId(id) { for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i]; return null; }
  function catSlug(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].slug; return ""; }
  function catName(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].name; return id; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function icon(name, cls) { return '<svg class="' + (cls || "i") + '" aria-hidden="true"><use href="' + ICONS + "#" + name + '"></use></svg>'; }

  var listeners = [];
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  function getFavs() { return read("dth:favs", []).filter(byId); }
  function isFav(id) { return getFavs().indexOf(id) !== -1; }
  function toggleFav(id) {
    var f = getFavs(), i = f.indexOf(id);
    if (i === -1) f.unshift(id); else f.splice(i, 1);
    write("dth:favs", f); emit();
    return i === -1;
  }
  function getRecents() { return read("dth:recent", []).filter(byId); }
  function trackVisit(id) {
    var r = getRecents().filter(function (x) { return x !== id; });
    r.unshift(id); write("dth:recent", r.slice(0, 8));
    var counts = read("dth:visits", {}); counts[id] = (counts[id] || 0) + 1; write("dth:visits", counts);
  }
  function clearRecents() { write("dth:recent", []); emit(); }

  // Which tool is this page?
  var path = decodeURIComponent(location.pathname.split("/").pop() || "index.html").toLowerCase();
  var current = null;
  TOOLS.forEach(function (t) { if (t.url.toLowerCase() === path) current = t; });
  if (current) trackVisit(current.id);

  // ---------- search ----------
  function score(t, q) {
    if (!q) return 1;
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean), total = 0;
    var name = t.name.toLowerCase(), alias = (t.alias || "").toLowerCase();
    var hay = (t.tags + " " + catName(t.cat) + " " + t.desc).toLowerCase();
    for (var i = 0; i < terms.length; i++) {
      var w = terms[i], s = 0;
      if (name.indexOf(w) === 0) s = 100;
      else if (new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(name)) s = 70;
      else if (name.indexOf(w) !== -1) s = 45;
      else if (alias.indexOf(w) !== -1) s = 40;
      else if (hay.indexOf(w) !== -1) s = 20;
      else if (subseq(name, w)) s = 6;
      if (!s) return 0;
      if (t.id.indexOf(w) === 0) s += 30;
      total += s;
    }
    return total;
  }
  function subseq(h, n) { var j = 0; for (var i = 0; i < h.length && j < n.length; i++) if (h[i] === n[j]) j++; return j === n.length && n.length > 2; }
  function search(q) {
    return TOOLS.map(function (t) { return { t: t, s: score(t, q) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || (b.t.featured ? 1 : 0) - (a.t.featured ? 1 : 0) || a.t.name.localeCompare(b.t.name); })
      .map(function (r) { return r.t; });
  }

  // ---------- shared shadow styles ----------
  var BASE_CSS = [
    ":host{all:initial;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;",
    "--bg:#ffffff;--bg2:#f3f4f8;--bd:#e3e5ee;--tx:#121527;--tx2:#4a5068;--tx3:#767c95;--ac:#5b4bf5;--acs:#efedff;--sh:0 24px 60px -12px rgba(18,21,39,.35);",
    "--finance:#059669;--health:#e11d48;--productivity:#2563eb;--dev:#d97706;--design:#c026d3;--security:#0891b2;--life:#7c3aed;color-scheme:light}",
    "@media (prefers-color-scheme:dark){:host(:not([data-theme=light])){--bg:#141724;--bg2:#1b1f2e;--bd:#2a3043;--tx:#eceef6;--tx2:#a9afc4;--tx3:#7b8199;--ac:#8b80ff;--acs:#22264a;--sh:0 30px 70px -10px rgba(0,0,0,.75);",
    "--finance:#34d399;--health:#fb7185;--productivity:#60a5fa;--dev:#fbbf24;--design:#e879f9;--security:#22d3ee;--life:#a78bfa;color-scheme:dark}}",
    ":host([data-theme=dark]){--bg:#141724;--bg2:#1b1f2e;--bd:#2a3043;--tx:#eceef6;--tx2:#a9afc4;--tx3:#7b8199;--ac:#8b80ff;--acs:#22264a;--sh:0 30px 70px -10px rgba(0,0,0,.75);",
    "--finance:#34d399;--health:#fb7185;--productivity:#60a5fa;--dev:#fbbf24;--design:#e879f9;--security:#22d3ee;--life:#a78bfa;color-scheme:dark}",
    "*,*::before,*::after{box-sizing:border-box}a{text-decoration:none;color:inherit}",
    ".i{width:18px;height:18px;flex:none;display:block}",
    ".ti{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:none;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent)}",
    ".ti .i{width:18px;height:18px}",
    "[data-cat=finance]{--c:var(--finance)}[data-cat=health]{--c:var(--health)}[data-cat=productivity]{--c:var(--productivity)}[data-cat=dev]{--c:var(--dev)}",
    "[data-cat=design]{--c:var(--design)}[data-cat=security]{--c:var(--security)}[data-cat=life]{--c:var(--life)}",
    ".kbd{font-size:11px;font-weight:600;color:var(--tx3);border:1px solid var(--bd);border-bottom-width:2px;border-radius:5px;padding:1px 5px;background:var(--bg2)}"
  ].join("");

  function syncTheme(host) {
    function apply() {
      var t = document.documentElement.getAttribute("data-theme");
      if (t === "dark" || t === "light") host.setAttribute("data-theme", t); else host.removeAttribute("data-theme");
    }
    apply();
    if (isHub) new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // ---------- command palette ----------
  var pal = null;
  function buildPalette() {
    var host = document.createElement("dth-palette");
    host.style.cssText = "position:fixed;inset:0;z-index:2147483646;display:none";
    syncTheme(host);
    var root = host.attachShadow({ mode: "open" });
    root.innerHTML = "<style>" + BASE_CSS +
      ".ov{position:fixed;inset:0;background:rgba(10,12,20,.48);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;justify-content:center;align-items:flex-start;padding:12vh 16px 16px}" +
      ".box{width:100%;max-width:620px;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:16px;box-shadow:var(--sh);overflow:hidden;display:flex;flex-direction:column;max-height:72vh;animation:pop .14s ease-out}" +
      "@keyframes pop{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:none}}" +
      ".q{display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid var(--bd)}.q .i{color:var(--tx3);width:20px;height:20px}" +
      "input{flex:1;border:0;outline:0;background:transparent;color:var(--tx);font:inherit;font-size:16px;height:56px;min-width:0}input::placeholder{color:var(--tx3)}" +
      ".list{overflow-y:auto;padding:8px;flex:1;overscroll-behavior:contain}" +
      ".grp{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--tx3);padding:10px 10px 6px}" +
      ".it{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:10px;cursor:pointer;color:var(--tx)}" +
      ".it[aria-selected=true]{background:var(--bg2)}.it .t{flex:1;min-width:0}.it strong{display:block;font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".it small{display:block;font-size:12.5px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".it .go{opacity:0;color:var(--tx3)}.it[aria-selected=true] .go{opacity:1}" +
      ".none{padding:36px 16px;text-align:center;color:var(--tx3);font-size:14px}" +
      ".ft{display:flex;gap:14px;padding:10px 16px;border-top:1px solid var(--bd);font-size:12px;color:var(--tx3);background:var(--bg2)}.ft span{display:flex;gap:6px;align-items:center}" +
      "@media (max-width:560px){.ov{padding-top:10px}.ft{display:none}.box{max-height:82vh}}" +
      "</style>" +
      '<div class="ov" part="overlay"><div class="box" role="dialog" aria-modal="true" aria-label="Search tools">' +
      '<div class="q">' + icon("search") + '<input type="text" placeholder="Search tools…" aria-label="Search tools" role="combobox" aria-expanded="true" aria-controls="dth-list" aria-autocomplete="list" autocomplete="off" spellcheck="false"><span class="kbd">Esc</span></div>' +
      '<div class="list" id="dth-list" role="listbox"></div>' +
      '<div class="ft"><span><span class="kbd">↑</span><span class="kbd">↓</span> navigate</span><span><span class="kbd">↵</span> open</span><span><span class="kbd">Ctrl</span><span class="kbd">↵</span> new tab</span></div>' +
      "</div></div>";
    document.body.appendChild(host);

    var input = root.querySelector("input"), list = root.querySelector(".list"), ov = root.querySelector(".ov");
    var items = [], sel = 0, lastFocus = null;

    function row(t, i) {
      return '<a class="it" role="option" id="o' + i + '" data-i="' + i + '" href="' + base + t.url + '" data-cat="' + t.cat + '">' +
        '<span class="ti">' + icon(t.icon) + '</span><span class="t"><strong>' + esc(t.name) + "</strong><small>" + esc(catName(t.cat)) + " · " + esc(t.desc) + "</small></span>" +
        icon("arrow-right", "i go") + "</a>";
    }
    function render() {
      var q = input.value.trim(), html = "";
      if (!q) {
        var rec = getRecents().map(byId).filter(function (t) { return t && t !== current; }).slice(0, 4);
        var favs = getFavs().map(byId).filter(function (t) { return rec.indexOf(t) === -1; }).slice(0, 4);
        items = [];
        if (rec.length) { html += '<div class="grp">Recent</div>'; rec.forEach(function (t) { html += row(t, items.length); items.push(t); }); }
        if (favs.length) { html += '<div class="grp">Favourites</div>'; favs.forEach(function (t) { html += row(t, items.length); items.push(t); }); }
        var rest = TOOLS.filter(function (t) { return items.indexOf(t) === -1; });
        html += '<div class="grp">All tools</div>'; rest.forEach(function (t) { html += row(t, items.length); items.push(t); });
      } else {
        items = search(q);
        items.forEach(function (t, i) { html += row(t, i); });
        if (!items.length) html = '<div class="none">No tools match “' + esc(q) + "”.</div>";
      }
      list.innerHTML = html; sel = 0; mark();
    }
    function mark() {
      var els = list.querySelectorAll(".it");
      els.forEach(function (el, i) { el.setAttribute("aria-selected", i === sel ? "true" : "false"); });
      if (els[sel]) { els[sel].scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", "o" + sel); }
    }
    function open(q) {
      lastFocus = document.activeElement;
      host.style.display = "block"; input.value = q || ""; render();
      document.documentElement.style.overflow = "hidden";
      setTimeout(function () { input.focus(); }, 0);
    }
    function close() {
      host.style.display = "none"; document.documentElement.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === "Enter" && items[sel]) {
        e.preventDefault();
        var url = base + items[sel].url;
        if (e.ctrlKey || e.metaKey) window.open(url, "_blank"); else location.href = url;
      }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Tab") { e.preventDefault(); }
    });
    list.addEventListener("mousemove", function (e) {
      var it = e.target.closest(".it"); if (it && +it.dataset.i !== sel) { sel = +it.dataset.i; mark(); }
    });
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    return { open: open, close: close, isOpen: function () { return host.style.display !== "none"; } };
  }
  function openPalette(q) { if (!pal) pal = buildPalette(); pal.open(q); }

  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === "k" && !e.shiftKey && !e.altKey) {
      e.preventDefault(); e.stopPropagation();
      if (pal && pal.isOpen()) pal.close(); else openPalette();
    }
  }, true);

  // ---------- toast ----------
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      var h = document.createElement("dth-toast"); h.style.cssText = "position:fixed;left:0;right:0;bottom:24px;z-index:2147483647;pointer-events:none;display:flex;justify-content:center";
      syncTheme(h);
      var r = h.attachShadow({ mode: "open" });
      r.innerHTML = "<style>" + BASE_CSS + ".t{background:var(--tx);color:var(--bg);padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:var(--sh);opacity:0;transform:translateY(12px);transition:.2s}.t.s{opacity:1;transform:none}</style><div class='t' role='status' aria-live='polite'></div>";
      document.body.appendChild(h); toastEl = r.querySelector(".t");
    }
    toastEl.textContent = msg; toastEl.classList.add("s");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove("s"); }, 2200);
  }

  function share() {
    var data = { title: document.title, url: location.href.split("#")[0] };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    copy(data.url, "Link copied to clipboard");
  }
  function copy(text, msg) {
    var done = function () { toast(msg || "Copied"); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("Copy failed"); }
      ta.remove();
    }
  }

  // ---------- dock (tool pages) ----------
  function buildDock() {
    var host = document.createElement("dth-dock");
    host.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:2147483640";
    syncTheme(host);
    var r = host.attachShadow({ mode: "open" });
    var fav = current && isFav(current.id);
    r.innerHTML = "<style>" + BASE_CSS +
      ".d{display:flex;align-items:center;gap:2px;padding:4px;border-radius:14px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--bd);box-shadow:0 10px 30px -10px rgba(0,0,0,.45);color:var(--tx);transition:opacity .25s,transform .25s}" +
      ".d.h{opacity:0;transform:translateY(12px);pointer-events:none}" +
      ".b{display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;border-radius:10px;border:0;background:transparent;color:var(--tx2);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap}" +
      ".b:hover{background:var(--bg2);color:var(--tx)}.b:focus-visible{outline:2px solid var(--ac);outline-offset:1px}" +
      ".home{color:var(--tx)}.m{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:linear-gradient(120deg,#5b4bf5,#9b3cf2 55%,#ec4899);color:#fff}.m .i{width:14px;height:14px}" +
      ".sep{width:1px;height:20px;background:var(--bd);margin:0 2px}.ic{width:36px;padding:0;justify-content:center}" +
      ".on{color:#f59e0b}.on .i{--icon-fill:currentColor}" +
      "@media (max-width:640px){.lbl,.kbd{display:none}.home{padding:0 6px}}@media print{.d{display:none}}" +
      "</style>" +
      '<nav class="d" aria-label="Digital Tools Hub">' +
      '<a class="b home" href="' + base + '" title="All tools"><span class="m">' + icon("layout-grid") + '</span><span class="lbl">All tools</span></a>' +
      '<span class="sep"></span>' +
      '<button class="b srch" type="button" title="Search tools (Ctrl+K)" aria-label="Search tools">' + icon("search") + '<span class="kbd">' + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K") + "</span></button>" +
      (current ? '<button class="b ic fav' + (fav ? " on" : "") + '" type="button" aria-pressed="' + fav + '" title="Favourite" aria-label="Add to favourites">' + icon("star") + "</button>" : "") +
      '<button class="b ic shr" type="button" title="Share" aria-label="Share this tool">' + icon("share-2") + "</button>" +
      "</nav>";
    document.body.appendChild(host);
    watchTone(host);
    r.querySelector(".srch").addEventListener("click", function () { openPalette(); });
    r.querySelector(".shr").addEventListener("click", share);
    var fb = r.querySelector(".fav");
    if (fb) fb.addEventListener("click", function () {
      var on = toggleFav(current.id);
      fb.classList.toggle("on", on); fb.setAttribute("aria-pressed", on);
      toast(on ? "Added to favourites" : "Removed from favourites");
    });
    // Tuck the dock away while scrolling down, show it again on scroll up.
    var d = r.querySelector(".d"), lastY = window.scrollY, ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (Math.abs(y - lastY) > 8) { d.classList.toggle("h", y > lastY && y > 300); lastY = y; }
        ticking = false;
      });
    }, { passive: true });
  }

  // ---------- related tools strip (tool pages) ----------
  function buildRelated() {
    var same = TOOLS.filter(function (t) { return t !== current && t.cat === current.cat; });
    var other = TOOLS.filter(function (t) { return t !== current && t.cat !== current.cat && t.featured; });
    var picks = same.slice(0, 4).concat(other).slice(0, 6);
    var host = document.createElement("dth-related");
    host.style.cssText = "display:block;position:relative;z-index:1;clear:both";
    syncTheme(host);
    var r = host.attachShadow({ mode: "open" });
    var year = new Date().getFullYear();
    r.innerHTML = "<style>" + BASE_CSS +
      ".w{background:var(--bg);color:var(--tx);border-top:1px solid var(--bd);padding:36px 20px 88px;line-height:1.5}" +
      ".c{max-width:1200px;margin:0 auto}h2{font-size:18px;font-weight:700;margin:0 0 4px;letter-spacing:-.01em}.s{color:var(--tx3);font-size:14px;margin:0 0 18px}" +
      ".g{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}" +
      ".k{display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:14px;border:1px solid var(--bd);background:var(--bg2);transition:border-color .2s,transform .2s,box-shadow .2s}" +
      ".k:hover{border-color:color-mix(in srgb,var(--c) 50%,var(--bd));transform:translateY(-2px);box-shadow:0 12px 28px -16px color-mix(in srgb,var(--c) 70%,transparent)}.k strong{display:block;font-size:14.5px;font-weight:650}" +
      ".k small{display:block;font-size:12.5px;color:var(--tx3);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}" +
      ".f{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between;align-items:center;margin-top:28px;padding-top:18px;border-top:1px solid var(--bd);font-size:13px;color:var(--tx3)}" +
      ".f nav{display:flex;flex-wrap:wrap;gap:6px 18px}.f a:hover{color:var(--tx)}.all{color:var(--ac);font-weight:650}" +
      "@media print{.w{display:none}}</style>" +
      '<section class="w" aria-label="More free tools"><div class="c">' +
      "<h2>More free tools</h2><p class='s'>Private, fast and free. Everything runs in your browser.</p><div class='g'>" +
      picks.map(function (t) {
        return '<a class="k" href="' + base + t.url + '" data-cat="' + t.cat + '"><span class="ti">' + icon(t.icon) + "</span><span><strong>" + esc(t.name) + "</strong><small>" + esc(t.desc) + "</small></span></a>";
      }).join("") +
      "</div>" +
      '<div class="f"><nav><a class="all" href="' + base + '">Browse all ' + TOOLS.length + ' tools →</a>' +
      (catSlug(current.cat) ? '<a href="' + base + catSlug(current.cat) + '">More ' + esc(catName(current.cat).toLowerCase()) + " tools</a>" : "") + '<a href="' + base + 'about.html">About</a><a href="' + base + 'privacy.html">Privacy</a><a href="' + base + 'terms.html">Terms</a><a href="' + base + 'contact.html">Contact</a></nav>' +
      "<span>© " + year + " Digital Tools Hub</span></div></div></section>";
    document.body.appendChild(host);
    fitToBody(host);
    watchTone(host);
  }

  // Tool pages use all kinds of body layouts (row flex, grid, centred cards).
  // Make appended full-width blocks start on their own row instead of
  // squeezing in beside the tool.
  function fitToBody(el) {
    var cs = getComputedStyle(document.body);
    if (/flex/.test(cs.display)) {
      if (!/column/.test(cs.flexDirection)) document.body.style.flexWrap = "wrap";
      el.style.flex = "0 0 100%";
      el.style.alignSelf = "stretch";
      el.style.boxSizing = "border-box";
    } else if (/grid/.test(cs.display)) {
      el.style.gridColumn = "1 / -1";
    }
  }

  // Light or dark? Tool pages have their own (often toggleable) themes, so
  // read the page's actual background rather than the OS preference.
  function parseRGB(str) {
    var m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/.exec(str || "");
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] } : null;
  }
  function pageTone() {
    var els = [document.body, document.documentElement];
    for (var i = 0; i < els.length; i++) {
      var cs = getComputedStyle(els[i]);
      var c = parseRGB(cs.backgroundColor);
      if (!c || c.a < 0.5) c = parseRGB(cs.backgroundImage); // first gradient stop
      if (c && c.a >= 0.5) return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255 < 0.5 ? "dark" : "light";
    }
    return null;
  }
  var toned = [];
  function applyTone() {
    var t = pageTone();
    toned.forEach(function (el) {
      var attr = el.classList && el.classList.contains("dth-guide") ? "data-tone" : "data-theme";
      if (t) el.setAttribute(attr, t); else el.removeAttribute(attr);
    });
  }
  function watchTone(el) {
    toned.push(el); applyTone();
    if (toned.length === 1) {
      var mo = new MutationObserver(function () { setTimeout(applyTone, 350); });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    }
  }

  function boot() {
    document.querySelectorAll(".dth-guide").forEach(function (g) {
      // The guide keeps its own max-width, so give it a full-width row to sit in.
      if (g.parentNode === document.body && /flex|grid/.test(getComputedStyle(document.body).display)) {
        var row = document.createElement("div");
        row.style.width = "100%";
        g.parentNode.insertBefore(row, g); row.appendChild(g); fitToBody(row);
      }
      if (!isHub) watchTone(g);
    });
    var dockOff = script && script.getAttribute("data-dock") === "off";
    var relOff = script && script.getAttribute("data-related") === "off";
    if (!isHub && !dockOff) buildDock();
    if (!isHub && current && !relOff) buildRelated();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  // ---------- service worker (offline support) ----------
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register(base + "sw.js").catch(function () {}); });
  }

  window.DTH = {
    __shell: true, tools: TOOLS, categories: CATS, current: current, icons: ICONS, base: base,
    openPalette: openPalette, search: search, catName: catName, byId: byId,
    getFavs: getFavs, isFav: isFav, toggleFav: toggleFav, getRecents: getRecents, clearRecents: clearRecents,
    visits: function () { return read("dth:visits", {}); },
    onChange: function (fn) { listeners.push(fn); },
    toast: toast, copy: copy, share: share, icon: icon, esc: esc
  };
})();
