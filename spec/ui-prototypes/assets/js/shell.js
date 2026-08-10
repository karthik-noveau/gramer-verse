/* ============================================================
   shell.js — injects the app shell (header, sidebar, footer,
   mobile nav) into every page, and wires the UI-only behaviour
   the protocol allows: drawer, dropdown, tabs, dialog, drawer
   panel, toast, theme toggle, sidebar collapse.

   UI interactions only. No business logic, no data, no routing.
   In React this becomes engine 04 (app shell) + engine 03
   (the components it opens and closes).
   ============================================================ */
(function () {
  'use strict';

  /* Pages live one level down; index.html lives at the root. */
  var ROOT = /\/pages\//.test(location.pathname) ? '../' : './';
  var body = document.body;
  var PAGE = body.dataset.page || '';

  /* The ten topics come from content.js — one source of truth for the whole
     prototype, so the nav can never drift from the curriculum. */
  var TOPICS = (window.GV_CONTENT && window.GV_CONTENT.topics) || [];
  window.GV_TOPICS = TOPICS;

  function href(p) { return ROOT + p; }
  function cur(key) { return PAGE === key ? ' aria-current="page"' : ''; }

  /* One logo for the whole app — see assets/js/logo.js. Bilingual: the Latin
     name with the Tamil pronunciation beneath it. */
  var LOCKUP = GV_Logo.lockup({ size: 26, taSize: 9 });

  /* ---- header --------------------------------------------- */
  function header() {
    return '' +
    '<header class="header">' +
      '<button class="btn btn--icon btn--ghost" id="drawerBtn" aria-label="Open navigation" ' +
              'aria-expanded="false" style="display:none">☰</button>' +
      '<a class="brand" href="' + href('index.html') + '">' + LOCKUP + '</a>' +
      '<button class="btn btn--icon btn--ghost" id="collapseBtn" ' +
              'aria-label="Collapse sidebar" title="Collapse sidebar">⇤</button>' +
      '<div class="spacer"></div>' +
      '<nav class="top" aria-label="Primary">' +
        '<a href="' + href('pages/topics.html') + '"' + cur('topics') + '>Topics</a>' +
        '<a href="' + href('pages/reference.html') + '"' + cur('reference') + '>Reference</a>' +
      '</nav>' +
      /* No notification bell and no account menu. There is nothing to notify
         about — content ships with the app, not to it — and there is no
         account. The theme toggle is a plain button, so the header has no
         menus of its own. */
      '<button class="btn btn--icon btn--ghost" id="themeBtn" aria-label="Switch theme" title="Switch theme">◐</button>' +
    '</header>';
  }

  /* ---- sidebar -------------------------------------------- */
  function sidebar() {
    var topicId = body.dataset.topic || '';
    var items = TOPICS.map(function (t) {
      var active = (PAGE === 'topic' || PAGE === 'lesson') && topicId === t.id;
      return '<li><a href="' + href('pages/topic.html') + '?topic=' + t.id + '"' +
        (active ? ' aria-current="page"' : '') + '>' +
        '<span class="num">' + t.n + '</span>' +
        '<span class="label">' + t.en + '</span>' +
        '</a></li>';
    }).join('');

    return '' +
    '<aside class="sidebar" id="sidebar" aria-label="Topics">' +
      '<h4>Topics</h4><ul>' + items + '</ul>' +
      '<h4>Tools</h4><ul>' +
        '<li><a href="' + href('pages/reference.html') + '"' + cur('reference') + '>' +
          '<span class="num">☰</span><span class="label">Reference</span></a></li>' +
      '</ul>' +

    '</aside>';
  }

  /* ---- footer + mobile nav -------------------------------- */
  function footer() {
    return '' +
    '<footer class="footer">' +
      '<span>Grammer-Verse — UI prototype. Static HTML/CSS/JS, no build step.</span>' +
      '<span class="spacer"></span>' +
      '<a href="' + href('pages/components.html') + '">Components</a>' +
      '<a href="' + href('pages/404.html') + '">404</a>' +
      '<a href="' + href('README.md') + '">README</a>' +
    '</footer>';
  }

  function mobileNav() {
    return '' +
    '<nav class="mobile-nav" aria-label="Mobile">' +
      '<a href="' + href('index.html') + '"' + cur('home') + '><span aria-hidden="true">⌂</span>Home</a>' +
      '<a href="' + href('pages/topics.html') + '"' + cur('topics') + '><span aria-hidden="true">▤</span>Topics</a>' +
      '<a href="' + href('pages/reference.html') + '"' + cur('reference') + '><span aria-hidden="true">☰</span>Reference</a>' +
    '</nav>';
  }

  /* ---- reset dialog + toast host -------------------------- */
  function extras() {
    return '' +
    '<div class="scrim" id="drawerScrim"></div>' +
    '<div class="toasts" id="toasts" aria-live="polite"></div>';
  }

  /* ---- mount ---------------------------------------------- */
  var mount = document.getElementById('shell');
  if (mount) {
    mount.outerHTML = header() + sidebar() + mobileNav() + extras();
    document.querySelector('.shell').insertAdjacentHTML('beforeend', footer());
  }

  /* ---- behaviour ------------------------------------------ */
  var shell = document.querySelector('.shell');

  function setDrawer(open) {
    shell.dataset.drawer = open ? 'open' : 'closed';
    var b = document.getElementById('drawerBtn');
    if (b) b.setAttribute('aria-expanded', String(open));
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;

    /* drawer (mobile sidebar) */
    if (t.closest('#drawerBtn')) { setDrawer(shell.dataset.drawer !== 'open'); return; }
    if (t.closest('#drawerScrim')) { setDrawer(false); return; }

    /* sidebar collapse (desktop) */
    if (t.closest('#collapseBtn')) {
      shell.dataset.sidebar = shell.dataset.sidebar === 'collapsed' ? 'expanded' : 'collapsed';
      return;
    }

    /* theme — light is the default; dark is an explicit opt-in */
    if (t.closest('#themeBtn')) {
      var root = document.documentElement;
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      return;
    }

    /* dropdown menus */
    var trigger = t.closest('[data-menu]');
    document.querySelectorAll('.menu').forEach(function (m) {
      var own = trigger && m.id === trigger.dataset.menu;
      if (!own && !t.closest('.menu')) {
        m.hidden = true;
        var tb = document.querySelector('[data-menu="' + m.id + '"]');
        if (tb) tb.setAttribute('aria-expanded', 'false');
      }
    });
    if (trigger) {
      var menu = document.getElementById(trigger.dataset.menu);
      if (menu) {
        menu.hidden = !menu.hidden;
        trigger.setAttribute('aria-expanded', String(!menu.hidden));
      }
      return;
    }

    /* dialogs */
    var dlgOpen = t.closest('[data-dialog]');
    if (dlgOpen) { var d = document.getElementById(dlgOpen.dataset.dialog); if (d) d.hidden = false; return; }
    if (t.closest('[data-close-dialog]')) {
      var scrim = t.closest('.dialog-scrim');
      if (scrim) scrim.hidden = true;
    }

    /* side drawer panels */
    var drawerOpen = t.closest('[data-drawer-open]');
    if (drawerOpen) {
      var dr = document.getElementById(drawerOpen.dataset.drawerOpen);
      if (dr) dr.dataset.open = 'true';
      return;
    }
    if (t.closest('[data-drawer-close]')) {
      var dc = t.closest('.drawer');
      if (dc) dc.dataset.open = 'false';
    }

    /* toasts */
    var toastBtn = t.closest('[data-toast]');
    if (toastBtn) toast(toastBtn.dataset.toast);

    /* tabs */
    var tab = t.closest('.tabs button');
    if (tab) {
      var group = tab.closest('.tabs');
      group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', String(b === tab)); });
      var host = group.parentElement;
      host.querySelectorAll('.tabpanel').forEach(function (p) { p.hidden = p.id !== tab.dataset.tab; });
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    setDrawer(false);
    document.querySelectorAll('.menu').forEach(function (m) { m.hidden = true; });
    document.querySelectorAll('.dialog-scrim').forEach(function (d) { d.hidden = true; });
    document.querySelectorAll('.drawer').forEach(function (d) { d.dataset.open = 'false'; });
  });

  function toast(msg) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<div><div class="t-title">' + msg + '</div>' +
      '<div class="t-body">Saved on this device.</div></div>';
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }
  window.GV_toast = toast;

  /* show the hamburger only where the drawer applies */
  function syncViewport() {
    var b = document.getElementById('drawerBtn');
    var c = document.getElementById('collapseBtn');
    var narrow = matchMedia('(max-width: 900px)').matches;
    if (b) b.style.display = narrow ? '' : 'none';
    if (c) c.style.display = narrow ? 'none' : '';
    if (!narrow) setDrawer(false);
  }
  syncViewport();
  addEventListener('resize', syncViewport);

  /* breadcrumbs, declared per page as data-crumbs="Label|href,Label|" */
  var crumbHost = document.querySelector('[data-crumbs]');
  if (crumbHost) {
    var parts = crumbHost.dataset.crumbs.split(',').filter(Boolean);
    crumbHost.innerHTML = parts.map(function (p, i) {
      var bits = p.split('|');
      var last = i === parts.length - 1;
      var link = bits[1]
        ? '<a href="' + ROOT + bits[1] + '">' + bits[0] + '</a>'
        : '<span' + (last ? ' aria-current="page"' : '') + '>' + bits[0] + '</span>';
      return (i ? '<span class="sep">/</span>' : '') + link;
    }).join('');
  }
})();
