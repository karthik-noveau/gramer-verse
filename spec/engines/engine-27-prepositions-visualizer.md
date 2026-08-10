# Engine 27 — Prepositions Visualizer

> Band E — pages. One responsibility: **the route `/topics/prepositions/visualizer` — every preposition, drawn**

---

## Objective

Build the visualizer from `ui-prototypes/pages/visualizer.html`: chips for the source's five preposition tables, a picker for the prepositions in the chosen one, and the picture.

It sits **under Prepositions**, not at the top level, because the scene engine draws a figure against a ground — which is what a preposition of place is. No other topic has anything for it to stage, so a standalone `/topics/prepositions/visualizer` route promised more than the engine could deliver. `/practice` redirects here.

Two modes, and the page must say which it is in:

- **Scene** — the six relations the place renderer stages (`in`, `on`, `under`, `above`, `behind`, `beside`). Everything is live: the figure, ground, article, number and adjective knobs, the generated sentence, and a word order diagram derived from the scene.
- **Diagram** — every other preposition. It has a drawing and the notes give it a sentence with an authored word-order map, so both are shown; the scene knobs are hidden and a note says why. A knob that changes nothing is worse than no knob.

---

## Scope

**In scope**

- A text input that draws on Enter, and example chips that fill and draw in one click. No submit button: a form with a single text field submits on Enter by itself, so a button is a second control for the one action the field already performs
- Rendering the resolved scene with a knob bar
- Two columns. **Reading left** — the text input, the two sentence lines, the word-order diagram. **Doing right** — the drawing, the preposition picker, the knobs, so the picture sits directly above the control that moves it. Neither column is pinned: the right one is taller than the viewport, and pinning it only fought the scroll. Below 1100px it collapses to one column with the drawing and its controls first
- The `CannotDraw` outcome
- `visualizer.store.ts`

**Out of scope**

- The resolver — engine 26
- Saving sentences between sessions
- A control for how much English is shown. The staged reveal belongs to the lesson
- A side rail. There is no colour key: the colours are already legible in place, on the word and the drawing at the same time
- A row of picture-word cards under the sentence. It restated the sentence a third way — after the drawing and the two lines — and each card carried its own Tamil, pronunciation and English
- A pronunciation line. The sentence is shown twice, Tamil and English; a third line respelling the English in Tamil letters was a third way of writing what was already there

---

## Dependencies

Engines 01–05, 16, 17, 19, 26.

---

## Files to create

```text
src/pages/visualizer/{index.tsx,styles.module.css}
src/pages/visualizer/index.test.tsx
src/store/visualizer.store.ts
src/store/visualizer.store.test.ts
```

## Files to modify

`src/pages/visualizer/index.tsx` — replace the placeholder.

---

## Implementation steps

1. Build the input form with example chips that fill and draw in one click. No submit button — the field draws on Enter.
2. On submit, resolve and either render the scene with knobs, or render `CannotDraw`.
3. Derive knob options from the resolved spec so the learner can keep exploring from their own sentence.
4. Let the suggestion button re-draw the nearest drawable sentence.
5. Keep both sentence lines visible — the visualizer is still bilingual. Neither line is labelled: which language it is in is legible from the script, and the label was the widest thing in a column with none to spare. `lang` goes on the line element so it is still announced correctly.

---

## Acceptance criteria

- A drawable sentence renders with working knobs
- An undrawable one renders `CannotDraw` with the words named
- The suggestion re-draws the nearest sentence
- Both languages render

---

## Edge cases

- Unknown id renders the empty state with a way back — not a redirect, so the bad URL stays visible.
- Turning a knob after resolving changes the picture but must not rewrite the input field — the learner's text is theirs.
- A very long input must not break the layout; clamp and scroll.

---

## Validation checklist

- [ ] Folder structure matches `codebase-guide.md`
- [ ] File and folder naming follows the convention
- [ ] Import order correct; no unused imports; no circular imports
- [ ] No cross-page imports
- [ ] Zustand: one domain per file, derived values computed not stored
- [ ] Components never read JSON directly — always through `common/api`
- [ ] CSS Modules only; every colour from `theme/colours.css`
- [ ] Accessibility: semantic HTML, keyboard support, visible focus, ARIA
- [ ] Error handling: loading, empty, error and success states all present
- [ ] Performance: no needless re-renders, expensive work memoised
- [ ] Documentation updated where behaviour changed
- [ ] Tests written and passing

---

## Test cases

- Drawable sentence renders scene and knobs
- Undrawable renders `CannotDraw`
- Suggestion re-draws successfully
- Example chips fill and draw
- Enter in the text field draws, with no submit button present

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
