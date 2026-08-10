# Engine 09 — Scene Primitives

> Band C — the scene engine. One responsibility: **the SVG node constructors every renderer is built from**

---

## Objective

Build the lowest layer of the drawing engine: functions that produce `SceneNode` trees for rectangles, circles, paths, lines, text, arrows and shadows, plus the shared stage geometry. Pure functions returning plain data — no SVG strings, no JSX, no DOM.

---

## Scope

**In scope**

- `primitives.ts` — `rect`, `circle`, `ellipse`, `path`, `line`, `text`, `group`
- `arrow` with marker definitions, and `shadow`, `floorLine`, `ring`
- `layout.ts` — stage dimensions, `FLOOR`, and helpers for centring and rows
- Stable `id` generation for every node

**Out of scope**

- Any specific prop — engine 10
- Any renderer — engines 11 to 15
- React — engine 16 turns nodes into elements

---

## Dependencies

Engines 01, 06.

---

## Files to create

```text
src/common/scene/primitives.ts
src/common/scene/primitives.test.ts
src/common/scene/layout.ts
src/common/scene/layout.test.ts
```

## Files to modify

None.

---

## Implementation steps

1. Fix the stage coordinate system once: a 720 × 420 viewBox with `FLOOR` at y=336, ported from the prototype. Every renderer and prop is written against these numbers.
2. Write one constructor per SVG shape, each returning a `SceneNode` with `tag`, `attrs` and an `id`.
3. Make `id` a required argument, not generated. Node identity is a *semantic* decision — `figure-0`, `ground`, `arrow` — and the animation diff in engine 20 depends on it being meaningful and stable.
4. Write `text` taking anchor, size, weight and fill, defaulting to the token custom properties so scene text follows the theme.
5. Write `arrow` as a shaft and a head in one group. **No `<marker>`.** This
   step originally said to emit marker definitions, and the edge case below
   warned that marker ids must be unique per document or two scenes on one page
   share arrowheads. Drawing the head as geometry removes the failure instead of
   guarding against it: three points, no document-wide id, and nothing to
   collide. It also keeps the node tree inside the seven tags
   `architecture.md` §4.2 fixes — a `<marker>` is not one of them, and encoding
   one as data attributes on a path would have pushed the interpretation into
   whatever renders the tree.
6. Write `layout.ts` with `centreX`, `rowOfN` and `shadowFor` — the geometry every renderer repeats.
7. Reference colours as `var(--…)` in node attributes so scenes follow light and dark automatically. Illustrative prop colours are the deliberate exception and belong to engine 10.

---

## Acceptance criteria

- Every primitive returns a `SceneNode`, never a string
- Node ids are caller-supplied and stable across identical calls
- Text nodes carry the theme custom properties, not literal colours
- `layout.ts` exports the single definition of `FLOOR` and stage size
- No DOM or React reference anywhere in the module

---

## Edge cases

- Floating-point coordinates produce noisy diffs and blurry rendering — round to one decimal at construction.
- ~~Marker ids must be unique per document or two scenes on one page share arrowheads.~~ **Removed rather than handled** — see step 5. There are no markers.
- A group with no children should return an empty group, not `null`, so the diff has something stable to match against.
- Text is the one node whose visual size the engine cannot measure; renderers must not rely on measured text width for layout.

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

- Each primitive produces the expected tag and attributes
- Same arguments produce the same id, twice
- `arrow` emits its marker defs exactly once per scene
- `rowOfN` centres 1, 2 and 3 items correctly
- Coordinates are rounded

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
