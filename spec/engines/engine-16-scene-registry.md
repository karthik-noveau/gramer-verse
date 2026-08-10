# Engine 16 — Scene Registry and Stage

> Band C — the scene engine. One responsibility: **exhaustive dispatch from SceneSpec to renderer, and the one React component that draws**

---

## Objective

Join the five renderers behind one exhaustive dispatch, and provide the single React component that turns a `SceneNode` tree into SVG. This is the only place in the scene engine that knows React exists.

---

## Scope

**In scope**

- `registry.ts` — `SceneKind → renderer`, exhaustive via `assertNever`
- `Stage` component — renders a node tree into `<svg>`
- Accessible description: English `aria-label` plus a visually hidden Tamil description
- Memoisation on `SceneSpec` identity

**Out of scope**

- Animation — engine 20
- Any knob or lesson logic

---

## Dependencies

Engines 01, 06, 09, 10, 11, 12, 13, 14, 15.

---

## Files to create

```text
src/common/scene/renderers/registry.ts
src/common/scene/renderers/registry.test.ts
src/common/components/Stage/{Stage.tsx,Stage.test.tsx,styles.module.css}
```

## Files to modify

None.

---

## Implementation steps

1. Write `registry.ts` as a switch over `spec.kind` ending in `assertNever`. Adding a sixth arm to `SceneSpec` without a renderer must fail the build — that is the intended pressure.
2. Write `Stage` taking `SceneSpec`, calling the registry and rendering nodes recursively into SVG elements. Use each node's `id` as its React key so the reconciler matches what the animation diff will match.
3. Require a `describe` function per renderer producing an English and a Tamil sentence describing the picture. A scene the screen reader cannot describe is an incomplete scene, per `architecture.md` §11.1.
4. Put the English on `aria-label` and the Tamil in a visually hidden element with `lang="ta"`.
5. Memoise on `SceneSpec` identity so an unrelated re-render does not recompute the tree.
6. Verify a knob change stays within one frame by measuring the full path from spec to DOM.

---

## Acceptance criteria

- All five kinds dispatch correctly
- A missing arm is a compile error, not a runtime one
- Every scene carries both descriptions
- Re-rendering with an identical spec does no work
- Spec to painted SVG completes within one frame for every scene in the catalogue

---

## Edge cases

- Node ids must be unique within a scene or React warns and the diff mismatches.
- A renderer returning an empty array should render an empty stage, not crash — an empty scene is a content bug that engine 07 should already have caught.
- `aria-label` on `<svg role="img">` is announced but the hidden Tamil is separate; both must be associated with the figure, not floating in the page.
- Memoising on identity means renderers must be pure — a renderer reading the clock or random breaks it silently.

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

- Each of the five kinds dispatches to the right renderer
- Type-level test — a non-exhaustive registry fails to compile
- `Stage` renders nodes to SVG with ids as keys
- Both descriptions are present and correctly tagged
- Identical spec twice does not recompute

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
