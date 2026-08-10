# Engine Status

The single shared status file for the project. Never create another.

Updated when an engine starts, when it becomes blocked, and when it completes.
No guessed completion percentages.

---

## Current Engine

Engine        : Engine 29
Engine Number : 29
Name          : Formation Diagram
Status        : Complete
Current Phase : Complete — every engine is done

---

## Completed Functionality

- **The word-order diagram.** Tamil above, English below, one curve per shared
  job. The three things it exists to show are all visible: the lines cross
  because the verb moves to the end, two lines land on one Tamil word because
  English needs `in` + `the box` where Tamil fuses both into பெட்டியில், and
  some English words have no line at all because Tamil has no article
- **127 alignments**, ported from the prototype and keyed `tableId#rowIndex` —
  counting only the rows that are rows, because the source's group headings are
  not sentences
- **Every one of them checked against its row.** The key resolves to a table
  that exists, the row exists, and both the English and the Tamil string appear
  in that row. Checked, not assumed
- **The caption is on the fused word only**, in Tamil, because it is the one
  thing on the picture that needs saying
- **The note is derived from the alignment**, never authored per row, so it
  cannot drift from what is drawn — and a row with nothing to report says
  nothing at all and shows the picture instead
- **`fromScene`** gives a live scene the same diagram with no authored data:
  the sentence was built slot by slot, so every token already knows its job
- Rendered in both places it belongs — under a source-table row that has an
  alignment, and under the sentence on the visualizer

---

## Remaining Work

None. Every engine in `spec/engines/` is complete.

Two limits are recorded rather than outstanding, both of them facts about the
source rather than gaps in the build:

- `main-verbs` and `auxiliary` have no alignments, because they hold verb
  *forms* and a diagram aligns one sentence to another. Nothing to align until
  example sentences are written for them in both languages
- Tamil conjugates for person and gender and an `ActorSpec` carries neither, so
  an actor lesson's Tamil line is a phrase rather than a finite sentence
  (engine 17)

---

## Files Modified

```text
src/common/components/Formation/Formation.tsx        new
src/common/components/Formation/Formation.test.tsx   new — 12 tests
src/common/components/Formation/styles.module.css    new
src/content/formation.json                           new — 127 + 7 alignments
src/common/scene/types.ts                            the formation types
src/common/api/content.types.ts                      the raw shapes
src/common/api/validate.ts                           parseAlignment, validateFormation
src/common/api/content.api.ts                        loadFormation, formationFor
src/common/api/content.api.test.ts                   every alignment checked
src/common/components/Table/Table.tsx                afterRow
src/common/components/SourceTable/SourceTable.tsx    the formation button
src/pages/reference/*                                offers it per row
src/pages/visualizer/*                               shows it under the sentence
spec/engines/engine-status.md
```

**The alignments were ported by running the prototype, not by retyping it.**
127 entries of hand-authored data is 127 chances to mistype a Tamil word. The
prototype's own file was evaluated, its table serialised back into the
authoring shorthand, and the result checked against the source rows — which is
how the next thing was found.

**The keys count data rows, not table rows.** The prototype says so in a
comment and the check proved it: 29 of the 127 landed on the wrong sentence
until the group-heading rows were excluded from the numbering. With whitespace
normalised on both sides, all 127 then matched their row exactly.

**`Table` learnt to open a panel under a row.** Engine 28's step 2 describes
the formation button and the row it opens into; the component it opens did not
exist until now, so the two were finished together.

---

## Validation

```text
Build             ✔  tsc (both projects) clean, vite built in 204ms
TypeScript        ✔  zero errors
ESLint            ✔  zero errors, zero warnings
Unit Tests        ✔  67 suites, 1081 tests — 20 of them this engine's
Integration Tests ✔  every alignment checked against the real curriculum
```

Checks that were run rather than assumed:

```text
One curve per shared job                              ✔  four jobs, four lines
Two curves land on the fused Tamil word               ✔
…and it is the only word captioned                    ✔  தொடர்பு + இடம்
A word with no counterpart draws no curve             ✔  and is faded
The note says the fusion and the orphan, in Tamil     ✔  one line
…and says nothing when there is nothing to report     ✔
A repeat digit is stripped before a colour lookup     ✔  ground2 → ground
Both sentences are the drawing's label                ✔
`fromScene` builds the same shape with no data        ✔
…fusing the Tamil ground, because the relation is an
  ending on it                                        ✔
…and merging the bare article into the English ground ✔
Every key resolves to a table and a row               ✔  all 127
Every alignment quotes that row's own sentences       ✔  both languages
The verb-form tables are left alone                   ✔
A pronoun row is found by its word                    ✔  that table is ragged
The button is offered only where there is a diagram   ✔
```

**Looked at in the browser, both places.** On the visualizer, *the ball is in
the box* draws four curves with `in` and `the box` both landing on பெட்டியில்.
On the reference page, opening *The cat is under the table* shows `The` faded
and joined to nothing, the note *The — தமிழில் தனிச் சொல் இல்லை*, and three
lines crossing as the verb moves to the end.

---

## Last Updated

2026-08-10

---

## Completed Engines



✔ Engine 00 — Specification
✔ Engine 01 — Project Setup
✔ Engine 02 — Theme and Tokens
✔ Engine 03 — Common UI Components
✔ Engine 04 — App Shell and Navigation
✔ Engine 05 — Routing and Lazy Pages
✔ Engine 06 — Content Schema
✔ Engine 07 — Content API
✔ Engine 08 — Content Store
✔ Engine 09 — Scene Primitives
✔ Engine 10 — Prop Library
✔ Engine 11 — Scene Renderer — Place
✔ Engine 12 — Scene Renderer — Path
✔ Engine 13 — Scene Renderer — Timeline
✔ Engine 14 — Scene Renderer — Actor
✔ Engine 15 — Scene Renderer — Relation
✔ Engine 16 — Scene Registry and Stage
✔ Engine 17 — Sentence Builder
✔ Engine 18 — Lesson Store
✔ Engine 19 — Knob Controls
✔ Engine 20 — Scene Animation
✔ Engine 21 — Predict-then-Reveal
✔ Engine 22 — Landing Page
✔ Engine 23 — Topics Page
✔ Engine 24 — Topic Page
✔ Engine 25 — Lesson Page
✔ Engine 26 — Sentence Resolver
✔ Engine 27 — Prepositions Visualizer
✔ Engine 28 — Reference Page
✔ Engine 29 — Formation Diagram
