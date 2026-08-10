# Engine 29 — Formation Diagram

> Band C — the scene engine. One responsibility: **the word-order diagram, and the alignments it is drawn from**

**Build order note.** This engine is numbered 29 because it was specified after
the bands were fixed, but it is a Band C component and must be built **before
engines 27 and 28**, which both render it. It depends on nothing after engine 10.

---

## Objective

Build `common/components/Formation` from `ui-prototypes/assets/js/formation.js`.

English and Tamil say the same thing in a different order, and sometimes with a
different number of words. Telling a learner that is a rule to be believed.
Drawing a line from each English word to the Tamil word that does its job makes
it something they can see:

- the lines cross, because the verb moves to the end
- two lines land on one Tamil word, because English needs `in` + `the box` where
  Tamil fuses both into `பெட்டியில்`
- some English words have no line at all, because Tamil has no article

It is rendered in two places: under a source-table row when its **formation**
button is opened (engine 28, and the topic page through the same component), and
under the sentence on the visualizer (engine 27).

---

## Scope

**In scope**

- The diagram: Tamil above, English below, one curve per shared role, both rows
  spread evenly across a fixed width. The curve is a vertical-tangent bezier so
  lines that cross stay readable where they overlap
- Fusion: a Tamil token carrying two roles takes two curves, and is the only
  token captioned — with its role names in Tamil, because it is the one thing on
  the picture that needs saying
- The note above the diagram, derived from the alignment rather than authored
  per row, so it can never drift from what is drawn
- The alignment table, keyed `tableId#rowIndex`
- `fromScene(state)` — the same diagram for a live scene, which needs no
  authored alignment because the sentence was built slot by slot and every token
  already knows its job

**Out of scope**

- Any sentence text of its own. Every English and Tamil string in the alignment
  table is copied from the row it belongs to, after the corrections in content;
  a diagram of an uncorrected sentence would be a diagram of the mistake
- The formation button and the row it opens into — engine 28
- A heading. "The word order is different" is what the drawing shows; naming it
  first made the card explain its own picture

---

## Dependencies

Engines 01–03, 06–08, 09–10.

---

## Files to create

```text
src/common/components/Formation/{Formation.tsx,Formation.test.tsx,styles.module.css}
src/content/formation.json
```

---

## The alignment data

**It cannot be derived.** Nothing in the source says which Tamil word carries
`in`, and guessing would draw confident wrong lines. So it is authored per row.
107 rows are covered:

| Table | Rows aligned |
|---|---|
| articles | 3 |
| prep-common | 6 |
| prep-place | 10 |
| prep-time | 6 |
| prep-dir | 8 |
| prep-other | 6 |
| tense-forms | 8 of 12 |
| modals | 10 |
| wh-words | 14 |
| adjectives | 17 |
| adverbs | 14 |
| conjunctions | 5 |

Plus a by-word fallback that builds `X is here` for each personal pronoun, so
the pronouns table is covered by its words rather than by row index — that table
is ragged and some rows drop their leading cell.

**Deliberately not covered.**

- `main-verbs` (47 rows) and `auxiliary` (4) carry verb *forms*, not sentences.
  A diagram aligns one sentence to another; there is nothing to align until
  example sentences are written for them in both languages.
- Four `tense-forms` rows — the `has been being`, `had been being` and
  `will have been being` forms. Correction 1 records that these are not real
  English and are dropped, so drawing one would be a picture of the mistake made
  in the app's own hand.

---

## Roles

Eight, all from `theme/colours.css` (engine 02). A trailing digit makes a second
word of the same job — two places in one sentence — without inventing a colour
that would mean nothing.

`det` · `figure` · `rel` · `ground` · `be` — the scene's own five, taught by the
legend and used identically in the drawing and the picture-words.

`qual` · `ask` · `join` — an adjective or adverb, a question word, a conjunction.
These exist only here, for the tables the diagram reaches beyond the scene.

---

## The note

One line per card, **Tamil only**. It is the one thing on the card written for a
reader who has no English yet — everything else is the English sentence, the
diagram of it, and the row it came from. It says only what the alignment
contains:

- a fusion — `ஆங்கிலத்தில் இரண்டு சொல் — in + the box. தமிழில் ஒரே சொல் — பெட்டியில்.`
- an orphan — `am — தமிழில் தனிச் சொல் இல்லை.`

A row with neither says nothing at all and shows the picture instead; 54 of the
107 carry a note, 53 do not. Nothing is said about the verb moving to the end —
it is true of every row, so it printed on every card, and the crossing lines say
it better than a sentence repeated a hundred times.

---

## Implementation steps

1. Port the alignment table to `content/formation.json`, keyed `tableId#rowIndex`, with the English and Tamil strings copied from their rows.
2. Build the shorthand parser: `word:role | word:role`, where a word with no colon has no counterpart on the other side, and `word:roleA:roleB` is a fusion.
3. Render the diagram as SVG: two rows of tokens, one curve per shared role, a caption on the fused token only.
4. Derive the note from the alignment — fused tokens and role-less English tokens — never authored per row.
5. Implement `fromScene` so the visualizer's live scene gets the same diagram without an authored entry.
6. Validate at build: every key resolves to a real table row, and every alignment's strings match that row's after corrections.

---

## Acceptance criteria

- Every authored alignment renders without a missing or crossed-to-nothing curve
- A fused Tamil token draws two curves and carries its role caption
- An English word with no counterpart draws no curve and is named in the note
- The note is Tamil only, one line, and empty when the row has nothing to report
- `fromScene` produces the same component with no authored data
- Alignment strings equal the row's own strings — checked, not assumed

---

## Edge cases

- A row whose alignment is missing must render nothing rather than an empty frame — the formation button is not offered for it in the first place.
- The diagram is inserted into a table as a row of its own; where the first column is merged across rows, that merged cell has to grow to take the panel in — see engine 28.
- Tamil words quoted inside any English text need `lang="ta"` or they are set in the Latin stack and the glyphs come out wrong.
- Roles carry a trailing digit for repeats; every consumer must strip it before looking up a colour or a label.

---

## Validation checklist

- [ ] Folder structure matches `codebase-guide.md`
- [ ] File and folder naming follows the convention
- [ ] Import order correct; no unused imports; no circular imports
- [ ] No cross-page imports
- [ ] Components never read JSON directly — always through `common/api`
- [ ] CSS Modules only; every colour from `theme/colours.css`
- [ ] Accessibility: the SVG carries the sentence pair as its label
- [ ] Error handling: a missing or malformed alignment fails validation at build, not at render
- [ ] Performance: the diagram is memoised on its spec
- [ ] Documentation updated where behaviour changed
- [ ] Tests written and passing

---

## Test cases

- Every key in `formation.json` resolves to a row, and its strings match that row
- A fusion renders two curves onto one token, with the caption
- An orphan English word renders no curve and appears in the note
- A row with neither renders the diagram and no note
- `fromScene` renders without an authored entry
- Role digits are stripped before colour lookup

---

## Completion checklist

- [ ] Implementation complete
- [ ] Acceptance criteria satisfied
- [ ] `npm run build` passes
- [ ] TypeScript passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm test` passes
- [ ] No `any`, `console.log`, `debugger`, TODO, FIXME, dead code or unused files
- [ ] `engine-status.md` updated to Complete
- [ ] `engine-status.md` updated; next engine started
