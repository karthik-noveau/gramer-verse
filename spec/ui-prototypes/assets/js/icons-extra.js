/* ============================================================
   icons-extra.js — picture sets for the remaining six topics.

   Tenses, verbs, WH words, adjectives, adverbs and sentence types.
   Kept out of scene.js so the drawing engine stays about scenes
   while the vocabulary art lives here.

   Same contract as the core icons: a value in, SVG body out,
   drawn in a 48x48 box.

   Abstract words (must, would, honest, usually) have no natural
   picture. They get a consistent schematic instead — a repeated
   visual language, not a literal drawing — and the caption carries
   the rest. Where even that would be a lie, no icon is returned and
   the card falls back to a letter tile.
   ============================================================ */
(function () {
  'use strict';
  var K = GV_Scene.kit, R = K.R, CIR = K.CIR, T = K.T, LN = K.LN;

  var INK = 'var(--ink)', ACC = 'var(--accent)', MUT = 'var(--muted)',
      WARN = 'var(--warn)', SOFT = 'var(--soft)', LINE = 'var(--line-strong)';

  /* ---- shared parts ---------------------------------------- */
  function axis(y) {            /* a little timeline with a now tick */
    return LN(5, y, 43, y, { c: LINE, w: 2 }) +
           LN(24, y - 4, 24, y + 4, { c: MUT, w: 1.5 });
  }
  function face(mood) {
    var eyes = CIR(19, 21, 1.8, INK) + CIR(29, 21, 1.8, INK);
    var mouth = mood === 'happy' ? 'M18 28 q6 6 12 0'
              : mood === 'sad'   ? 'M18 30 q6 -6 12 0'
              : 'M18 29 h12';
    return CIR(24, 24, 15, '#f2d9b5') + eyes +
      '<path d="' + mouth + '" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function motion(n) {          /* speed lines */
    var out = '';
    for (var i = 0; i < n; i++) out += LN(8, 18 + i * 6, 8 + 8 + i * 4, 18 + i * 6, { c: ACC, w: 2.5 });
    return out;
  }
  function bars(a, b) {         /* two heights, for tall/short, big/small */
    return R(13, 40 - a, 8, a, 2, LINE) + R(27, 40 - b, 8, b, 2, ACC);
  }
  function ticks(on, total) {   /* frequency: filled out of five */
    var out = '';
    for (var i = 0; i < total; i++) {
      out += R(7 + i * 7.5, 20, 5, 10, 1.5, i < on ? ACC : LINE);
    }
    return out;
  }
  function waves(n, size) {     /* sound */
    var out = '';
    for (var i = 0; i < n; i++) {
      var r = size + i * 5;
      out += '<path d="M20 ' + (24 - r) + ' a' + r + ' ' + r + ' 0 0 1 0 ' + (2 * r) +
             '" stroke="' + ACC + '" stroke-width="2" fill="none" opacity="' + (1 - i * 0.22) + '"/>';
    }
    return CIR(16, 24, 5, INK) + out;
  }
  function mark(ch, colour) {
    return T(24, 32, ch, { s: 26, w: 700, f: colour || ACC });
  }

  /* ============================================================
     1. tenses — position on the line, and the shape of the event
     ============================================================ */
  var TENSE = {
    'Simple present':            ['now', 'point', false],
    'Present continuous':        ['now', 'band',  false],
    'Present perfect':           ['past', 'point', true],
    'Present perfect continuous':['past', 'band',  true],
    'Simple past':               ['past', 'point', false],
    'Past continuous':           ['past', 'band',  false],
    'Past perfect':              ['early', 'point', true],
    'Past perfect continuous':   ['early', 'band', true],
    'Simple future':             ['future', 'point', false],
    'Future continuous':         ['future', 'band', false],
    'Future perfect':            ['future', 'point', true],
    'Future perfect continuous': ['future', 'band', true]
  };
  var XPOS = { early: 11, past: 16, now: 24, future: 36 };

  GV_Scene.registerIcon('tense', function (v) {
    var spec = TENSE[v]; if (!spec) return '';
    var x = XPOS[spec[0]], y = 26, out = axis(y);
    if (spec[1] === 'band') {
      out += R(x - 7, y - 5, 15, 10, 3, 'var(--accent-soft)') +
             R(x - 7, y - 5, 15, 10, 3, 'none') +
             LN(x - 7, y - 5, x + 8, y - 5, { c: ACC, w: 2 }) +
             LN(x - 7, y + 5, x + 8, y + 5, { c: ACC, w: 2 });
    } else {
      out += CIR(x, y, 5, ACC);
    }
    if (spec[2]) out += LN(x + 11, y - 9, x + 11, y + 9, { c: WARN, w: 2.5 });
    return out;
  });

  /* ---- when, in three ----------------------------------------
     The twelve-tense family above is keyed by full name ("Simple present")
     and draws the shape of the event as well as its position. This is the
     coarse version — just where on the line — for a control that offers only
     past, now and next. Same axis, same now-tick, so the two read as the same
     picture at different resolutions. */
  var WHEN = { past: 12, present: 24, future: 36 };
  GV_Scene.registerIcon('when', function (v) {
    var x = WHEN[String(v).toLowerCase()];
    if (x === undefined) return '';
    return axis(26) + CIR(x, 26, 6, ACC) +
      (x === 24 ? '' : LN(24, 26, x < 24 ? x + 6 : x - 6, 26, { c: MUT, w: 2, d: '3 3' }));
  });

  /* ============================================================
     2. verbs — be, have, and the modals
     ============================================================ */
  var VERB = {
    'Be form':  function () { return mark('=', INK); },
    'Have form':function () { return R(12, 22, 24, 14, 2, '#c89a5e') +
                                     '<path d="M12 22 q12 -12 24 0" stroke="' + SOFT +
                                     '" stroke-width="2.5" fill="none"/>'; },
    can:     function () { return CIR(24, 24, 13, 'var(--accent-soft)') + mark('✓', ACC); },
    could:   function () { return CIR(24, 24, 13, 'var(--surface-sunk)') + mark('✓', MUT); },
    will:    function () { return axis(26) + CIR(36, 26, 5, ACC) +
                                  LN(14, 26, 30, 26, { c: ACC, w: 2.5 }); },
    would:   function () { return axis(26) + CIR(36, 26, 5, 'none') +
                                  '<circle cx="36" cy="26" r="5" fill="none" stroke="' + MUT +
                                  '" stroke-width="2" stroke-dasharray="3 3"/>' +
                                  LN(14, 26, 30, 26, { c: MUT, w: 2, d: '3 3' }); },
    may:     function () { return ticks(3, 5); },
    might:   function () { return ticks(1, 5); },
    must:    function () { return R(16, 22, 16, 14, 2, WARN) +
                                  '<path d="M20 22 v-4 a4 4 0 0 1 8 0 v4" stroke="' + WARN +
                                  '" stroke-width="2.5" fill="none"/>'; },
    shall:   function () { return axis(26) + CIR(36, 26, 5, ACC) +
                                  LN(14, 26, 30, 26, { c: ACC, w: 2.5 }) + T(24, 14, '★', { s: 10, f: MUT }); },
    should:  function () { return CIR(24, 24, 13, 'var(--accent-soft)') + mark('!', ACC); },
    'ought to': function () { return LN(24, 12, 24, 34, { c: SOFT, w: 2 }) +
                                     LN(12, 18, 36, 18, { c: SOFT, w: 2 }) +
                                     CIR(12, 24, 5, 'var(--accent-soft)') + CIR(36, 24, 5, 'var(--accent-soft)'); }
  };
  GV_Scene.registerIcon('verb', function (v) {
    var f = VERB[v] || VERB[String(v).toLowerCase()];
    return f ? f() : '';
  });

  /* ============================================================
     3. WH words — each asks for a different kind of answer
     ============================================================ */
  var WH = {
    What:  function () { return R(14, 20, 20, 16, 2, '#c89a5e') + T(24, 17, '?', { s: 13, w: 700, f: ACC }); },
    When:  function () { return CIR(24, 25, 13, 'none') +
                                '<circle cx="24" cy="25" r="13" fill="none" stroke="' + INK + '" stroke-width="2.5"/>' +
                                LN(24, 25, 24, 17, { c: INK, w: 2.5 }) + LN(24, 25, 30, 28, { c: INK, w: 2.5 }); },
    Where: function () { return '<path d="M24 40 l-8 -14 a9 9 0 1 1 16 0 z" fill="' + ACC + '"/>' +
                                CIR(24, 22, 3.5, 'var(--surface)'); },
    Why:   function () { return T(24, 22, '→', { s: 16, f: MUT }) + T(24, 38, '?', { s: 18, w: 700, f: ACC }); },
    Who:   function () { return CIR(24, 19, 6, '#d9a06a') +
                                '<path d="M15 38 v-5 a9 9 0 0 1 18 0 v5 z" fill="#3d6fa8"/>' +
                                T(38, 18, '?', { s: 13, w: 700, f: ACC }); },
    Whose: function () { return CIR(18, 18, 5, '#d9a06a') +
                                '<path d="M11 34 v-4 a7 7 0 0 1 14 0 v4 z" fill="#3d6fa8"/>' +
                                R(28, 24, 14, 12, 2, '#c89a5e') + T(35, 20, '?', { s: 11, w: 700, f: ACC }); },
    Which: function () { return CIR(15, 27, 7, LINE) + CIR(33, 27, 7, ACC) + T(24, 16, '?', { s: 12, w: 700, f: ACC }); },
    How:   function () { return R(9, 30, 9, 8, 1, LINE) + R(20, 25, 9, 13, 1, LINE) + R(31, 19, 9, 19, 1, ACC); },
    'How much': function () { return CIR(18, 28, 8, '#e0a92e') + CIR(28, 24, 8, '#e0a92e') +
                                     T(24, 15, '?', { s: 11, w: 700, f: ACC }); },
    'How many': function () { return CIR(12, 28, 5, ACC) + CIR(24, 28, 5, ACC) + CIR(36, 28, 5, ACC) +
                                     T(24, 15, '?', { s: 11, w: 700, f: ACC }); },
    'How long': function () { return axis(28) + LN(12, 28, 36, 28, { c: ACC, w: 4 }) +
                                     T(24, 17, '?', { s: 11, w: 700, f: ACC }); },
    'How far':  function () { return CIR(9, 28, 4, INK) + CIR(39, 28, 4, ACC) +
                                     LN(14, 28, 34, 28, { c: MUT, w: 2, d: '3 3' }) +
                                     T(24, 17, '?', { s: 11, w: 700, f: ACC }); },
    'How old':  function () { return R(13, 26, 22, 12, 2, '#e8c9a0') +
                                     LN(19, 26, 19, 19, { c: WARN, w: 2 }) + LN(29, 26, 29, 19, { c: WARN, w: 2 }) +
                                     T(24, 15, '?', { s: 11, w: 700, f: ACC }); },
    'How often':function () { return ticks(3, 5) + T(24, 15, '?', { s: 11, w: 700, f: ACC }); }
  };
  GV_Scene.registerIcon('wh', function (v) {
    var f = WH[v] || WH[String(v).charAt(0).toUpperCase() + String(v).slice(1)];
    return f ? f() : '';
  });

  /* ============================================================
     4. adjectives — the quality itself, never the word
     ============================================================ */
  var ADJ = {
    big:   function () { return CIR(24, 24, 17, ACC); },
    small: function () { return CIR(24, 24, 6, ACC); },
    tall:  function () { return bars(12, 30); },
    short: function () { return bars(30, 12); },
    happy: function () { return face('happy'); },
    sad:   function () { return face('sad'); },
    beautiful: function () { return face('happy') + T(38, 16, '✦', { s: 13, f: ACC }); },
    good:  function () { return CIR(24, 24, 14, 'var(--accent-soft)') + mark('✓', ACC); },
    bad:   function () { return CIR(24, 24, 14, 'var(--danger-soft)') + mark('✗', 'var(--danger)'); },
    strong:function () { return R(10, 22, 28, 8, 3, INK) + CIR(10, 26, 7, INK) + CIR(38, 26, 7, INK); },
    weak:  function () { return R(14, 25, 20, 3, 1.5, LINE) + CIR(14, 26, 4, LINE) + CIR(34, 26, 4, LINE); },
    fast:  function () { return motion(3) + CIR(34, 24, 8, ACC); },
    slow:  function () { return LN(10, 24, 18, 24, { c: MUT, w: 2 }) + CIR(30, 24, 8, MUT); },
    clever:function () { return CIR(24, 20, 9, '#f6e7a8') +
                                R(21, 29, 6, 5, 1, LINE) +
                                LN(24, 8, 24, 11, { c: ACC, w: 2 }) +
                                LN(14, 12, 16, 14, { c: ACC, w: 2 }) + LN(34, 12, 32, 14, { c: ACC, w: 2 }); },
    kind:  function () { return '<path d="M24 36 C10 26 12 14 20 14 c3 0 4 2 4 3 0-1 1-3 4-3 8 0 10 12 -4 22 z" fill="' +
                                'var(--danger)" opacity=".85"/>'; },
    brave: function () { return '<path d="M24 10 l13 5 v10 c0 8-7 12-13 15 -6-3-13-7-13-15 V15 z" fill="' +
                                'var(--accent-soft)" stroke="' + ACC + '" stroke-width="2"/>' + mark('✓', ACC); },
    honest:function () { return CIR(24, 24, 14, 'none') +
                                '<circle cx="24" cy="24" r="14" fill="none" stroke="' + ACC + '" stroke-width="2"/>' +
                                mark('✓', ACC); }
  };
  GV_Scene.registerIcon('adj2', function (v) {
    var f = ADJ[String(v).toLowerCase()];
    return f ? f() : '';
  });

  /* ============================================================
     5. adverbs — how, and how often
     ============================================================ */
  var ADV = {
    quickly: function () { return motion(3) + CIR(34, 24, 7, ACC); },
    slowly:  function () { return LN(10, 24, 17, 24, { c: MUT, w: 2 }) + CIR(30, 24, 7, MUT); },
    loudly:  function () { return waves(3, 7); },
    softly:  function () { return waves(1, 6); },
    always:  function () { return ticks(5, 5); },
    usually: function () { return ticks(4, 5); },
    often:   function () { return ticks(3, 5); },
    sometimes:function () { return ticks(2, 5); },
    never:   function () { return ticks(0, 5) + LN(7, 33, 41, 17, { c: 'var(--danger)', w: 2.5 }); },
    yesterday:function () { return axis(26) + CIR(13, 26, 5, ACC); },
    today:   function () { return axis(26) + CIR(24, 26, 5, ACC); },
    tomorrow:function () { return axis(26) + CIR(36, 26, 5, ACC); },
    well:    function () { return CIR(24, 24, 14, 'var(--accent-soft)') + mark('✓', ACC); },
    badly:   function () { return CIR(24, 24, 14, 'var(--danger-soft)') + mark('✗', 'var(--danger)'); }
  };
  GV_Scene.registerIcon('adv', function (v) {
    var f = ADV[String(v).toLowerCase()];
    return f ? f() : '';
  });

  /* ============================================================
     conjunctions — the shape of the join
     ============================================================ */
  function arrowR() {                      /* 21 → 27, head at the right */
    return LN(20, 24, 26, 24, { c: MUT, w: 2.5 }) +
      '<path d="M26 20 L31 24 L26 28 z" fill="' + MUT + '"/>';
  }
  function arrowL() {
    return LN(22, 24, 28, 24, { c: MUT, w: 2.5 }) +
      '<path d="M22 20 L17 24 L22 28 z" fill="' + MUT + '"/>';
  }
  var CONJ = {
    and: function () {                     /* both, held together */
      return CIR(15, 24, 8, ACC) + CIR(33, 24, 8, ACC) +
        '<path d="M15 36 v4 h18 v-4" fill="none" stroke="' + SOFT + '" stroke-width="2"/>';
    },
    but: function () {                     /* one, then the opposite */
      return CIR(14, 24, 8, ACC) + CIR(34, 24, 8, LINE) +
        LN(24, 12, 24, 36, { c: WARN, w: 2.5, d: '4 3' });
    },
    or: function () {                      /* a fork — one or the other */
      return '<path d="M24 38 V28 M24 28 L13 18 M24 28 L35 18" fill="none" stroke="' + SOFT +
        '" stroke-width="2.5" stroke-linecap="round"/>' +
        CIR(13, 14, 6, ACC) + CIR(35, 14, 6, LINE);
    },
    /* because and so join the same two halves; only the direction of cause
       differs, so the arrow has to be the thing that differs on screen.
       Left circle is the first half of the sentence, right the second, and
       the warn colour always marks the cause.
       A marker id would collide across the dozens of icons on one page, so
       the head is drawn inline. */
    because: function () {                 /* "I came because you called." */
      return CIR(12, 24, 7, ACC) + CIR(36, 24, 7, WARN) + arrowL();
    },
    so: function () {                      /* "I was tired, so I slept." */
      return CIR(12, 24, 7, WARN) + CIR(36, 24, 7, ACC) + arrowR();
    }
  };
  GV_Scene.registerIcon('conj', function (v) {
    var f = CONJ[String(v).toLowerCase()]; return f ? f() : '';
  });

  /* ============================================================
     6. sentence types — what the sentence is doing
     ============================================================ */
  var SENT = {
    Positive:  function () { return R(8, 20, 32, 9, 3, 'var(--accent-soft)') + T(24, 42, '+', { s: 18, w: 700, f: ACC }); },
    Negative:  function () { return R(8, 20, 32, 9, 3, 'var(--surface-sunk)') +
                                    LN(8, 33, 40, 15, { c: 'var(--danger)', w: 3 }); },
    Question:  function () { return R(8, 20, 32, 9, 3, 'var(--surface-sunk)') + T(24, 44, '?', { s: 20, w: 700, f: ACC }); },
    'Yes / No question': function () { return T(15, 30, '✓', { s: 18, w: 700, f: ACC }) +
                                              T(34, 30, '✗', { s: 18, w: 700, f: 'var(--danger)' }) +
                                              T(24, 44, '?', { s: 13, w: 700, f: MUT }); },
    Imperative:function () { return '<path d="M10 24 h20 l-6 -6 m6 6 l-6 6" stroke="' + WARN +
                                    '" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
                                    T(24, 42, '!', { s: 16, w: 700, f: WARN }); },
    Exclamatory:function(){ return T(24, 36, '!', { s: 32, w: 700, f: WARN }); }
  };
  GV_Scene.registerIcon('sent', function (v) {
    var f = SENT[v]; return f ? f() : '';
  });

  /* ============================================================
     prepositions the scene renderer does not draw

     scene.js draws the six place relations it can actually stage — a ball
     really does go in, on, under, above, behind or beside a box. The rest of
     the source's prepositions are relations the scene has no props for:
     stretches of time, paths through space, and a handful that are not
     spatial at all.

     They are drawn here, in three consistent visual languages rather than
     twenty-six unrelated doodles:
       place     — an object and a ground, laid out the way the words mean
       time      — a line with a marked point, and where the event sits on it
       direction — a path with an arrow, and what the path meets

     This extends the `prep` family instead of starting a new one, so a
     caller still asks for one thing: the picture of this preposition.
     ============================================================ */
  function ground(x, y, w, h) { return R(x, y, w, h || 20, 2, '#c89a5e'); }
  function ball(x, y, r) {
    r = r || 6;
    return CIR(x, y, r, '#e08a2e') +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r +
      '" fill="none" stroke="#8a5b30" stroke-width="1.5"/>';
  }
  function dash(x1, y1, x2, y2) { return LN(x1, y1, x2, y2, { c: MUT, w: 1.5, d: '3 3' }); }
  function pin(x, y) {          /* a place marker */
    return '<path d="M' + x + ' ' + (y + 9) + ' l-6 -11 a7 7 0 1 1 12 0 z" fill="' + ACC + '"/>' +
      CIR(x, y - 4, 2.6, 'var(--surface)');
  }
  function path(d, colour) {    /* an arrowless route */
    return '<path d="' + d + '" fill="none" stroke="' + (colour || ACC) +
      '" stroke-width="2.5" stroke-linecap="round"/>';
  }
  function head(x, y, dir) {    /* an arrowhead, drawn not markered */
    var s = 5;
    return dir === 'left'  ? '<path d="M' + (x + s) + ' ' + (y - s) + ' L' + x + ' ' + y + ' L' + (x + s) + ' ' + (y + s) + ' z" fill="' + ACC + '"/>'
         : dir === 'up'    ? '<path d="M' + (x - s) + ' ' + (y + s) + ' L' + x + ' ' + y + ' L' + (x + s) + ' ' + (y + s) + ' z" fill="' + ACC + '"/>'
         : '<path d="M' + (x - s) + ' ' + (y - s) + ' L' + x + ' ' + y + ' L' + (x - s) + ' ' + (y + s) + ' z" fill="' + ACC + '"/>';
  }
  function line(y) {            /* the time line, with the moment marked */
    return LN(4, y, 44, y, { c: LINE, w: 2 }) + LN(24, y - 5, 24, y + 5, { c: INK, w: 2 });
  }
  /* A stretch of time. At 48px a tinted fill is invisible against the card,
     so the band is drawn as a solid bar in the accent with its ends capped —
     the shape has to survive being small. */
  function band(x1, x2, y) {
    return R(x1, y - 4, x2 - x1, 8, 2, ACC) +
      LN(x1, y - 8, x1, y + 8, { c: ACC, w: 2 }) +
      LN(x2, y - 8, x2, y + 8, { c: ACC, w: 2 });
  }

  var PREP2 = {
    /* ---- place ----
       Same ground and same ball as the six in scene.js — 24 wide, r6 — so the
       twelve place prepositions read as one set rather than two.

       Three pairs were indistinguishable at 40px and are now separated by the
       thing that actually differs between them:
         near / beside          a measured gap, versus touching
         in front of / behind   what is covering what
         there / here           away, versus this very spot */
    'below':       function () { return ground(12, 10, 24, 16) + ball(24, 36) +
                                   dash(24, 28, 24, 32); },
    'between':     function () { return ground(4, 20, 14, 18) + ground(30, 20, 14, 18) +
                                   ball(24, 30); },
    /* a gap, and it is measured: the ticks are what say "not touching" */
    'near':        function () { return ground(4, 20, 18, 18) + ball(40, 32) +
                                   dash(24, 32, 32, 32) +
                                   LN(24, 27, 24, 37, { c: MUT, w: 1.2 }) +
                                   LN(32, 27, 32, 37, { c: MUT, w: 1.2 }); },
    /* the ball covers the box's near edge — nothing of it is hidden, which is
       what tells it from "behind" */
    'in front of': function () { return ground(12, 16, 24, 18) + ball(24, 34, 8); },
    'there':       function () { return ball(8, 32) + pin(38, 24) +
                                   dash(15, 32, 28, 28) + head(33, 27); },
    'here':        function () { return CIR(24, 36, 10, 'none') +
                                   '<circle cx="24" cy="36" r="10" fill="none" stroke="' + MUT +
                                     '" stroke-width="1.2" stroke-dasharray="2 3"/>' +
                                   ball(24, 36) + pin(24, 18); },

    /* ---- time: where the event sits on the line ---- */
    'before':      function () { return line(28) + ball(12, 28) + dash(16, 28, 22, 28); },
    'after':       function () { return line(28) + ball(36, 28) + dash(26, 28, 32, 28); },
    'by':          function () { return line(28) + band(8, 36, 28) +
                                   LN(38, 14, 38, 42, { c: WARN, w: 3.5 }) +
                                   head(38, 22, 'left'); },
    'since':       function () { return line(28) + band(10, 24, 28) + ball(10, 28, 4); },
    'during':      function () { return line(28) + band(12, 36, 28) + ball(24, 28, 4); },
    'until':       function () { return line(28) + band(6, 32, 28) +
                                   LN(34, 14, 34, 42, { c: WARN, w: 3.5 }) +
                                   LN(38, 14, 38, 42, { c: WARN, w: 3.5 }); },

    /* ---- direction: a path, and what it meets ---- */
    'to':          function () { return ball(8, 24) + path('M15 24 H32') + head(37, 24) + pin(43, 20); },
    'into':        function () { return ground(24, 12, 22, 26) + ball(8, 24) +
                                   path('M14 24 H28') + head(33, 24); },
    'towards':     function () { return ball(6, 24) + path('M12 24 H26') + head(31, 24) +
                                   dash(34, 24, 40, 24) + pin(43, 20); },
    'along':       function () { return path('M4 34 C16 30 32 30 44 34', LINE) +
                                   path('M6 22 H34') + head(39, 22); },
    'across':      function () { return R(18, 4, 12, 40, 2, '#c89a5e') +
                                   path('M4 24 H34') + head(40, 24); },
    'over':        function () { return ground(18, 28, 12, 16) +
                                   path('M5 40 C12 6 36 6 43 40') + head(43, 36, 'down'); },
    'past':        function () { return ground(18, 26, 12, 18) +
                                   path('M4 18 H38') + head(43, 18); },
    'from':        function () { return ground(2, 12, 20, 26) + path('M22 24 H36') + head(41, 24) +
                                   ball(10, 24); },

    /* ---- the rest: no scene to draw, so a schematic, used consistently ---- */
    'about':       function () { return R(16, 16, 16, 20, 2, '#c89a5e') +
                                   '<circle cx="24" cy="26" r="20" fill="none" stroke="' + MUT +
                                   '" stroke-width="2" stroke-dasharray="4 4"/>'; },
    'for':         function () { return CIR(38, 22, 6, '#d9a06a') +
                                   R(6, 20, 14, 14, 2, ACC) + path('M21 27 H27') + head(32, 27); },
    'with':        function () { return CIR(16, 24, 8, ACC) + CIR(32, 24, 8, '#d9a06a') +
                                   LN(16, 36, 32, 36, { c: SOFT, w: 2.5 }); },
    'as':          function () { return CIR(24, 18, 7, '#d9a06a') +
                                   R(11, 30, 26, 11, 3, ACC) +
                                   LN(15, 35, 33, 35, { c: 'var(--surface)', w: 2 }); },
    'like':        function () { return CIR(15, 24, 9, ACC) +
                                   '<circle cx="33" cy="24" r="9" fill="none" stroke="' + ACC +
                                   '" stroke-width="2.5" stroke-dasharray="4 3"/>'; },
    'per':         function () { return CIR(24, 14, 6, ACC) + LN(10, 26, 38, 26, { c: INK, w: 2.5 }) +
                                   CIR(14, 36, 5, LINE) + CIR(24, 36, 5, LINE) + CIR(34, 36, 5, LINE); }
  };
  /* aliases the source spells its own way */
  PREP2['till'] = PREP2['until'];
  PREP2['until / till'] = PREP2['until'];
  PREP2['at'] = function () {   /* a point, not a container or a surface */
    return LN(6, 34, 42, 34, { c: LINE, w: 2 }) + pin(24, 24);
  };

  /* Extend rather than replace: the six the scene can stage keep their
     drawings, and anything it does not know falls through to here. */
  var scenePrep = GV_Scene.registerIcon('prep', function (v) {
    var own = scenePrep && scenePrep(v);
    if (own) return own;
    var f = PREP2[String(v).toLowerCase()];
    return f ? f() : '';
  });
})();
