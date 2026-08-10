# UI Prototypes

Open [`index.html`](index.html) in a browser. No server, no build step, no npm.

This is the **final approved UI**. React pages must match it. No redesign without
updating the prototype first.

---

## Structure

```text
ui-prototypes/
├── index.html                    branded home screen — no app shell
├── assets/
│   ├── css/
│   │   ├── tokens.css            colour, type, spacing  → theme/colours.css, theme/fonts.css
│   │   ├── base.css              reset, shell, bilingual rules, responsive
│   │   ├── components.css        every reusable component → common/components/
│   │   ├── pages.css             per-page layout        → pages/*/styles.module.css
│   │   └── home.css              the home screen only   → pages/landing/styles.module.css
│   ├── js/
│   │   ├── content.js            the whole curriculum   → src/content/*.json
│   │   ├── tables.js             one source-table renderer → common/components/SourceTable
│   │   ├── shell.js              header, sidebar, footer, mobile nav, overlays
│   │   ├── scene.js              the drawing engine     → common/scene/
│   │   ├── icons-extra.js        vocabulary art the scene does not stage
│   │   ├── art.js                one answer to "does this word have a picture?"
│   │   ├── examples.js           the worked picture set per topic
│   │   ├── formation.js          the word-order diagram, and its alignments
│   │   ├── logo.js               the logo — mark + bilingual wordmark, inlined
│   │   └── theme.js              light / dark
│   ├── icons/
│   │   ├── brand-mark.svg        the mark alone — this is the favicon
│   │   └── brand-lockup.svg      the full logo, both scripts — the record
│   ├── fonts/    images/
├── pages/
│   ├── topics.html               the way in: all ten, plus Practice and Reference
│   ├── topic.html                one topic's lessons  (?topic=prepositions)
│   ├── lesson.html               ← the product
│   ├── visualizer.html           under Prepositions: reading left, drawing and its controls right
│   ├── reference.html            source tables, browsable
│   ├── components.html           every component, every state
│   ├── logo-lab.html             the mark, at every size, and what it replaced
│   ├── theme-lab.html            every token, both schemes, with its ratios
│   ├── 404.html                  not found
│   ├── scenes-catalogue.html     40 drawn articles + prepositions
│   └── scene-demo.html           the original concept demo
└── README.md
```

## Pages and their routes

| Page | Route in the app | What it proves |
|---|---|---|
| `index.html` | `/` | Branded front door: mark, tagline, live picture, the three moves, one way in |
| `topics.html` | `/topics` | **The only index.** Topic cards with counts, plus the two non-topic ways in |
| `topic.html` | `/topics/:topicId` | **The topic's table first**, then its lessons |
| `lesson.html` | `/lessons/:lessonId` | **Predict → reveal → knobs → picture → sentence** |
| `visualizer.html` | `/topics/prepositions/visualizer` | **Pictures in, or text in.** Chips per source table; reading left, the drawing and its controls right; the resolver, and `CannotDraw` as a real screen |
| `reference.html` | `/reference/:tableId` | Source tables, filter, scroll-spy nav |
| `components.html` | — | Component and state gallery for review |
| `404.html` | `*` | Shows the bad path instead of redirecting |
| `theme-lab.html` | — | Every token in both schemes, with its measured contrast |
| `logo-lab.html` | — | The mark at every size, and what it replaced |
| `scenes-catalogue.html` | — | Forty drawn articles and prepositions, static |
| `scene-demo.html` | — | The original concept demo, kept for the record |

Navigation is reachable four ways: header top nav, sidebar (ten topics + tools),
breadcrumbs, and a bottom bar below 900px. The header carries no dropdowns —
the theme toggle is a plain control beside the nav.

---

## Every row shows its word

A source table is a wall of text, and the reader it is written for cannot read
half of it. So each row carries the drawing of the word it teaches, in the row,
beside the word — there is no separate panel to look across at. Rows whose word
has no drawing leave the cell empty rather than filling it with a letter tile,
and a table where most rows would be empty gets no picture column at all.

Rows in **articles, prepositions and nouns & pronouns** also carry a
**formation** button. It opens, directly under that row, a picture of how the
two languages build the same sentence: a line from each English word to the
Tamil word that does its job. Three things fall out of the drawing rather than
having to be asserted —

