/* Digital Tools Hub — hub page behaviour: theme toggle, header search, homepage directory. */
(function () {
  "use strict";
  var DTH = window.DTH;
  var root = document.documentElement;

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

  // ---------- header search button ----------
  document.querySelectorAll("[data-open-palette]").forEach(function (b) {
    b.addEventListener("click", function () { DTH.openPalette(); });
  });
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  document.querySelectorAll("[data-mod-key]").forEach(function (k) { k.textContent = isMac ? "⌘K" : "Ctrl K"; });

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

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat !== "all") p.set("cat", state.cat);
    var s = p.toString();
    history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
  }

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
    var personal = document.getElementById("personal");
    if (personal) personal.hidden = !!(state.q || state.cat !== "all") || !hasPersonal;
  }

  if (q) {
    q.addEventListener("input", function () { state.q = q.value.trim(); apply(); syncUrl(); });
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
  function syncFavButtons() {
    cards.forEach(function (c) {
      var b = c.querySelector(".fav-btn"); if (!b) return;
      var on = DTH.isFav(c.dataset.id);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", (on ? "Remove " : "Add ") + c.dataset.name + (on ? " from favourites" : " to favourites"));
    });
  }
  grid.addEventListener("click", function (e) {
    var b = e.target.closest(".fav-btn"); if (!b) return;
    e.preventDefault();
    var id = b.closest(".card").dataset.id;
    var on = DTH.toggleFav(id);
    DTH.toast(on ? "Added to favourites" : "Removed from favourites");
  });

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
    syncFavButtons();
  }
  var clearRecent = document.getElementById("clear-recent");
  if (clearRecent) clearRecent.addEventListener("click", function () { DTH.clearRecents(); });

  DTH.onChange(function () { renderPersonal(); apply(); });
  renderPersonal();
  apply();
})();
