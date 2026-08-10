/* ============================================================
   scene.js — the drawing engine, prototype edition.

   Proves the architecture in §4 of architecture.md:
     scene state ──► renderer ──► SVG
     scene state ──► sentence builder ──► en + ta lines

   Two of the five renderers are implemented here (place and
   timeline) because those are the ones the lesson page demos.
   The remaining three (path, actor, relation) are specified in
   engines 12, 14 and 15 and catalogued in scenes-catalogue.html.

   Pure functions over plain state. No DOM reads, no storage.
   ============================================================ */
(function () {
  'use strict';

  var W = 720, H = 420, FLOOR = 336;

  var C = {
    wood: '#a9723f', wood2: '#8a5b30', leaf: '#3f8f5a', grey: '#9aa0a6',
    red: '#d2452f', gold: '#e0a92e', paper: '#f4efe6'
  };

  /* ---- primitives ----------------------------------------- */
  function R(x, y, w, h, rad, fill, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (rad || 0) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function CIR(cx, cy, r, fill) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"/>';
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') +
      '" font-family="system-ui, sans-serif" font-size="' + (o.s || 14) +
      '" font-weight="' + (o.w || 600) + '" fill="' + (o.f || 'var(--muted)') + '">' + s + '</text>';
  }
  function LN(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (o.c || 'var(--line)') + '" stroke-width="' + (o.w || 2) + '"' +
      (o.d ? ' stroke-dasharray="' + o.d + '"' : '') + ' stroke-linecap="round"/>';
  }
  function shadow(cx, w) {
    return '<ellipse cx="' + cx + '" cy="' + (FLOOR + 3) + '" rx="' + (w / 2) +
      '" ry="7" fill="rgba(0,0,0,.13)"/>';
  }
  function floorLine() { return LN(30, FLOOR, 690, FLOOR, { c: 'var(--line)', w: 3 }); }

  /* ============================================================
     props — each draws into its own box and declares anchors.
     `word` carries the declined Tamil forms (architecture §3.2).
     ============================================================ */
  /* `clearance` is whether anything can fit beneath the prop. A table stands on
     legs so it has clearance; a box sits flat on the floor so nothing can be
     under it. Without this, "under the box" draws the figure inside the box —
     the picture then contradicts the sentence, which is the one thing this
     product must never do. */
  var PROPS = {
    table: {
      box: { w: 300, h: 150 }, surfaceY: 14, inside: null, clearance: true,
      word: {
        en: { s: 'table', p: 'tables' },
        ta: { nom: 'மேசை', loc: 'மேசையில்', gen: 'மேசையின்', dat: 'மேசைக்கு' }
      },
      draw: function () {
        return R(0, 0, 300, 16, 3, C.wood) + R(18, 16, 16, 134, 0, C.wood2) +
               R(266, 16, 16, 134, 0, C.wood2) + R(34, 26, 232, 8, 0, C.wood2);
      }
    },
    box: {
      box: { w: 190, h: 150 }, surfaceY: 0, inside: [18, 34, 154, 100], clearance: false,
      word: {
        en: { s: 'box', p: 'boxes' },
        ta: { nom: 'பெட்டி', loc: 'பெட்டியில்', gen: 'பெட்டியின்', dat: 'பெட்டிக்கு' }
      },
      draw: function () {
        return R(0, 22, 190, 128, 4, '#c89a5e') +
               R(0, 0, 86, 26, 4, '#b3873f') + R(104, 0, 86, 26, 4, '#b3873f');
      }
    },
    chair: {
      box: { w: 150, h: 210 }, surfaceY: 96, inside: null, clearance: true,
      word: {
        en: { s: 'chair', p: 'chairs' },
        ta: { nom: 'நாற்காலி', loc: 'நாற்காலியில்', gen: 'நாற்காலியின்', dat: 'நாற்காலிக்கு' }
      },
      draw: function () {
        return R(16, 0, 14, 104, 3, C.wood2) + R(120, 0, 14, 104, 3, C.wood2) +
               R(16, 22, 118, 12, 2, C.wood2) + R(16, 54, 118, 12, 2, C.wood2) +
               R(0, 96, 150, 16, 3, C.wood) +
               R(10, 112, 14, 98, 0, C.wood2) + R(126, 112, 14, 98, 0, C.wood2);
      }
    },
    ball: {
      box: { w: 74, h: 74 },
      word: {
        en: { s: 'ball', p: 'balls' },
        ta: { nom: 'பந்து', pl: 'பந்துகள்' }
      },
      draw: function (f) {
        return CIR(37, 37, 35, f || '#e08a2e') +
          '<path d="M4 37h66" stroke="rgba(0,0,0,.25)" stroke-width="4" fill="none"/>' +
          '<path d="M37 2a48 48 0 0 0 0 70" stroke="rgba(0,0,0,.25)" stroke-width="4" fill="none"/>';
      }
    },
    apple: {
      box: { w: 78, h: 88 },
      word: {
        en: { s: 'apple', p: 'apples' },
        ta: { nom: 'ஆப்பிள்', pl: 'ஆப்பிள்கள்' }
      },
      draw: function (f) {
        return CIR(39, 52, 34, f || C.red) + R(36, 8, 7, 26, 3, C.wood2) +
          '<ellipse cx="56" cy="18" rx="17" ry="9" fill="' + C.leaf + '" transform="rotate(-18 56 18)"/>';
      }
    },
    cup: {
      box: { w: 70, h: 78 },
      word: {
        en: { s: 'cup', p: 'cups' },
        ta: { nom: 'கோப்பை', pl: 'கோப்பைகள்' }
      },
      draw: function (f) {
        return '<path d="M8 8h48l-7 62H15z" fill="' + (f || '#e8e4dc') + '" stroke="' + C.grey + '" stroke-width="3"/>' +
          '<path d="M56 22c16 0 16 26 0 26" stroke="' + C.grey + '" stroke-width="6" fill="none"/>';
      }
    },
    cat: {
      box: { w: 110, h: 92 },
      word: {
        en: { s: 'cat', p: 'cats' },
        ta: { nom: 'பூனை', pl: 'பூனைகள்' }
      },
      draw: function (f) {
        return '<g transform="translate(110,0) scale(-1,1)">' +
          '<ellipse cx="58" cy="62" rx="44" ry="27" fill="' + (f || '#6b6259') + '"/>' +
          CIR(22, 42, 22, f || '#6b6259') +
          '<path d="M7 27l2-19 15 12z" fill="' + (f || '#6b6259') + '"/>' +
          '<path d="M37 27l-2-19-15 12z" fill="' + (f || '#6b6259') + '"/>' +
          '<path d="M100 54c23-6 15-36-2-27" stroke="' + (f || '#6b6259') +
            '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
          CIR(14, 40, 3, '#111') + CIR(29, 40, 3, '#111') + '</g>';
      }
    }
  };

  /* ---- prepositions: geometry + the Tamil case they govern -- */
  /* Every place relation the source lists that a figure and a ground can
     actually be in. The Tamil case and postposition are the ones the notes
     give in the prepositions-of-place table, so the sentence this builds is
     the sentence the notes would write.

     `two` marks the one relation that needs a second ground: "between the
     school and the hospital" is not a figure against a ground, it is a figure
     against two of them. */
  var PREPS = {
    'in':          { ta: { case: 'loc', post: '' } },
    'at':          { ta: { case: 'loc', post: '' } },
    'on':          { ta: { case: 'gen', post: 'மீது' } },
    'under':       { ta: { case: 'dat', post: 'கீழே' } },
    'below':       { ta: { case: 'dat', post: 'கீழே' } },
    'above':       { ta: { case: 'dat', post: 'மேலே' } },
    'behind':      { ta: { case: 'dat', post: 'பின்னால்' } },
    'in front of': { ta: { case: 'dat', post: 'முன்னால்' } },
    'near':        { ta: { case: 'dat', post: 'அருகில்' } },
    'beside':      { ta: { case: 'dat', post: 'அருகில்' } },
    'between':     { ta: { case: 'dat', post: 'நடுவில்' }, two: true }
  };

  var ADJ = {
    red:   { ta: 'சிவப்பு', colour: C.red,  scale: 1 },
    green: { ta: 'பச்சை',   colour: C.leaf, scale: 1 },
    big:   { ta: 'பெரிய',   colour: '',     scale: 1.32 },
    small: { ta: 'சிறிய',   colour: '',     scale: .64 }
  };

  var NUM_TA = { 1: 'ஒரு', 2: 'இரண்டு', 3: 'மூன்று' };


  /* ---- transliteration -------------------------------------
     English written in Tamil script, so a learner who cannot read
     the Latin alphabet can still pronounce the sentence. This is the
     bridge between "I understand the picture" and "I can say it".
     ---------------------------------------------------------- */
  var TRANSLIT = {
    the:'த', a:'அ', an:'அன்', is:'இஸ்', are:'ஆர்',
    ball:'பால்', balls:'பால்ஸ்', apple:'ஆப்பிள்', apples:'ஆப்பிள்ஸ்',
    cup:'கப்', cups:'கப்ஸ்', cat:'கேட்', cats:'கேட்ஸ்',
    box:'பாக்ஸ்', table:'டேபிள்', chair:'செயர்',
    'in':'இன்', on:'ஆன்', under:'அண்டர்', above:'அபவ்',
    behind:'பிஹைண்ட்', beside:'பிசைட்',
    red:'ரெட்', green:'கிரீன்', big:'பிக்', small:'ஸ்மால்',
    '1':'ஒன்', '2':'டூ', '3':'த்ரீ',
    One:'ஒன்', Two:'டூ', Three:'த்ரீ', The:'த', A:'அ', An:'அன்',

    /* verbs */
    be:'பீ', have:'ஹேவ்', can:'கேன்', could:'குட்', will:'வில்', would:'வுட்',
    may:'மே', might:'மைட்', must:'மஸ்ட்', shall:'ஷல்', should:'ஷுட்',
    ought:'ஆட்', to:'டு',

    /* WH words */
    what:'வாட்', when:'வென்', where:'வேர்', why:'வை', who:'ஹூ', whose:'ஹூஸ்',
    which:'விச்', how:'ஹவ்', much:'மச்', many:'மெனி', long:'லாங்', far:'ஃபார்',
    old:'ஓல்ட்',

    /* adjectives */
    tall:'டால்', 'short':'ஷார்ட்', happy:'ஹேப்பி', sad:'சேட்', beautiful:'பியூட்டிஃபுல்',
    good:'குட்', bad:'பேட்', strong:'ஸ்ட்ராங்', weak:'வீக்', fast:'ஃபாஸ்ட்',
    slow:'ஸ்லோ', clever:'க்ளெவர்', kind:'கைண்ட்', brave:'பிரேவ்', honest:'ஆனெஸ்ட்',

    /* adverbs */
    quickly:'க்விக்லி', slowly:'ஸ்லோலி', loudly:'லவுட்லி', softly:'சாஃப்ட்லி',
    always:'ஆல்வேஸ்', usually:'யூஷுவலி', often:'ஆஃபன்', sometimes:'சம்டைம்ஸ்',
    never:'நெவர்', yesterday:'யெஸ்டர்டே', today:'டுடே', tomorrow:'டுமாரோ',
    well:'வெல்', badly:'பேட்லி',

    /* nouns and pronouns */
    person:'பர்சன்', place:'ப்ளேஸ்', thing:'திங்', animal:'அனிமல்',
    I:'ஐ', we:'வீ', you:'யூ', he:'ஹீ', she:'ஷீ', it:'இட்', they:'தே',

    /* conjunctions */
    and:'அண்ட்', but:'பட்', or:'ஆர்', because:'பிகாஸ்', so:'சோ'
  };
  function key(word) {
    return String(word).replace(/[.,?!]+$/, '');
  }
  function translit(word) {
    var w = key(word);
    return TRANSLIT[w] || TRANSLIT[w.toLowerCase()] || w;
  }
  /* Whether every word of a phrase has a transliteration.
     translit() falls back to the Latin word, which is fine mid-sentence but a
     lie in a row tagged lang="ta" — that renders English and calls it Tamil.
     Callers that tag their output ask first and drop the row if the answer is
     no; a half-transliterated line is worse than none. */
  function canTranslit(text) {
    return String(text).split(/\s+/).filter(Boolean).every(function (w) {
      var k = key(w);
      return TRANSLIT[k] != null || TRANSLIT[k.toLowerCase()] != null;
    });
  }


  /* ============================================================
     icons — one small picture per word.

     For a learner with no English, a word is not a label, it is a
     picture. Every vocabulary item and every preposition has a
     drawing, so a sentence can be shown as a row of images with no
     text at all. Text is the optional layer on top, not the base.
     ============================================================ */
  function icon(kind, value, opts) {
    opts = opts || {};
    var S = opts.size || 56;
    var body = ICON[kind] && ICON[kind](value);
    if (!body) return '';
    return '<svg class="gv-icon" viewBox="0 0 48 48" width="' + S + '" height="' + S +
           '" role="img" aria-label="' + (opts.label || value) + '">' + body + '</svg>';
  }

  /* small stand-ins, drawn in a 48x48 box */
  function iBox(x, y, w, h, open) {
    return R(x, y + 5, w, h - 5, 2, '#c89a5e') +
      (open ? R(x, y, w * 0.38, 6, 1, '#b3873f') + R(x + w * 0.62, y, w * 0.38, 6, 1, '#b3873f')
            : R(x, y, w, 6, 1, '#b3873f'));
  }
  function iBar(x, y, w) {   /* a surface on legs */
    return R(x, y, w, 4, 1, '#a9723f') + R(x + 2, y + 4, 3, 12, 0, '#8a5b30') +
           R(x + w - 5, y + 4, 3, 12, 0, '#8a5b30');
  }
  /* The figure carries a dark rim. Without it an orange ball on a brown box
     is one silhouette at icon size — "in" and "behind" both read as just a
     box, which is the opposite of what they are meant to show. */
  function iDot(cx, cy, r, f) {
    return CIR(cx, cy, r || 6, f || '#e08a2e') +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r || 6) +
      '" fill="none" stroke="#8a5b30" stroke-width="1.5"/>';
  }


  /* ---- people, drawn small ---------------------------------
     A pronoun is not a word to be defined, it is a picture of who
     is being talked about: one person, many people, the speaker,
     the listener. These are the glyphs those pictures are made of.
     ---------------------------------------------------------- */
  function iPerson(cx, cy, sc, shirt, hair) {
    sc = sc || 1;
    var head = 5 * sc, hy = cy - 9 * sc;
    return '<g>' +
      CIR(cx, hy, head, '#d9a06a') +
      (hair === 'long'
        ? '<path d="M' + (cx - head - 1) + ' ' + hy + ' a' + (head + 1) + ' ' + (head + 1) +
          ' 0 0 1 ' + (2 * head + 2) + ' 0 v' + (5 * sc) + ' h-' + (2 * head + 2) + ' z" fill="#3a2a1c"/>' +
          CIR(cx, hy, head, '#d9a06a')
        : '<path d="M' + (cx - head) + ' ' + (hy - 1) + ' a' + head + ' ' + head +
          ' 0 0 1 ' + (2 * head) + ' 0 z" fill="#3a2a1c"/>') +
      '<path d="M' + (cx - 6 * sc) + ' ' + (cy + 11 * sc) +
        ' v-' + (7 * sc) + ' a' + (6 * sc) + ' ' + (6 * sc) + ' 0 0 1 ' + (12 * sc) + ' 0 v' + (7 * sc) + ' z" fill="' +
        (shirt || '#3d6fa8') + '"/>' +
      '</g>';
  }
  function iRing(x, y, w, h, dashed) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="6" fill="none" stroke="var(--accent)" stroke-width="2.5"' +
      (dashed ? ' stroke-dasharray="5 4"' : '') + '/>';
  }
  function iArrow(x1, y1, x2, y2) {
    return '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 +
      '" stroke="var(--r-rel)" stroke-width="2.5" marker-end="url(#ia)" fill="none"/>';
  }
  var IA_DEF = '<defs><marker id="ia" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" ' +
    'markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--r-rel)"/>' +
    '</marker></defs>';

  var ICON = {

    /* who is being talked about */
    pronoun: function (v) {
      switch (v) {
        case 'I':    return iPerson(24, 26, 1.5) + iRing(13, 6, 22, 38, false);
        case 'we':   return iPerson(15, 28, 1.1) + iPerson(33, 28, 1.1, '#a8447a', 'long') +
                            iRing(4, 10, 40, 32, false);
        case 'you':  return IA_DEF + iPerson(30, 26, 1.5) + iArrow(6, 24, 18, 24);
        case 'he':   return iPerson(24, 26, 1.5, '#3d6fa8');
        case 'she':  return iPerson(24, 26, 1.5, '#a8447a', 'long');
        case 'it':   return R(13, 16, 22, 20, 3, '#c89a5e') + R(13, 12, 22, 5, 1, '#b3873f');
        case 'they': return iPerson(12, 28, 1.0) + iPerson(24, 28, 1.0, '#a8447a', 'long') +
                            iPerson(36, 28, 1.0, '#3f8f5a');
        default:     return '';
      }
    },

    /* what a noun can be */
    noun: function (v) {
      if (v === 'person') return iPerson(24, 26, 1.5);
      if (v === 'place')  return '<path d="M8 24 L24 12 L40 24 z" fill="#8d4a3c"/>' +
                                 R(12, 24, 24, 14, 2, '#c08260') + R(21, 30, 7, 8, 1, '#8a5b30');
      if (v === 'thing')  return CIR(24, 26, 12, '#e08a2e') +
                                 '<path d="M12 26h24" stroke="rgba(0,0,0,.25)" stroke-width="2.5" fill="none"/>';
      if (v === 'animal') return '<g transform="translate(3,10) scale(0.38)">' + PROPS.cat.draw('') + '</g>';
      return '';
    },

    /* which one — the same three things, ringed differently */
    article: function (v) {
      var three = CIR(11, 30, 7, '#e08a2e') + CIR(24, 30, 7, '#e08a2e') + CIR(37, 30, 7, '#e08a2e');
      if (v === 'the') return three + iRing(15, 21, 18, 18, false);
      if (v === 'a')   return three + iRing(15, 21, 18, 18, true);
      if (v === 'an')  return three + iRing(15, 21, 18, 18, true) +
        T(24, 14, 'a e i o u', { s: 7, w: 700, f: 'var(--accent)' });
      return three;
    },
    /* things the learner can point at */
    thing: function (v) {
      var p = PROPS[v];
      if (!p) return '';
      var sc = 40 / Math.max(p.box.w, p.box.h);
      var dx = (48 - p.box.w * sc) / 2, dy = (48 - p.box.h * sc) / 2;
      return '<g transform="translate(' + dx.toFixed(1) + ',' + dy.toFixed(1) +
             ') scale(' + sc.toFixed(3) + ')">' + p.draw('') + '</g>';
    },

    /* the relation itself, as a picture — this is the whole point.

       One ground, one figure, one size, in every one of them: the ground is
       24 wide and the ball is r6, so reading down a column of these the only
       thing that changes is the relation itself. It used to be a 28-wide bar
       here, a 22-wide box there and a 18-wide one below, which made the
       column look like it was drawn by three people.

       `behind` and `beside` also had to be told apart from `in front of` and
       `near` in icons-extra: all four were a box with a ball next to it.
       They are separated by what actually differs — occlusion for the
       front/back pair, contact versus a measured gap for the other. */
    prep: function (v) {
      var g = 'var(--muted)';
      switch (v) {
        case 'in':     return iBox(12, 10, 24, 26, true) + iDot(24, 26, 6);
        case 'on':     return iBar(12, 22, 24) + iDot(24, 16, 6);
        case 'under':  return iBar(12, 16, 24) + iDot(24, 34, 6);
        case 'above':  return iBar(12, 32, 24) + iDot(24, 12, 6) +
                              LN(24, 19, 24, 29, { c: g, w: 1.5, d: '3 3' });
        /* the ball goes down FIRST, so the box covers its lower half — and
           the hidden half is outlined, which is the whole difference from
           "in front of", where nothing is hidden */
        case 'behind': return iDot(24, 20, 6) +
                              '<path d="M18 20 a6 6 0 0 0 12 0" fill="none" ' +
                                'stroke="' + g + '" stroke-width="1.2" stroke-dasharray="2 2"/>' +
                              R(12, 20, 24, 18, 2, '#c89a5e');
        /* touching, on one baseline: no gap to measure, which is what tells
           it from "near" */
        case 'beside': return R(8, 20, 24, 18, 2, '#c89a5e') + iDot(38, 32, 6);
        default:       return '';
      }
    },

    /* how many — count, not a numeral */
    num: function (v) {
      var n = Number(v), out = '', xs = n === 1 ? [24] : n === 2 ? [16, 32] : [12, 24, 36];
      xs.forEach(function (x) { out += iDot(x, 24, 7); });
      return out;
    },

    /* which one — solid ring = the one we know, dashed = any one */
    det: function (v) {
      var ring = v === 'a'
        ? '<rect x="6" y="6" width="36" height="36" rx="9" fill="none" stroke="var(--accent)" ' +
          'stroke-width="3" stroke-dasharray="6 5"/>'
        : '<rect x="6" y="6" width="36" height="36" rx="9" fill="none" stroke="var(--accent)" ' +
          'stroke-width="3"/>';
      return ring + iDot(24, 24, 8);
    },

    /* what it is like — colour and size shown, never named */
    adj: function (v) {
      if (v === 'red')   return iDot(24, 24, 14, '#d2452f');
      if (v === 'green') return iDot(24, 24, 14, '#3f8f5a');
      if (v === 'big')   return iDot(24, 24, 17);
      if (v === 'small') return iDot(24, 24, 7);
      return iDot(24, 24, 12, 'var(--line-strong)');
    }
  };


  /* ============================================================
     picture words — the sentence as a row of images.

     Returns data, not markup, so the lesson page and the Tamil-first
     page render it the same way from one definition. `step` controls
     how much text is layered on top: 1 pictures only, 2 + Tamil,
     3 + pronunciation, 4 + English.
     ============================================================ */
  var PREP_TA = { 'in':'உள்ளே', on:'மீது', under:'கீழே',
                  above:'மேலே', behind:'பின்னால்', beside:'அருகில்' };

  function picWords(st) {
    var f = PROPS[st.figure], g = PROPS[st.ground];
    var plural = st.num > 1;
    return [
      { role:'det', node:null, size:44,
        icon: icon('det', st.det, { size:44 }),
        ta: plural ? NUM_TA[st.num] : (st.det === 'a' ? 'ஒரு' : 'அந்த'),
        en: plural ? String(st.num) : st.det },
      { role:'figure', node:'figure-0',
        icon: icon('thing', st.figure, { size:44 }),
        ta: plural ? f.word.ta.pl : f.word.ta.nom,
        en: plural ? f.word.en.p : f.word.en.s },
      { role:'be', node:null, glyph:'=',
        ta:'உள்ளது', en: plural ? 'are' : 'is' },
      { role:'rel', node:null,
        icon: icon('prep', st.prep, { size:44 }),
        ta: PREP_TA[st.prep], en: st.prep },
      { role:'ground', node:'ground',
        icon: icon('thing', st.ground, { size:44 }),
        ta: g.word.ta.nom, en: 'the ' + g.word.en.s }
    ];
  }

  function picSentenceHtml(st, step) {
    return picWords(st).map(function (c) {
      return '<div class="picword" data-role="' + c.role + '"' +
        (c.node ? ' data-node="' + c.node + '"' : '') + ' tabindex="0">' +
        (c.icon || '<span class="be-glyph">' + c.glyph + '</span>') +
        (step >= 2 ? '<span class="cap" lang="ta">' + c.ta + '</span>' : '') +
        (step >= 3 ? '<span class="cap-tr" lang="ta">' +
            String(c.en).split(' ').map(translit).join(' ') + '</span>' : '') +
        (step >= 4 ? '<span class="cap-en">' + c.en + '</span>' : '') +
        '</div>';
    }).join('');
  }

  /* ============================================================
     place renderer
     ============================================================ */
  function layoutPlace(st) {
    var g = PROPS[st.ground], f = PROPS[st.figure];
    var adj = ADJ[st.adj] || null;
    var scale = adj ? adj.scale : 1;
    var fw = f.box.w * scale, fh = f.box.h * scale;
    var gx = (W - g.box.w) / 2, gy = FLOOR - g.box.h, gcx = gx + g.box.w / 2;
    var n = st.num, gap = 14, spots = [], behind = false;
    /* Extras a particular relation needs: a second ground, a measured drop, a
       measured gap. Null for the relations that need none. */
    var second = null, drop = null, span = null, level = null, firstScale = 1;

    function row(baseY, sc) {
      sc = sc || 1;
      var w2 = fw * sc, total = n * w2 + (n - 1) * gap, x0 = gcx - total / 2, out = [];
      for (var i = 0; i < n; i++) out.push({ x: x0 + i * (w2 + gap), y: baseY - fh * sc, s: scale * sc });
      return out;
    }

    switch (st.prep) {
      case 'on':
        spots = row(gy + (g.surfaceY === null ? 20 : g.surfaceY));
        break;
      case 'under':
        spots = row(FLOOR - 4, Math.min(1, (FLOOR - gy - (g.surfaceY || 0) - 12) / fh));
        break;
      case 'in': {
        var b = g.inside || [g.box.w * 0.2, g.box.h * 0.3, g.box.w * 0.6, g.box.h * 0.5];
        var fit = Math.min(1, (b[2] - (n - 1) * gap) / (n * fw), b[3] / fh);
        var w3 = fw * fit, t3 = n * w3 + (n - 1) * gap;
        var x3 = gx + b[0] + b[2] / 2 - t3 / 2, cy = gy + b[1] + b[3] / 2;
        for (var j = 0; j < n; j++) {
          spots.push({ x: x3 + j * (w3 + gap), y: cy - fh * fit / 2, s: scale * fit });
        }
        break;
      }
      case 'beside':
        for (var k = 0; k < n; k++) {
          spots.push({ x: gx + g.box.w + 26 + k * (fw + gap), y: FLOOR - fh, s: scale });
        }
        break;
      /* behind — the depth cue is occlusion, so the figure has to be where
         there is something to hide it. At the leg height of a table there is
         nothing, and the picture came out identical to under; sitting it at
         the ground's own top edge means the solid part covers its lower half
         and only the top shows. */
      case 'behind':
        behind = true;
        spots = row(gy + (g.surfaceY || 0) + fh * 0.55, 0.8);
        break;
      case 'above':
        spots = row(Math.max(gy - 36, fh + 14));
        break;

      /* at — present at the place, not offset from it. The figure stands on
         the ground's own footprint, overlapping its base, which is what
         separates it from beside (clear of it) and near (clear of it, further).
         Drawn after the ground so it reads as standing at the front of it. */
      case 'at':
        spots = row(FLOOR + 10, 1);
        /* On the ground's edge, half on and half off. Centred under it the
           picture was "under" again; the edge is what makes it a point. */
        for (var a = 0; a < spots.length; a++) {
          spots[a].x = gx - fw / 2 + a * (fw + gap);
        }
        break;

      /* below — lower than a level, which is not the same as under. under puts
         the figure beneath the ground's own body; below only says further down,
         and the source's own example is a temperature below zero — a level,
         not a shelter.

         Lifting the ground into the air to make room was tried and reads as a
         floating table. The ground stays put; its top becomes the level, drawn
         out as a dashed rule, and the figure sits clear of the ground and
         plainly under that line. */
      case 'below':
        for (var bl = 0; bl < n; bl++) {
          spots.push({ x: gx + g.box.w + 92 + bl * (fw + gap), y: FLOOR - fh, s: scale });
        }
        level = { y: gy, x0: gx, x1: gx + g.box.w + 92 + n * (fw + gap) + 20 };
        drop = { x: gx + g.box.w + 92 + fw / 2, y0: gy + 4, y1: FLOOR - fh - 12 };
        break;

      /* in front of — the mirror of behind. Nearer means lower and larger, and
         it overlaps the ground's body rather than clearing it, or the picture
         is beside again. */
      case 'in front of':
        spots = row(FLOOR + 6, 1.25);
        break;

      /* near — beside, further away, with the distance shown. Two ticks and a
         rule rather than a word, so it needs no language. */
      case 'near':
        for (var m = 0; m < n; m++) {
          spots.push({ x: gx + g.box.w + 130 + m * (fw + gap), y: FLOOR - fh, s: scale });
        }
        span = { x0: gx + g.box.w + 14, x1: gx + g.box.w + 118, y: FLOOR - 30 };
        break;

      /* between — two grounds with the figure in the space they leave. Both
         are pushed to the edges and scaled down so the gap is wide enough to
         read as a gap rather than as a crowd. */
      case 'between': {
        var g2 = PROPS[st.ground2] || PROPS[st.ground === 'box' ? 'chair' : 'box'];
        var need = n * fw + (n - 1) * gap + 90;
        var side = Math.min(210, (W - need - 80) / 2);
        /* One scale for both, not one each: sized independently a 150-wide
           chair filled its half at 1.0 while a 300-wide table shrank to 0.7,
           and a chair taller than a table is a different picture. */
        var fit = Math.min(1, side / Math.max(g.box.w, g2.box.w));
        var s1 = fit, s2 = fit;
        gx = 46;
        gy = FLOOR - g.box.h * s1;
        second = { prop: g2, x: W - 46 - g2.box.w * s2, y: FLOOR - g2.box.h * s2, s: s2 };
        firstScale = s1;
        var tot = n * fw + (n - 1) * gap;
        for (var q = 0; q < n; q++) {
          spots.push({ x: W / 2 - tot / 2 + q * (fw + gap), y: FLOOR - fh, s: scale });
        }
        break;
      }

      default:
        spots = row(gy + (g.surfaceY || 0));
    }
    return { gx: gx, gy: gy, spots: spots, behind: behind, firstScale: firstScale,
             second: second, drop: drop, span: span, level: level };
  }

  function renderPlace(st) {
    var L = layoutPlace(st);
    var g = PROPS[st.ground], f = PROPS[st.figure];
    var adj = ADJ[st.adj] || null;
    var fill = adj && adj.colour ? adj.colour : '';
    var indefinite = st.det === 'a' && st.num === 1;

    var figs = L.spots.map(function (p, i) {
      return '<g transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) +
        ') scale(' + p.s.toFixed(3) + ')" data-node="figure-' + i + '">' + f.draw(fill) +
        (indefinite
          ? '<rect x="-9" y="-9" width="' + (f.box.w + 18) + '" height="' + (f.box.h + 18) +
            '" rx="12" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="9 7"/>'
          : '') +
        '</g>';
    }).join('');

    var ground = '<g transform="translate(' + L.gx + ',' + L.gy + ')' +
      (L.firstScale !== 1 ? ' scale(' + L.firstScale.toFixed(3) + ')' : '') +
      '" data-node="ground">' + g.draw('') + '</g>';

    /* "between" has two of them, and the second is as much the ground as the
       first — same node name so lighting the word lights both. */
    if (L.second) {
      ground += '<g transform="translate(' + L.second.x.toFixed(1) + ',' +
        L.second.y.toFixed(1) + ') scale(' + (L.second.s || 1).toFixed(3) +
        ')" data-node="ground">' + L.second.prop.draw('') + '</g>';
    }

    /* The measurements that carry the meaning. `below` is only "lower than",
       so the drop between the two is the relation; `near` is only "close to",
       so the gap is. Drawn rather than captioned — the point of the page. */
    /* The measurement IS the relation for below and near, so it is drawn and
       never captioned. Words in the artwork were English words in a picture
       whose whole job is to work without any. */
    function tick(x, y, half) {
      return LN(x, y - half, x, y + half, { c: 'var(--r-rel)', w: 3 });
    }
    var marks = '';
    if (L.level) {
      marks += LN(L.level.x0, L.level.y, L.level.x1, L.level.y,
                  { c: 'var(--r-rel)', w: 2.5, d: '7 6' });
    }
    if (L.drop) {
      marks += LN(L.drop.x, L.drop.y0, L.drop.x, L.drop.y1,
                  { c: 'var(--r-rel)', w: 3, d: '9 7' }) +
        LN(L.drop.x - 11, L.drop.y0, L.drop.x + 11, L.drop.y0, { c: 'var(--r-rel)', w: 3 }) +
        LN(L.drop.x - 11, L.drop.y1, L.drop.x + 11, L.drop.y1, { c: 'var(--r-rel)', w: 3 }) +
        '<path d="M' + (L.drop.x - 7) + ' ' + (L.drop.y1 - 16) + ' L' + L.drop.x + ' ' +
          (L.drop.y1 - 4) + ' L' + (L.drop.x + 7) + ' ' + (L.drop.y1 - 16) +
          ' z" fill="var(--r-rel)"/>';
    }
    if (L.span) {
      marks += LN(L.span.x0, L.span.y, L.span.x1, L.span.y, { c: 'var(--r-rel)', w: 3 }) +
        tick(L.span.x0, L.span.y, 11) + tick(L.span.x1, L.span.y, 11);
    }

    /* Draw order is the depth cue: behind goes under the ground, everything
       else over it. */
    return floorLine() + shadow(360, g.box.w) + marks +
      (L.behind ? figs + ground : ground + figs);
  }

  /* ============================================================
     timeline renderer — tenses and prepositions of time
     ============================================================ */
  var TL = 230, TL0 = 60, TL1 = 660, NOW = 360;

  function renderTimeline(st) {
    var out = LN(TL0, TL, TL1, TL, { c: 'var(--line)', w: 4 }) +
      T(TL0, TL + 42, 'past', { s: 12, a: 'start' }) +
      T(TL1, TL + 42, 'future', { s: 12, a: 'end' }) +
      LN(NOW, TL - 14, NOW, TL + 14, { c: 'var(--muted)', w: 2 }) +
      T(NOW, TL + 32, 'now', { s: 11, w: 700 });

    var x = st.time === 'past' ? 190 : st.time === 'future' ? 540 : NOW;

    if (st.aspect === 'continuous' || st.aspect === 'perfect-continuous') {
      out += R(x - 90, TL - 24, 180, 48, 8, 'var(--accent-soft)',
        ' stroke="var(--accent)" stroke-width="2.5"') +
        T(x, TL - 38, 'going on across this stretch', { s: 13, w: 700, f: 'var(--accent)' });
    }
    if (st.aspect === 'perfect' || st.aspect === 'perfect-continuous') {
      out += LN(x + 96, TL - 46, x + 96, TL + 20, { c: 'var(--warn)', w: 3.5 }) +
        T(x + 96, TL - 56, 'finished by here', { s: 13, w: 700, f: 'var(--warn)' });
    }
    out += CIR(x, TL, 12, 'var(--accent)');
    if (st.aspect === 'simple') {
      out += T(x, TL + 66, 'one point', { s: 13, w: 600, f: 'var(--ink)' });
    }
    return out;
  }

  /* ============================================================
     sentence builder — english and tamil, ordered independently
     ============================================================ */
  function an(word) { return 'aeiou'.indexOf(word.charAt(0)) > -1 ? 'an' : 'a'; }

  /* The one word that carries tense in a place sentence. English changes the
     verb; Tamil changes its ending, and the past and future forms are the ones
     the notes give for the be-form (இருக்கிறேன் · இருந்தது · இருக்கும்).

     st.tense is optional and defaults to present, so every caller that does not
     know about tense keeps the sentence it had. */
  var NUM_EN = { 1: 'one', 2: 'two', 3: 'three' };

  var BE_EN = {
    present: { s: 'is',      p: 'are' },
    past:    { s: 'was',     p: 'were' },
    future:  { s: 'will be', p: 'will be' }
  };
  var BE_TA = {
    present: { s: 'உள்ளது',   p: 'உள்ளன' },
    past:    { s: 'இருந்தது', p: 'இருந்தன' },
    future:  { s: 'இருக்கும்', p: 'இருக்கும்' }
  };

  function sentencePlace(st) {
    var f = PROPS[st.figure], g = PROPS[st.ground];
    var prepDef = PREPS[st.prep] || {};
    var g2 = prepDef.two ? (PROPS[st.ground2] ||
             PROPS[st.ground === 'box' ? 'chair' : 'box']) : null;
    var adj = ADJ[st.adj] || null;
    var plural = st.num > 1;

    /* --- english: det adj figure be prep the ground [and the other] --- */
    /* The number is a word, not a numeral. Tamil already said மூன்று while
       English said "3", so one sentence was counting in two notations — and
       the resolver reads "three" but not "3", which made the sentence the page
       showed one it could not read back. */
    var det = plural ? (NUM_EN[st.num] || String(st.num))
            : st.det === 'a' ? an(st.adj || f.word.en.s)
            : 'the';
    var be = BE_EN[st.tense || 'present'][plural ? 'p' : 's'];
    var en = [
      { t: det.charAt(0).toUpperCase() + det.slice(1), k: plural ? 'num' : 'det' }
    ];
    if (st.adj) en.push({ t: st.adj, k: 'adj' });
    en.push({ t: plural ? f.word.en.p : f.word.en.s, k: 'figure' });
    en.push({ t: be, k: null });
    en.push({ t: st.prep, k: 'prep' });
    en.push({ t: 'the', k: null });
    en.push({ t: g.word.en.s, k: 'ground' });
    /* "between" takes two grounds, and a sentence naming one of them is not
       the relation it claims to be. */
    if (prepDef.two && g2) {
      en.push({ t: 'and', k: null });
      en.push({ t: 'the', k: null });
      en.push({ t: g2.word.en.s, k: 'ground' });
    }

    /* --- tamil: [det] [adj] figure  ground+postposition  be ---
       Tamil has no article, so `the` becomes அந்த and `a` becomes
       ஒரு — exactly the gloss the source notes use. The ground
       takes a case suffix chosen by the preposition; there is no
       separate Tamil word for "in".                              */
    var prep = PREPS[st.prep];
    /* Two grounds join the way the notes join them: the first plain, மற்றும்,
       then the second in the case the postposition asks for —
       "பள்ளி மற்றும் மருத்துவமனைக்கு நடுவில்". */
    var groundTa = prep.two && g2
      ? g.word.ta.nom + ' மற்றும் ' + g2.word.ta[prep.ta.case] +
        (prep.ta.post ? ' ' + prep.ta.post : '')
      : g.word.ta[prep.ta.case] + (prep.ta.post ? ' ' + prep.ta.post : '');
    var ta = [];
    if (plural) ta.push({ t: NUM_TA[st.num], k: 'num' });
    else if (st.det === 'a') ta.push({ t: 'ஒரு', k: 'det' });
    else ta.push({ t: 'அந்த', k: 'det' });
    if (st.adj) ta.push({ t: ADJ[st.adj].ta, k: 'adj' });
    ta.push({ t: plural ? f.word.ta.pl : f.word.ta.nom, k: 'figure' });
    ta.push({ t: groundTa, k: 'prep' });
    ta.push({ t: BE_TA[st.tense || 'present'][plural ? 'p' : 's'], k: null });

    return { en: en, ta: ta };
  }

  /* Which preposition/ground pairs are actually drawable. The app surfaces this
     by disabling the impossible option rather than drawing a wrong picture —
     not every combination of words describes a situation that exists. */
  function allows(prep, groundId) {
    var g = PROPS[groundId];
    if (!g) return false;
    if (prep === 'in') return !!g.inside;
    if (prep === 'under') return !!g.clearance;
    return true;
  }

  /* Icon families can be added from another file so this one does not
     balloon. Same 48x48 box, same contract: return SVG body for a value. */
  /* Returns the family it replaced, so an extension can fall through to it
     rather than having to restate everything the original drew. */
  function registerIcon(kind, fn) { var prev = ICON[kind]; ICON[kind] = fn; return prev; }

  window.GV_Scene = {
    kit: { R: R, CIR: CIR, T: T, LN: LN },
    registerIcon: registerIcon,
    PROPS: PROPS,
    PREPS: PREPS,
    allows: allows,
    renderPlace: renderPlace,
    icon: icon,
    picWords: picWords,
    picSentenceHtml: picSentenceHtml,
    PREP_TA: PREP_TA,
    TRANSLIT: TRANSLIT,
    canTranslit: canTranslit,
    translit: translit,
    renderTimeline: renderTimeline,
    sentencePlace: sentencePlace,
    viewBox: '0 0 ' + W + ' ' + H
  };
})();