- the lines cross, because the Tamil verb goes to the end
- two lines land on one Tamil word, because English needs `in` + `the box`
  where Tamil fuses both into `பெட்டியில்`
- some English words have no line, because Tamil has no article

Colour is the word's job, not its language: the same five roles are used here,
in the scene renderer and in the visualizer. The alignment cannot be
derived — nothing in the source says which Tamil word carries `in` — so it is
authored per row in `assets/js/formation.js`, using each row's own sentences.

## The logo

A ball inside a box: the preposition **in**, which is the idea every other
lesson is built on. The gap in the top edge is the ball's own width, so it
reads as the way in rather than as a missing line. Frame in ink so the mark
survives on a green ground; ball in accent, whose one job in this system is to
mark the thing that moved.

The **wordmark carries both languages**, because the product is English taught
in Tamil and a logo in one script tells half the story. Latin leads, since the
subject is English; கிராமர்-வெர்ஸ் sits under it, smaller and muted, because
it is the pronunciation rather than a second name — the same transliteration
bridge the lessons use. A bilingual *mark* was tried first and dropped: Tamil
letterforms carry more detail than a circle, and the mark has to hold at 16px.

Both wordmarks are outlines, not live text. `assets/fonts/README.md` records
that this prototype ships no Tamil webfont and that the system stack degrades
to empty boxes where one is missing — a wordmark that can render as tofu is not
a wordmark. `assets/js/logo.js` is the one definition, inlined so it can follow
the theme; `pages/logo-lab.html` is the record, with what it beat and why.

## What is live, not mocked

`lesson.html` and `visualizer.html` run the real thing:

- **The picture is drawn from state.** Turn a knob and `scene.js` recomputes the
  layout — the ball actually moves into the box. Nothing is a screenshot.
- **Both sentences rebuild.** English reorders by slot; Tamil is built
  independently, because Tamil marks place with a case suffix on the noun rather
  than a separate word. `on the table` is `மேசையின் மீது`, `under the table` is
  `மேசைக்கு கீழே` — same noun, different ending, chosen by the preposition.
  This is the bit that would have been wrong if it had been left to content
  authors, so the prototype proves it.
- **Predict-then-reveal.** Answer wrong and the scene draws *your* answer first,
  then the true one. Answer right and it says so.
- **The resolver really fails.** Type "the dog is behind the rocket" in the visualizer
  and it names `rocket` as undrawable and offers the nearest sentence it can draw.

## Content

The whole curriculum is also written out as a document — every topic, every
lesson, every source table and every correction — in
[`spec/curriculum.md`](../curriculum.md). It is generated from the same file, by
`node spec/tools/build-curriculum.cjs`; re-run that after any content change rather
than editing it.

**Almost all of it, from the source.** `assets/js/content.js` is generated from
the *Spoken English* document rather than retyped, so the Tamil is exactly as
written there — for **536 of 569** lesson fields, verified by
`node spec/tools/verify-curriculum.cjs` against the document itself.

The other **33 fields, across 17 lessons, are written for this app** and are
marked `authored` in the data and `¹` in `curriculum.md`. They exist because the
topic needs an example and the notes give none: the tense tables name the twelve
tenses without illustrating them, the pronoun grid lists forms without
sentences, and `a → the` is a rule the notes never state. They are correct, but
they are ours, and the distinction is now checked rather than claimed. It carries 10 topics, 152 lessons and 16 reference tables, and
every page reads from it — the sidebar, the topic lists, the counts and the
reference section cannot drift from the curriculum.

| Topic | Lessons | Groups |
|---|---|---|
| 1 Tenses | 12 | Present, Past, Future |
| 2 Verbs | 16 | Verb forms, Auxiliary, Modal |
| 3 Nouns & pronouns | 14 | Nouns, Pronouns, Personal, This/that |
| 4 Articles | 4 | — |
| 5 Prepositions | 36 | Place, Direction, Time, Other |
| 6 WH words | 14 | — |
| 7 Adjectives | 17 | — |
| 8 Adverbs | 14 | — |
| 9 Conjunctions | 5 | — |
| 10 Sentence formation | 20 | Positive, Negative, Question, Yes/No, Imperative, Exclamatory |

