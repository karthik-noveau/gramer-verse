# Engine 10 — Prop Library

> Band C — the scene engine. One responsibility: **the fifteen drawable things, each with a box, anchors and declined Tamil words**

---

## Objective

Build the prop registry. Every prop draws itself into a local box and declares its own anchors and its declined Tamil forms. This is what makes forty-plus scenes come out of fifteen things, and it is the most load-bearing module in the codebase.

---

## Scope

**In scope**

- `props/furniture.ts` — table, box, chair, door, car, shop
- `props/actors.ts` — man, woman, cat, dog
- `props/objects.ts` — ball, book, cup, apple, clock, tree

Sixteen, not the exact list above: `boy`, `girl` and `bird` are not drawn and
`building` is a `shop`, which is what the source's own sentences need (*he is
standing in front of the shop*). Nothing in the authored content asks for the
other three, and a prop nobody can name in a lesson is a drawing with no way
in. They are additions when a lesson needs them, not omissions.
- `props/index.ts` — the `PropId → Prop` registry
- Each prop's `box`, `surfaceY`, `inside`, `anchors`, `draw` and `word`
- All five Tamil case forms per prop

**Out of scope**

- Placing props on the stage — that is each renderer's job
- The verb lexicon — engine 14

---

## Dependencies

Engines 01, 06, 09.

---

## Files to create

```text
src/common/scene/props/{furniture.ts,actors.ts,objects.ts,index.ts}
src/common/scene/props/*.test.ts
```

## Files to modify

`src/content/lexicon/props.json` — the geometry came out of it.

It carried a `box`, `surfaceY`, `inside`, `clearance` and `anchors` for every
prop, written in engine 07 before any prop was drawn. Those numbers now exist in
two places, and they had already disagreed: the JSON said the ball was 64 wide
and the drawing made it 74. A prop's box is a fact about its drawing, so it
lives with the drawing; the JSON keeps the words, which is what validation
needs. `props.test.ts` asserts the two lists name the same props and say the
same words.

---

## Implementation steps

1. Port the proven geometry from `ui-prototypes/assets/js/scene.js` and `pages/scenes-catalogue.html` — these drawings were built and visually verified, so do not redraw them.
2. Give every prop a `box` and, where meaningful, a `surfaceY` (where things sit on it) and an `inside` rectangle (where things go in it). A table has a surface and no inside; a box has both.
3. Give every actor the four anchors — mouth, hand, foot, eye — in local coordinates. Engine 14 positions objects at these points and cannot work without them.
4. Fill in `word` for every prop: English singular and plural, and all five Tamil cases. Take the forms from the source notes where present and mark any addition in `content/README.md`.
5. Keep illustrative colours (wood, brick, skin) fixed across light and dark. Only the surface behind them changes — a brown table in dark mode is still brown.
6. Accept an optional `fill` on `draw` so the adjective knob can recolour a prop without a second prop.
7. Write the registry as a frozen record and prove at compile time that every `PropId` has an entry.

---

## Acceptance criteria

- Fifteen props, each with a complete `word` including all five Tamil cases
- Every actor exposes all four anchors
- Props never reference stage coordinates — they draw at the origin of their own box
- A prop with a `fill` argument recolours without changing shape
- `PropId` and the registry cannot drift apart without a compile error

---

## Edge cases

- `surfaceY` is not the top of the bounding box: a table's surface is 14px below its box top because the tabletop has thickness. Getting this wrong floats every object.
- Mirrored props (cat, dog, bird face right) must have anchors mirrored too, or the object lands behind the animal's head.
- Plural Tamil forms are not always the singular plus a suffix; take them from the source rather than deriving them.
- A prop's `inside` must be genuinely enterable — the ball must fit in the box at the sizes the place renderer uses.

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

- Every `PropId` resolves to a prop
- Every prop has non-empty English and all five Tamil cases
- Every actor has four anchors within its box bounds
- `draw()` returns nodes whose coordinates fall inside the declared box
- `draw(fill)` changes fill and nothing else

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
