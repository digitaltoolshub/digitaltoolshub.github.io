/*
 * Shared exchange-rate helper for the currency-aware tools.
 *
 *   DTH_FX.ready.then(fx => fx.convert(100, "USD", "EUR"))
 *   DTH_FX.rates      // { USD: 1, EUR: 0.92, ... } (units per 1 USD)
 *   DTH_FX.source     // "live" | "cached" | "fallback"
 *   DTH_FX.updated    // Date of the rate table, or null for built-in fallback
 *
 * Starts from built-in approximate rates so conversion always works offline,
 * then upgrades to live mid-market rates (cached for 6 hours in localStorage).
 */
(function () {
  "use strict";
  var KEY = "dth:fx:v1", TTL = 6 * 3600 * 1000;
  var FALLBACK = {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150, AED: 3.6725, AFN: 70, ALL: 93, AMD: 390, ANG: 1.79, AOA: 900, ARS: 950, AUD: 1.52,
    AWG: 1.79, AZN: 1.7, BAM: 1.8, BBD: 2, BDT: 120, BGN: 1.8, BHD: 0.376, BIF: 2900, BMD: 1, BND: 1.34, BOB: 6.9, BRL: 5.5,
    BSD: 1, BTN: 84, BWP: 13.5, BYN: 3.3, BZD: 2, CAD: 1.38, CDF: 2800, CHF: 0.88, CLP: 950, CNY: 7.2, COP: 4100, CRC: 520,
    CUP: 24, CVE: 101, CZK: 23, DJF: 177.7, DKK: 6.9, DOP: 60, DZD: 134, EGP: 49, ERN: 15, ETB: 120, FJD: 2.25, FKP: 0.79,
    GEL: 2.7, GHS: 16, GIP: 0.79, GMD: 70, GNF: 8600, GTQ: 7.7, GYD: 209, HKD: 7.8, HNL: 25, HRK: 6.9, HTG: 131, HUF: 360,
    IDR: 15800, ILS: 3.7, INR: 84, IQD: 1310, IRR: 42000, ISK: 138, JMD: 157, JOD: 0.709, KES: 129, KGS: 85, KHR: 4100, KMF: 450,
    KPW: 900, KRW: 1350, KWD: 0.306, KYD: 0.83, KZT: 480, LAK: 22000, LBP: 89500, LKR: 295, LRD: 192, LSL: 18, LYD: 4.8,
    MAD: 9.8, MDL: 17.8, MGA: 4500, MKD: 56.5, MMK: 2100, MNT: 3400, MOP: 8, MRU: 40, MUR: 46, MVR: 15.4, MWK: 1730, MXN: 19.5,
    MYR: 4.4, MZN: 64, NAD: 18, NGN: 1550, NIO: 36.8, NOK: 10.8, NPR: 134, NZD: 1.65, OMR: 0.385, PAB: 1, PEN: 3.75, PGK: 3.9,
    PHP: 57, PKR: 278, PLN: 4, PYG: 7800, QAR: 3.64, RON: 4.6, RSD: 108, RUB: 92, RWF: 1360, SAR: 3.75, SBD: 8.4, SCR: 13.5,
    SDG: 600, SEK: 10.5, SGD: 1.34, SHP: 0.79, SLL: 22500, SOS: 571, SRD: 31, SSP: 1300, STN: 22.5, SYP: 13000, SZL: 18, THB: 35,
    TJS: 10.7, TMT: 3.5, TND: 3.1, TOP: 2.35, TRY: 34, TTD: 6.8, TVD: 1.52, TWD: 32, TZS: 2700, UAH: 41, UGX: 3700, UYU: 41,
    UZS: 12700, VES: 36, VND: 25000, VUV: 119, WST: 2.7, XAF: 603, XCD: 2.7, XOF: 603, XPF: 110, YER: 250, ZAR: 18, ZMW: 26,
    ZWL: 322
  };
  var fx = { rates: Object.assign({}, FALLBACK), source: "fallback", updated: null, base: "USD" };

  function adopt(rates, when, source) {
    if (!rates || !(rates.USD > 0.99 && rates.USD < 1.01)) return false;
    var merged = Object.assign({}, FALLBACK);
    for (var k in rates) if (typeof rates[k] === "number" && rates[k] > 0) merged[k] = rates[k];
    fx.rates = merged; fx.updated = new Date(when); fx.source = source;
    return true;
  }

  fx.has = function (c) { return fx.rates[c] > 0; };
  /** Converts an amount between two currency codes via USD. Returns NaN for unknown codes. */
  fx.convert = function (amount, from, to) {
    var a = fx.rates[from], b = fx.rates[to];
    return a > 0 && b > 0 ? (amount / a) * b : NaN;
  };
  /** Formats a money amount with the right symbol/decimals; falls back to "CODE 1,234.00". */
  fx.format = function (amount, code, opts) {
    try {
      return new Intl.NumberFormat(undefined, Object.assign({ style: "currency", currency: code }, opts || {})).format(amount);
    } catch (e) {
      return code + " " + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };
  fx.sourceLabel = function () {
    if (fx.source === "fallback") return "Approximate built-in rates (offline)";
    return (fx.source === "cached" ? "Cached rates from " : "Live rates from ") + fx.updated.toLocaleString();
  };
  fx.listeners = [];
  fx.onUpdate = function (fn) { fx.listeners.push(fn); };

  function fetchJson(url) {
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var t = ctl && setTimeout(function () { ctl.abort(); }, 8000);
    return fetch(url, ctl ? { signal: ctl.signal } : undefined).then(function (r) {
      if (t) clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  /** Re-fetches live rates (ignoring the cache). Resolves true when live rates were loaded. */
  fx.refresh = function () {
    return fetchJson("https://open.er-api.com/v6/latest/USD")
      .then(function (d) { return d && d.rates ? d.rates : Promise.reject(new Error("bad payload")); })
      .catch(function () {
        return fetchJson("https://api.exchangerate-api.com/v4/latest/USD").then(function (d) { return d.rates; });
      })
      .then(function (rates) {
        if (!adopt(rates, Date.now(), "live")) return false;
        try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), r: rates })); } catch (e) {}
        fx.listeners.forEach(function (fn) { try { fn(fx); } catch (e) {} });
        return true;
      })
      .catch(function () { return false; });
  };

  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  var fresh = false;
  if (cached && cached.r && adopt(cached.r, cached.t, "cached")) fresh = Date.now() - cached.t < TTL;
  fx.ready = (fresh ? Promise.resolve(true) : fx.refresh()).then(function () { return fx; });
  window.DTH_FX = fx;
})();
