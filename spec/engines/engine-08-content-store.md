# Engine 08 — Content Store

> Band B — content. One responsibility: **one Zustand store that loads content once and selects from it**

---

## Objective

Hold loaded content in a single Zustand store with load-once semantics, and expose selectors the pages use. Derived values are computed in selectors, never stored.

---

## Scope

**In scope**

- `content.store.ts` — `status`, `topics`, `lessons`, `error`
- `load()` — idempotent; concurrent calls share one in-flight promise
- Selectors: `getTopic`, `getLesson`, `getLessonsForTopic`, `getNextLesson`
- `useContent` hook wrapping load-on-mount and the four states

**Out of scope**

- Lesson knob state — engine 18

---

## Dependencies

Engines 01, 06, 07.

---

## Files to create

```text
src/store/content.store.ts
src/store/content.store.test.ts
src/common/hooks/useContent.ts
src/common/hooks/useContent.test.ts
```

## Files to modify

`src/App.tsx` — the shell's sidebar takes its ten topics from this store.

That was not in the original plan, and no other engine claimed it: engine 04
built the sidebar to render whatever list it is handed, and engines 05 to 07
had nothing to hand it. Left alone, the sidebar would have stayed empty until
some unnamed later engine noticed. `Layout` now reads the store, and marks the
active topic — which a lesson URL does not say, so the lesson is looked up and
asked which topic it belongs to.

---

## Implementation steps

1. Write the store with an explicit `status` of `idle | loading | ready | error` — never infer readiness from a non-empty array.
2. Make `load()` idempotent: if status is `ready` return immediately; if `loading` return the in-flight promise. Two pages mounting at once must not load twice.
3. Write selectors as pure functions over state. `getNextLesson` computes order from the topic's `lessonIds` and rolls into the next topic at the end — it is derived, never stored.
4. Store the validation error object, not a string, so `ErrorState` can render the file and rule.
5. Write `useContent` returning a discriminated union on status so pages cannot read `topics` before it is `ready`.
6. Test the concurrency case explicitly — it is the one that breaks in production and never in development.

---

## Acceptance criteria

- Content loads exactly once per session regardless of how many pages mount
- `status` is explicit and drives which of the four states a page renders
- Unknown topic or lesson id returns `undefined`, not a throw
- No derived value is stored
- Validation errors reach the store intact

---

## Edge cases

- Two pages mounting simultaneously must produce one load, not two.
- `getNextLesson` at the last lesson of the last topic returns `undefined` — the lesson page must render "you have reached the end", not crash.
- A store reset between tests is required or state leaks across test files.
- Content never invalidates: it ships with the bundle, so there is no refetch path and no staleness to handle.

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

- Load-once — two concurrent `load()` calls trigger one API call
- Status transitions idle → loading → ready, and idle → loading → error
- `getNextLesson` — mid-topic, end-of-topic rollover, end-of-content
- Unknown id returns undefined
- `useContent` — returns the right shape in each state

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
