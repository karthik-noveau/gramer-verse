/* ============================================================
   build-curriculum.cjs — writes spec/curriculum.md.

   The curriculum lives in one place: ui-prototypes/assets/js/
   content.js, generated from the Spoken English source notes.
   curriculum.md is that same data as a document, for reading and
   reviewing rather than running.

   It is GENERATED. Editing curriculum.md by hand puts the document
   and the app out of step, which is the exact failure this file
   exists to prevent — the prototype has already shipped a heading
   that said "Ten topics" over a Tamil line that said nine, because
   one number was typed twice.

       node spec/tools/build-curriculum.cjs

   Run it after any change to content.js.

   `.cjs` because package.json says "type": "module" and every
   tool in this folder is CommonJS.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
global.window = global;
eval(fs.readFileSync(path.join(ROOT, 'ui-prototypes/assets/js/content.js'), 'utf8'));
const C = global.GV_CONTENT;

const out = [];
const w = (s = '') => out.push(s);

/* A markdown table cell cannot hold a raw pipe or a line break. */
const cell = (v) =>
  String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\n+/g, ' · ').trim() || '—';

const lessons = C.topics.reduce((n, t) => n + t.count, 0);
const authored = C.topics.reduce((n, t) => n + t.groups.reduce((m, g) =>
  m + g.lessons.filter((l) => l.authored).length, 0), 0);
const rows = C.tables.reduce((n, t) => n + t.rows.length, 0);

w('# Curriculum');
w();
w('> **Generated — do not edit.** Run `node spec/tools/build-curriculum.cjs` after any');
w('> change to `ui-prototypes/assets/js/content.js`, which is the single source.');
w('> That file was itself generated from the *Spoken English* source notes rather');
w('> than retyped, so the Tamil is exactly as written there.');
w();
w(`**${C.topics.length} topics · ${lessons} lessons · ${C.tables.length} source tables ` +
  `· ${rows} table rows · ${C.corrections.length} corrections to the source ` +
  `· ${authored} lessons carrying a field not in the notes**`);
w();
w('Every lesson field is bilingual. Missing Tamil labels and shifted table rows');
w('are rejected by content validation before they can reach a learner.');
w();
w('**¹ marks a field the notes do not contain.** Everything else is verified');
w('present in the source document, whole or as the parts of a joined cell. The');
w('marked fields are written for this app because the topic needs an example and');
w('the notes give none: the twelve tense tables name the tenses without');
w('illustrating them, the pronoun grid lists forms without sentences, and');
w('`a → the` is a rule the notes never state. They are correct, but they are ours.');
w();
w('---');
w();

/* ---- contents ---- */
w('## Topics');
w();
w('| # | Topic | தமிழ் | Lessons | Groups |');
w('|---|---|---|---|---|');
C.topics.forEach((t) => {
  w(`| ${t.n} | [${t.en}](#${t.n}-${t.en.toLowerCase().replace(/[^a-z]+/g, '-')}) ` +
    `| ${cell(t.ta)} | ${t.count} | ${t.groups.map((g) => `${g.en} (${g.lessons.length})`).join(', ')} |`);
});
w();
w('---');
w();

/* ---- the lessons ---- */
w('## Lessons');
w();
C.topics.forEach((t) => {
  w(`### ${t.n} · ${t.en}`);
  w();
  w(`**${cell(t.ta)}** — ${t.sum_en} <span lang="ta">${t.sum_ta}</span>`);
  w();
  w(`${t.count} lessons in ${t.groups.length} group${t.groups.length === 1 ? '' : 's'}.`);
  w();
  t.groups.forEach((g) => {
    if (t.groups.length > 1 || g.en !== t.en) {
      w(`#### ${g.en}${g.ta ? ` · ${g.ta}` : ''}`);
      w();
    }
    w('| # | Word / form | தமிழ் | Example | தமிழ் example |');
    w('|---|---|---|---|---|');
    g.lessons.forEach((l, i) => {
      /* A field the notes do not contain is marked where it sits. The port is
         "generated from the source, not retyped" everywhere else, and the one
         place that is not true has to be visible rather than implied. */
      const a = l.authored || [];
      const m = (f, v) => cell(v) + (a.indexOf(f) > -1 ? ' ¹' : '');
      w(`| ${i + 1} | **${m('en', l.en)}** | ${m('ta', l.ta)} | ${m('ex', l.ex)} | ${m('exTa', l.exTa)} |`);
    });
    w();
  });
});
w('---');
w();

/* ---- the source tables ---- */
w('## Source tables');
w();
w('The tables as they appear in the notes, after the corrections listed below.');
w('These are what the reference page renders and what the topic pages show above');
w('their lessons.');
w();
C.tables.forEach((t) => {
  const topic = C.topics.find((x) => x.id === t.topic);
  /* Rows can be wider than the header — the Tamil example column often has no
     heading of its own. Widen to the widest row so no cell is dropped. */
  let width = t.cols.length;
  t.rows.forEach((r) => { if (r.length > width) width = r.length; });
  const cols = [];
  for (let c = 0; c < width; c++) {
    cols.push(t.cols[c] !== undefined && String(t.cols[c]).trim()
      ? t.cols[c] : (c === width - 1 ? 'Tamil example' : '—'));
  }
  w(`### ${t.en}${t.ta ? ` · ${t.ta}` : ''}`);
  w();
  w(`\`${t.id}\` — ${topic ? topic.en : t.topic} · ${t.rows.length} rows`);
  w();
  w(`| ${cols.map(cell).join(' | ')} |`);
  w(`|${cols.map(() => '---').join('|')}|`);
  t.rows.forEach((r) => {
    const c = [];
    for (let i = 0; i < width; i++) c.push(cell(r[i]));
    w(`| ${c.join(' | ')} |`);
  });
  w();
});
w('---');
w();

/* ---- corrections ---- */
w('## Corrections to the source');
w();
w('The notes contain errors. The app teaches the correct form and says where it');
w('departed — these are rendered at the foot of the reference page. Corrections are');
w('applied to the rows themselves, not only logged: the formation diagram draws');
w('whatever sentence its row carries, so an uncorrected row would be a diagram of');
w('the mistake.');
w();
w('| # | Where | The notes say | The app teaches |');
w('|---|---|---|---|');
C.corrections.forEach((c, i) => {
  w(`| ${i + 1} | ${cell(c.where)} | ${cell(c.was)} | ${cell(c.now)} |`);
});
w();

fs.writeFileSync(path.join(ROOT, 'curriculum.md'), out.join('\n') + '\n');
console.log(`curriculum.md — ${C.topics.length} topics, ${lessons} lessons, ` +
            `${C.tables.length} tables, ${rows} rows, ${C.corrections.length} corrections`);
