# Engine 15 — Scene Renderer — Relation

> Band C — the scene engine. One responsibility: **two items and a relation glyph, for conjunctions and the abstract prepositions**

---

## Objective

Render relationships that are not spatial: joining, contrasting, choosing, causing, comparing, accompanying, benefiting. These have no natural picture, so each is a schematic — which is honest, because the relation itself is abstract.

---

## Scope

**In scope**

- `relation.renderer.ts` — left item, right item, relation glyph
- Conjunctions: and, but, or, because, so
- Abstract prepositions: about, for, with, as, like, per
- Glyphs: brace, contrast slash, branch, cause arrow, similarity, rate pairs

**Out of scope**

- The other renderers
- Multi-clause sentence diagramming — not in this product

---

## Dependencies

Engines 01, 06, 09, 10.

---

## Files to create

```text
src/common/scene/renderers/relation.renderer.ts
src/common/scene/renderers/relation.renderer.test.ts
```

## Files to modify

None.

---

## Implementation steps

1. Port the six `other` scenes from `ui-prototypes/pages/scenes-catalogue.html`.
2. Model a relation as left item, right item and a glyph, so all eleven cases share one layout and differ only in the glyph and the label.
3. Conjunctions: `and` braces both, `but` sets them against each other, `or` branches, `because` points from cause to effect, `so` points from effect back to cause. The arrow direction is the entire difference between `because` and `so` and must be visibly opposite.
4. `like` shows similarity with an approximation glyph and two distinct items; `as` shows identity with a role badge on one item. Keeping these apart is the main job of this renderer.
5. `per` repeats a unit-and-value pair three times so the rate is visible as repetition rather than stated as arithmetic.
6. `for` draws an arrow to a beneficiary; `with` braces companions; `about` puts the topic in a bubble above the item.

---

## Acceptance criteria

- All eleven relations render distinguishably
- `because` and `so` have visibly opposite arrow directions
- `like` and `as` are not confusable — one shows similarity, the other identity
- `per` shows repetition, not a single pair
- Every scene carries a text label, since these glyphs are not self-explanatory

---

## Edge cases

- Abstract glyphs are the weakest pictures in the product; every one needs its label, and the label is part of the scene, not decoration.
- Two items of very different sizes unbalance the layout — normalise to a common height.
- `or` branches to two options and needs both drawn, unlike the others which take one item per side.
- These scenes are the most likely to be unclear in usability testing; keep them isolated in one renderer so they can be revised without touching the other four.

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

- One test per relation asserting the glyph and both items render
- `because` and `so` produce opposite arrow directions
- `like` and `as` produce different glyphs
- `per` emits three pairs
- Every relation scene includes a label node

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
