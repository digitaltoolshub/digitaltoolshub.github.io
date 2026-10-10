/* Digital Tools Hub — hub page behaviour: theme, header, menus, motion, homepage directory. */
(function () {
  "use strict";
  var DTH = window.DTH;
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  // ---------- theme (system → light → dark) ----------
  var THEMES = ["system", "light", "dark"];
  function getTheme() { try { return localStorage.getItem("dth:theme") || "system"; } catch (e) { return "system"; } }
  function applyTheme(t) {
    if (t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      var label = { system: "Theme: system", light: "Theme: light", dark: "Theme: dark" }[t];
      b.setAttribute("aria-label", label + " (click to change)"); b.title = label;
      var use = b.querySelector("use");
      if (use) use.setAttribute("href", DTH.icons + "#" + { system: "monitor", light: "sun", dark: "moon" }[t]);
    });
  }
  applyTheme(getTheme());
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-theme-toggle]");
    if (!b) return;
    var next = THEMES[(THEMES.indexOf(getTheme()) + 1) % THEMES.length];
    try { localStorage.setItem("dth:theme", next); } catch (err) {}
    applyTheme(next);
  });

  // ---------- header: search, mobile menu, scroll state ----------
  document.querySelectorAll("[data-open-palette]").forEach(function (b) {
    b.addEventListener("click", function () { DTH.openPalette(); });
  });
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  document.querySelectorAll("[data-mod-key]").forEach(function (k) { k.textContent = isMac ? "⌘K" : "Ctrl K"; });

  var menuBtn = document.querySelector("[data-menu-toggle]");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    root.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    var use = menuBtn.querySelector("use");
    if (use) use.setAttribute("href", DTH.icons + "#" + (open ? "x" : "menu"));
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("menu-open")) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) setMenu(false); });
  }

  var headerEl = document.querySelector(".site-header");
  var toTop = document.querySelector(".to-top");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (headerEl) headerEl.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 900);
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  // ---------- motion: reveal on scroll, card spotlight, count-up ----------
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add("in"); });

  if (window.matchMedia && matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".card");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  document.querySelectorAll("[data-countup]").forEach(function (el) {
    var end = parseInt(el.textContent, 10);
    if (!end || reduceMotion || !("IntersectionObserver" in window)) return;
    el.textContent = "0";
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now(), dur = 1100;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
    o.observe(el);
  });

  // ---------- share, install, surprise ----------
  document.querySelectorAll("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var data = { title: "Digital Tools Hub: free online tools", url: location.origin + location.pathname.replace(/[^/]*$/, "") };
      if (navigator.share) navigator.share(data).catch(function () {}); else DTH.copy(data.url, "Link copied to clipboard");
    });
  });

  var installBtn = document.getElementById("install-btn"), deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn) installBtn.addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function (c) {
      if (c.outcome === "accepted") { DTH.toast("Installed. Enjoy!"); installBtn.hidden = true; }
      deferred = null;
    });
  });

  var surprise = document.getElementById("surprise");
  if (surprise) surprise.addEventListener("click", function () {
    var pool = DTH.tools.filter(function (t) { return !DTH.current || t.id !== DTH.current.id; });
    var t = pool[Math.floor(Math.random() * pool.length)];
    DTH.toast("Opening " + t.name + "…");
    setTimeout(function () { location.href = t.url; }, 450);
  });

  // ---------- favourites on any card ----------
  var allCards = Array.prototype.slice.call(document.querySelectorAll(".card[data-id]"));
  function syncFavButtons() {
    allCards.forEach(function (c) {
      var b = c.querySelector(".fav-btn"); if (!b) return;
      var on = DTH.isFav(c.dataset.id);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", (on ? "Remove " : "Add ") + c.dataset.name + (on ? " from favourites" : " to favourites"));
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".card .fav-btn"); if (!b) return;
    e.preventDefault();
    var on = DTH.toggleFav(b.closest(".card").dataset.id);
    DTH.toast(on ? "Added to favourites" : "Removed from favourites");
  });
  DTH.onChange(syncFavButtons);
  syncFavButtons();

  // ---------- homepage directory ----------
  var grid = document.getElementById("tool-grid");
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".card[data-id]"));
  var order = cards.slice();
  var q = document.getElementById("tool-search");
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var sortSel = document.getElementById("tool-sort");
  var countEl = document.getElementById("result-count");
  var empty = document.getElementById("empty-state");
  var state = { q: "", cat: "all", sort: "featured" };

  var params = new URLSearchParams(location.search);
  state.q = params.get("q") || "";
  state.cat = params.get("cat") || "all";
  if (!chips.some(function (c) { return c.dataset.filter === state.cat; })) state.cat = "all";
  try { state.sort = localStorage.getItem("dth:sort") || "featured"; } catch (e) {}
  if (q) q.value = state.q;
  if (sortSel) sortSel.value = state.sort;
  // Deep links (?q=…, ?cat=…) land on the results rather than the hero.
  if ((state.q || state.cat !== "all") && !location.hash) {
    var target = document.getElementById("tools");
    if (target) setTimeout(function () { target.scrollIntoView(); }, 0);
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat !== "all") p.set("cat", state.cat);
    var s = p.toString();
    history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
  }

  var lastTracked = "";
  function apply() {
    var ranked = state.q ? DTH.search(state.q).map(function (t) { return t.id; }) : null;
    var visits = DTH.visits();
    var list = order.filter(function (c) {
      if (state.cat !== "all" && c.dataset.cat !== state.cat) return false;
      if (ranked && ranked.indexOf(c.dataset.id) === -1) return false;
      return true;
    });
    if (ranked) list.sort(function (a, b) { return ranked.indexOf(a.dataset.id) - ranked.indexOf(b.dataset.id); });
    else if (state.sort === "az") list.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name); });
    else if (state.sort === "used") list.sort(function (a, b) { return (visits[b.dataset.id] || 0) - (visits[a.dataset.id] || 0); });
    else if (state.sort === "new") list.sort(function (a, b) { return (b.dataset.new ? 1 : 0) - (a.dataset.new ? 1 : 0); });

    cards.forEach(function (c) { c.hidden = true; });
    list.forEach(function (c) { c.hidden = false; grid.appendChild(c); });
    chips.forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.filter === state.cat ? "true" : "false"); });
    if (countEl) countEl.textContent = list.length === cards.length ? cards.length + " tools" : list.length + " of " + cards.length + " tools";
    if (empty) {
      empty.hidden = list.length > 0;
      var t = empty.querySelector("[data-empty-term]"); if (t) t.textContent = state.q;
    }
    var filtering = !!(state.q || state.cat !== "all");
    var personal = document.getElementById("personal");
    if (personal) personal.hidden = filtering || !hasPersonal;
    // Hide the curated sections while filtering so results stay in view.
    ["popular", "new"].forEach(function (id) { var s = document.getElementById(id); if (s) s.hidden = filtering; });
    // Track searches that find nothing (helps decide which tools to build next).
    if (state.q && !list.length && state.q !== lastTracked && typeof window.gtag === "function") {
      lastTracked = state.q;
      window.gtag("event", "search_no_results", { search_term: state.q.slice(0, 60) });
    }
  }

  var searchTimer;
  if (q) {
    q.addEventListener("input", function () {
      state.q = q.value.trim(); apply(); syncUrl();
      clearTimeout(searchTimer);
      if (state.q && typeof window.gtag === "function") searchTimer = setTimeout(function () { window.gtag("event", "search", { search_term: state.q.slice(0, 60) }); }, 1200);
    });
    q.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { q.value = ""; state.q = ""; apply(); syncUrl(); }
      if (e.key === "Enter") {
        // Enter opens the top match.
        var top = grid.querySelector(".card:not([hidden]) h3 a");
        if (top && state.q) location.href = top.href;
      }
    });
  }
  chips.forEach(function (c) {
    c.addEventListener("click", function () { state.cat = c.dataset.filter; apply(); syncUrl(); });
  });
  if (sortSel) sortSel.addEventListener("change", function () {
    state.sort = sortSel.value;
    try { localStorage.setItem("dth:sort", state.sort); } catch (e) {}
    apply();
  });
  var clear = document.getElementById("clear-filters");
  if (clear) clear.addEventListener("click", function () {
    state.q = ""; state.cat = "all"; if (q) q.value = ""; apply(); syncUrl(); if (q) q.focus();
  });

  // "/" focuses the search box (when not typing elsewhere).
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault(); q && q.focus();
  });

  // ---------- favourites & recents ----------
  var hasPersonal = false;
  function mini(t) {
    return '<a class="mini" href="' + t.url + '" data-cat="' + t.cat + '"><span class="tool-icon">' + DTH.icon(t.icon, "icon") + "</span><span><strong>" +
      DTH.esc(t.name) + "</strong><span>" + DTH.esc(DTH.catName(t.cat)) + "</span></span></a>";
  }
  function renderPersonal() {
    var favs = DTH.getFavs().map(DTH.byId);
    var recent = DTH.getRecents().map(DTH.byId).slice(0, 4);
    var favWrap = document.getElementById("fav-section"), recWrap = document.getElementById("recent-section");
    if (favWrap) { favWrap.hidden = !favs.length; favWrap.querySelector(".grid").innerHTML = favs.map(mini).join(""); }
    if (recWrap) { recWrap.hidden = !recent.length; recWrap.querySelector(".grid").innerHTML = recent.map(mini).join(""); }
    hasPersonal = favs.length > 0 || recent.length > 0;
  }
  var clearRecent = document.getElementById("clear-recent");
  if (clearRecent) clearRecent.addEventListener("click", function () { DTH.clearRecents(); });

  DTH.onChange(function () { renderPersonal(); apply(); });
  renderPersonal();
  apply();
})();
