/* ============================================================
   theme.js — candidate palettes, live application, and the
   measurements that decide whether a palette is usable.

   Loaded by every page: if the theme lab has saved an override it
   is applied before first paint, so a chosen theme survives while
   browsing. Without an override this file does nothing visible.

   Nothing here ships to React. It exists so a human can pick a
   palette by looking at the real UI instead of a swatch sheet.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'gv.theme.override';

  /* Ordered roughly light-to-heavy ground, so the effect of the
     background is easy to step through. */
  var PRESETS = [
    { name: 'Grey ground', note: 'current — cards float',
      vars: { bg:'#eef0ef', surface:'#ffffff', 'surface-sunk':'#e4e8e6',
              line:'#dadedc', ink:'#17160f', soft:'#56544c', muted:'#6c6a62',
              accent:'#2f6f4f', 'accent-soft':'#e6f1ea' } },

    { name: 'Near-white', note: 'flatter, very light',
      vars: { bg:'#fafaf9', surface:'#ffffff', 'surface-sunk':'#f1f1ef',
              line:'#e4e4e0', ink:'#17160f', soft:'#56544c', muted:'#6c6a62',
              accent:'#2f6f4f', 'accent-soft':'#e6f1ea' } },

    { name: 'Warm paper', note: 'the original cream',
      vars: { bg:'#f7f5f0', surface:'#ffffff', 'surface-sunk':'#f2efe8',
              line:'#e2dcd0', ink:'#17150f', soft:'#5c554a', muted:'#6e675b',
              accent:'#2f6f4f', 'accent-soft':'#e4f0e9' } },

    { name: 'Warm, deeper', note: 'cream ground, real lift',
      vars: { bg:'#efe9de', surface:'#fffdf9', 'surface-sunk':'#e5ddcd',
              line:'#ddd3c0', ink:'#1e1a12', soft:'#5c5449', muted:'#6f665a',
              accent:'#2f6f4f', 'accent-soft':'#e4f0e9' } },

    { name: 'Cool grey', note: 'slate ground, green accent',
      vars: { bg:'#eceff1', surface:'#ffffff', 'surface-sunk':'#e0e5e8',
              line:'#d5dbdf', ink:'#141a1d', soft:'#4c565c', muted:'#626d74',
              accent:'#2f6f4f', 'accent-soft':'#e2f0e8' } },

    { name: 'Green tint', note: 'the accent, very dilute',
      vars: { bg:'#eaf0ec', surface:'#ffffff', 'surface-sunk':'#dde7e1',
              line:'#d2ded7', ink:'#141a16', soft:'#4d5851', muted:'#616d66',
              accent:'#2f6f4f', 'accent-soft':'#dcece3' } },

    { name: 'Ink & blue', note: 'cool accent, neutral ground',
      vars: { bg:'#eef0f2', surface:'#ffffff', 'surface-sunk':'#e3e7ea',
              line:'#d8dde1', ink:'#12141a', soft:'#4a515c', muted:'#5f6875',
              accent:'#1d4ed8', 'accent-soft':'#e4ebfd' } },

    { name: 'Clay', note: 'terracotta accent, sand ground',
      vars: { bg:'#f0e9df', surface:'#fffdf9', 'surface-sunk':'#e6ddce',
              line:'#ded3c1', ink:'#241a12', soft:'#5f5346', muted:'#6f6355',
              accent:'#a8460f', 'accent-soft':'#f7e4d7' } },

    { name: 'High contrast', note: 'strongest separation',
      vars: { bg:'#e8ebea', surface:'#ffffff', 'surface-sunk':'#d9dedd',
              line:'#c6cdcb', ink:'#0d0f0e', soft:'#414947', muted:'#59615f',
              accent:'#1f5c3d', 'accent-soft':'#dcebe3' } }
  ];

  function lum(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var v = [0, 2, 4].map(function (i) {
      var c = parseInt(h.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2];
  }
  function contrast(a, b) {
    var la = lum(a), lb = lum(b), hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }
  function cast(hex) {
    var h = hex.replace('#', '');
    return parseInt(h.substr(0,2),16) - parseInt(h.substr(4,2),16);
  }

  /* The three numbers that decide whether a palette works:
     is the ground neutral, do raised things lift, do sunk things sink. */
  function audit(v) {
    return {
      cast: cast(v.bg),
      raised: contrast(v.surface, v.bg),
      sunk: contrast(v['surface-sunk'], v.bg),
      text: ['ink', 'soft', 'muted', 'accent'].map(function (k) {
        return { token: k, ratio: contrast(v[k], v.bg) };
      })
    };
  }

  function apply(v) {
    var r = document.documentElement;
    Object.keys(v).forEach(function (k) { r.style.setProperty('--' + k, v[k]); });
    /* keep the derived pair sensible so buttons stay readable */
    r.style.setProperty('--accent-hover', shade(v.accent, -0.14));
    r.style.setProperty('--line-strong', shade(v.line, -0.16));
  }

  function shade(hex, amt) {
    var h = hex.replace('#', '');
    var out = '#';
    for (var i = 0; i < 3; i++) {
      var c = parseInt(h.substr(i*2, 2), 16);
      c = Math.max(0, Math.min(255, Math.round(c + 255 * amt)));
      out += ('0' + c.toString(16)).slice(-2);
    }
    return out;
  }

  function toCss(v) {
    return ':root {\n' + Object.keys(v).map(function (k) {
      return '  --' + k + ': ' + v[k] + ';';
    }).join('\n') + '\n}';
  }

  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  var saved = load();
  if (saved) apply(saved);

  window.GV_Theme = { PRESETS: PRESETS, apply: apply, audit: audit,
                      toCss: toCss, save: save, clear: clear, load: load,
                      contrast: contrast, cast: cast };
})();
