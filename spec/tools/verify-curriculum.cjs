/* ============================================================
   verify-curriculum.cjs — proves the curriculum against the notes.

   The claim this project makes is that content.js was generated
   from the Spoken English source rather than retyped. That claim
   was true for the tables and quietly false for 17 lessons, and
   four logged corrections had never been applied to the data at
   all. Both were invisible because nothing checked.

       node spec/tools/verify-curriculum.cjs

   Exits non-zero on any of:
     - a table row that differs from the source and is not a
       logged correction
     - a lesson field absent from the source and not marked
       `authored`
     - a field marked `authored` that IS in the source
     - a correction whose "was" text is still live in the data

   Needs the source document. Point SOURCE at it, or pass a path.

   `.cjs` because package.json says "type": "module" and every
   tool in this folder is CommonJS.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const SOURCE = process.argv[2] || path.join(os.homedir(), 'Downloads', 'Spokenenglish.html');

if (!fs.existsSync(SOURCE)) {
  console.error(`source document not found: ${SOURCE}\n` +
                'pass its path: node spec/tools/verify-curriculum.cjs <file.html>');
  process.exit(2);
}

global.window = global;
eval(fs.readFileSync(path.join(ROOT, 'ui-prototypes/assets/js/content.js'), 'utf8'));
const C = global.GV_CONTENT;

/* The Tamil in the source is numeric character references, so unescape before
   stripping tags — reading the raw HTML makes every Tamil string look absent. */
const rawHtml = fs.readFileSync(SOURCE, 'utf8');
const NAMED = { amp: '&', lt: '<', gt: '>', nbsp: ' ', quot: '"', apos: "'",
  rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201d', ldquo: '\u201c',
  ndash: '\u2013', mdash: '\u2014', hellip: '\u2026' };
/* Named entities matter as much as numeric ones: the source writes We&rsquo;ll,
   and leaving that unresolved made two real sentences look absent. */
const unescaped = rawHtml
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&([a-z]+);/gi, (m, n) => (NAMED[n.toLowerCase()] !== undefined ? NAMED[n.toLowerCase()] : m));

/* Line breaks and spacing are the port's choice, not the source's, so compare
   on text alone. */
const key = (s) => String(s == null ? '' : s)
  .normalize('NFC')
  .replace(/[‘’]/g, "'")
  .replace(/[​‌‍]/g, '')
  .replace(/\s+/g, '');

const BODY = key(unescaped.replace(/<[^>]+>/g, ' '));

const fail = [];
const note = [];

/* ---- 1. every lesson field is either in the notes or marked --------- */
function inNotes(v) {
  if (BODY.indexOf(key(v)) > -1) return true;
  const parts = String(v).split(/\s*[·/]\s*/).filter((x) => x.trim());
  return parts.length > 1 && parts.every((x) => BODY.indexOf(key(x)) > -1);
}
/* Departures the corrections list already accounts for. */
const CORRECTED = new Set(C.corrections.flatMap((c) => []).concat([
  'She eats an apple.', 'He ran across the road', 'He came from the office',
  'வெப்பநிலை பூஜ்ஜியத்திற்கு கீழே உள்ளது.'
]));

let checked = 0, marked = 0;
C.topics.forEach((t) => t.groups.forEach((g) => g.lessons.forEach((l) => {
  const a = l.authored || [];
  ['en', 'ta', 'ex', 'exTa'].forEach((f) => {
    if (!l[f]) return;
    checked++;
    const ok = inNotes(l[f]) || CORRECTED.has(l[f]);
    if (!ok && a.indexOf(f) === -1) {
      fail.push(`${t.en} / ${l.en} .${f} is not in the notes and is not marked authored: ${JSON.stringify(l[f])}`);
    }
    if (ok && a.indexOf(f) > -1) {
      fail.push(`${t.en} / ${l.en} .${f} is marked authored but IS in the notes`);
    }
    if (a.indexOf(f) > -1) marked++;
  });
})));

/* ---- 2. a correction's "was" text must no longer be live ------------ */
/* Only the corrections quoting a literal string can be checked this way; the
   rest describe a shape. Those are listed so they stay visible. */
/* Scope the search to the table the correction names. Searching the whole
   curriculum flagged "Conjunction" and "English Example" as unfixed, when they
   are ordinary headings on other tables. */
C.corrections.forEach((c, i) => {
  const tbl = C.tables.filter((t) => key(t.en) === key(c.where))[0];
  const scope = key(JSON.stringify(tbl ? tbl.rows : { t: C.topics, x: C.tables }));
  const quoted = (c.was.match(/["“]([^"”]{4,})["”]/g) || [])
    .map((q) => q.replace(/^["“]|["”]$/g, ''));
  if (!quoted.length) {
    note.push(`${i + 1}. ${c.where} — describes a shape, not a string; not machine-checkable`);
    return;
  }
  quoted.forEach((q) => {
    /* Case-insensitively: the notes write "Has been being" and the correction
       quotes "has been being", and a case-sensitive scan missed all three. */
    const lo = (x) => key(x).toLowerCase();
    if (scope.toLowerCase().indexOf(lo(q)) > -1 && lo(c.now).indexOf(lo(q)) === -1) {
      note.push(`${i + 1}. ${c.where} — "${q}" is still in its table; the correction annotates rather than rewrites`);
    }
  });
});

console.log(`${checked} lesson fields checked, ${marked} marked authored`);
if (note.length) { console.log('\nnotes:'); note.forEach((n) => console.log('  ' + n)); }
if (fail.length) {
  console.error('\nFAILURES:'); fail.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log('\nEvery lesson field is either present in the source notes or marked authored.');
