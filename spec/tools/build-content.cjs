/* ============================================================
   build-content.cjs — writes the generated half of src/content/.

   The curriculum was extracted from the Spoken English source
   notes once, into ui-prototypes/assets/js/content.js, and
   verified against the source by spec/tools/verify-curriculum.cjs. It
   is not retyped here: this script reads that file and writes

       src/content/topics.json      the ten topics
       src/content/curriculum.json  the source tables, the lesson
                                    lists and the corrections

   Run it after any change to content.js:

       node spec/tools/build-content.cjs

   The authored half — lessons/, lexicon/ — is written by hand
   and this script never touches it.

   `.cjs` because package.json says "type": "module" and every
   tool in this folder is CommonJS.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const SPEC = path.join(__dirname, '..');
const OUT = path.join(SPEC, '..', 'src', 'content');

global.window = global;
eval(fs.readFileSync(path.join(SPEC, 'ui-prototypes/assets/js/content.js'), 'utf8'));
const C = global.GV_CONTENT;

/* Which lessons exist as authored, drawable lessons rather than as rows in a
   table. Everything else is curriculum the reference and topic pages show,
   and its topic carries no lessonIds until someone writes them. */
const authored = {};
const lessonsDir = path.join(OUT, 'lessons');
if (fs.existsSync(lessonsDir)) {
  for (const file of fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.json'))) {
    for (const lesson of JSON.parse(fs.readFileSync(path.join(lessonsDir, file), 'utf8'))) {
      (authored[lesson.topicId] = authored[lesson.topicId] || []).push({
        id: lesson.id,
        order: lesson.order,
      });
    }
  }
}

const topics = C.topics.map((t) => ({
  id: t.id,
  order: t.n,
  title: { en: t.en, ta: t.ta },
  summary: { en: t.sum_en, ta: t.sum_ta },
  lessonIds: (authored[t.id] || []).sort((a, b) => a.order - b.order).map((l) => l.id),
}));

/* The curriculum as the reference and topic pages need it: every group, every
   lesson row, every source table, and the corrections. Bilingual throughout,
   exactly as the source has it. */
const curriculum = {
  topics: C.topics.map((t) => ({
    id: t.id,
    groups: t.groups.map((g) => ({
      en: g.en,
      ta: g.ta || '',
      lessons: g.lessons.map((l) => ({
        en: l.en,
        ta: l.ta || '',
        ex: l.ex || '',
        exTa: l.exTa || '',
        authored: l.authored || [],
      })),
    })),
  })),
  tables: C.tables.map((t) => ({
    id: t.id,
    topic: t.topic,
    en: t.en,
    ta: t.ta || '',
    cols: t.cols,
    rows: t.rows,
  })),
  corrections: C.corrections,
};

fs.mkdirSync(OUT, { recursive: true });
write('topics.json', topics);
write('curriculum.json', curriculum);

function write(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`${name} — ${JSON.stringify(data).length} bytes`);
}

const withLessons = topics.filter((t) => t.lessonIds.length > 0);
console.log(
  `${topics.length} topics, ${withLessons.length} with authored lessons ` +
    `(${withLessons.map((t) => `${t.id}:${t.lessonIds.length}`).join(', ') || 'none'}), ` +
    `${curriculum.tables.length} source tables, ${curriculum.corrections.length} corrections`,
);
