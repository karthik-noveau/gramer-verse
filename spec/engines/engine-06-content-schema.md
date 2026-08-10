# Engine 06 — Content Schema

> Band B — content. One responsibility: **the TypeScript types every later engine is written against**

---

## Objective

Define the content and scene types from `architecture.md` §3.2, §4.2 and §5 in one place. This engine produces no behaviour — it produces the contract that makes engines 07 to 28 compile or fail.

---

## Scope

**In scope**

- `Topic`, `Lesson`, `Bilingual`, `Knob`, `Predict`, `SentenceTemplates`
- `SceneSpec` as a discriminated union on `kind`, one arm per renderer
- `SceneNode`, `PropId`, `Prop`, `PropWord`, `TamilCase`, `AnchorName`
- Branded id types for `TopicId`, `LessonId`, `PropId`, `VerbId`
- `assertNever` for exhaustive switches

**Out of scope**

- Any JSON, any runtime validation — engine 07
- Any renderer — Band C

---

## Dependencies

Engine 01.

---

## Files to create

```text
src/common/scene/types.ts
src/common/api/content.types.ts
src/common/scene/types.test-d.ts
src/common/utils/assertNever.ts
src/common/utils/assertNever.test.ts
```

**What the two type files are for.** `scene/types.ts` describes content that has
been validated: branded ids, Tamil known to be non-empty, a scene spec that is
one of exactly five kinds. `api/content.types.ts` describes the same content as
it sits in the JSON — the same fields with every guarantee removed, which is
what `JSON.parse` actually returns. Keeping them apart is what stops "it
typechecks" from being mistaken for "it was checked". A type-level test asserts
the two carry the same field names, so a field added to one and forgotten in the
other fails the build.

`NonEmptyString` is a brand that only `validate.ts` may mint. That is how
"`ta` is non-empty at the type level" is achieved: a plain string is not
assignable to a `Bilingual`, so unchecked content cannot reach a component.

## Files to modify

None.

---

## Implementation steps

1. Write `Bilingual` first and make `ta` required and non-empty at the type level where possible. Everything downstream depends on Tamil never being optional.
2. Define the branded id types so a `LessonId` cannot be passed where a `TopicId` is expected.
3. Write `PropWord` with the five Tamil cases from `architecture.md` §3.2, and `TamilCase` as `keyof PropWord['ta']`.
4. Write `Prop` with `box`, `surfaceY`, `inside`, `anchors`, `draw` and `word`. Every field `readonly`.
5. Write `SceneNode` with a required stable `id` — the animation diff in engine 20 depends on it and adding it later means touching every renderer.
6. Write `SceneSpec` as a union of five arms discriminated on `kind`. Each arm carries only what its renderer needs.
7. Write `Lesson`, `Topic`, `Knob`, `Predict` and `SentenceTemplates` per §5.
8. Write `assertNever` and prove the union is exhaustive with a compile-time test.

---

## Acceptance criteria

- `SceneSpec` has exactly five arms and every one is reachable
- A switch over `SceneSpec['kind']` missing an arm is a compile error
- No `any` anywhere in the file
- Every field is `readonly`
- Branded ids are not mutually assignable

---

## Edge cases

- Making `ta` optional "for now" defeats constraint 3 in `architecture.md`. It must be required from the first commit.
- `SceneNode.id` must be stable across renders — derived from the node's role, never from an array index that reorders.
- `inside` and `surfaceY` are legitimately null for props that are neither containers nor surfaces; `undefined` and `null` must not both be allowed.

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

- `types.test-d.ts` — type-level tests: exhaustive switch compiles, non-exhaustive fails, branded ids reject cross-assignment
- Compile-time only; no runtime assertions in this engine

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