There is no demo progress data, because there is no progress feature — see
below.

### Where the app departs from the source

The notes contain errors. The app teaches the correct form and says so — see
the Corrections section at the foot of the reference page, which lists all
17. They fall into four kinds:

- **Grammar** — the present-perfect mislabelling, the unreal `has been being`
  forms, the reversed `may`/`might` likelihoods, `She eat an apple`,
  `He run across the road`, `His came from the office`.
- **Tamil** — a wrong gloss for *below*, and `cried → அழைத்தேன்`, which means
  "called".
- **Column headings** — `Conjunction` used twice, `English Example` used twice,
  three headings above four-cell rows, `Subjust` / `Possesive`.
- **Table shape** — the pronoun grid drops its repeated Persons and Numbers
  labels and anchors `Third Person / singular` to *She*, three rows into its own
  group; its reflexives are written as two words (`Him self`, `Them selves-`)
  and `Then` stands in for `Their`.
- **Lost in the port** — every sentence-formation row packs its pattern, its
  English and its Tamil into one cell with no separator, and the port kept only
  the first two, dropping the Tamil for that whole topic. One exclamatory row
  went missing entirely. Both restored; the topic is 20 rows.

Most corrections are applied to the rows themselves, not only logged — the
formation diagram draws whatever sentence its row carries, so an uncorrected row
would be a diagram of the mistake. Three are **annotations rather than
rewrites**: the tense table's mislabelled present-perfect example and the unreal
`has been being` auxiliaries are left as the notes wrote them, because
correcting them would mean inventing English and Tamil the notes do not contain.
`verify-curriculum.cjs` lists exactly which, so the difference stays visible.

---

## Deliberate design decisions

**Paper & green, on a neutral ground.** The accent has exactly one job: mark the
word that changed, the active chip, the primary button. Nowhere decorative.

The background is deliberately **neutral, not cream**. Every scene is wood,
brick, terracotta and a bright orange ball, and a warm page behind warm artwork
flattens both — the old `#f7f5f0` sat 7 points warm (red above blue). `#fafaf9`
is within one point of neutral, so the drawings are the only warm thing on the
page. Pure white was tried and rejected: `--surface` is white, and with a white
background cards stop reading as raised.

Every text token clears WCAG AA in both light and dark. `--muted` was `3.5:1` and
failed — it is now `5.2:1`. Ratios are recorded beside the values in
`tokens.css`; re-check them rather than eyeballing if you change a colour.

**Tamil is not a toggle.** Every sentence, label, topic title and explanation
carries both languages at all times. Settings shows it as "always on" rather than
offering a switch. A missing Tamil string is a content error that fails
validation, not a fallback to English.

**There is no progress tracking.** No seen counts, no completion bars, no
"continue where you left off", no reset-progress dialog. Every topic and lesson
is reachable from the sidebar at any time, so there is nothing to unlock and
nothing to report. The only thing stored about a learner is their display
preferences.

**"Cannot draw" is a screen, not an error.** A hand-drawn vocabulary covers a few
hundred words at most, so learners meet it often. It names the words it did not
know and offers the nearest drawable sentence. It is styled warm, not red.

**404 does not redirect.** The bad path stays in the address bar so it can be
reported.

---

## Known gaps

- **Two of five renderers are live.** `scene.js` implements `place` and
  `timeline`. `path`, `actor` and `relation` are specified in engines 12, 14 and
  15; their output is catalogued in `scenes-catalogue.html` as static scenes.
- **No animation.** Knob changes redraw instantly. The node-diff transition is
  engine 20; the prototype proves the state change, not the tween.
- **Tamil webfont is the system stack.** The app must ship a subset — see
  `assets/fonts/README.md` and open question 1 in `architecture.md`.
- **Icons are unicode glyphs**, so the prototype stays dependency-free. See
  `assets/icons/README.md` for the set engine 03 needs as SVG.

## History

An earlier prototype was 11 pages, 4 CSS files and 2 JS files — 5,144 lines —
built before the product concept had settled, and thrown away. It was replaced by
three concept files, which settled the concept but did not conform to the
mandated structure. This version restores the structure now that the content
source exists and the concept is proven. The two concept files survive under
`pages/` because their content is still the best evidence the idea works.
