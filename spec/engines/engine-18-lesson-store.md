# Engine 18 — Lesson Store

> Band D — lesson mechanics. One responsibility: **knob state for the open lesson, and the scene derived from it**

---

## Objective

Hold the state of the lesson currently open — which lesson, what each knob is set to, and whether the predict step has been answered — and derive the scene spec from it. Derived, never stored.

---

## Scope

**In scope**

- `lesson.store.ts` — `lesson`, `knobs`, `predictState`
- Actions: `open`, `close`, `setKnob`, `answer`, `reset`
- `deriveScene(lesson, knobs) → SceneSpec` as a pure selector
- `useLessonScene` hook

**Out of scope**

- Rendering knobs — engine 19
- The reveal choreography — engine 21

---

## Dependencies

Engines 01, 06, 08, 16.

---

## Files to create

```text
src/store/lesson.store.ts
src/store/lesson.store.test.ts
src/pages/lesson/hooks/useLessonScene.ts
src/pages/lesson/hooks/useLessonScene.test.ts
```

## Files to modify

None.

---

## Implementation steps

1. Write the store holding the open lesson, a knob map and the predict state. `open()` seeds knob values from the lesson's opening scene spec so the picture matches the sentence on arrival.
2. Write `deriveScene` as a pure function from lesson plus knob state to `SceneSpec`. It is a selector, not stored state — storing the derived spec is the specific mistake `codebase-guide.md` forbids.
3. Make `setKnob` validate the value against that knob's declared options and reject anything else, so a stale UI cannot push an impossible state into the scene.
4. Reset knob state on `close`, so navigating between lessons never leaks the previous lesson's settings.
5. Track which knob changed most recently, since engine 19 needs it to flash the right word.
6. Keep the whole path synchronous — a knob turn has no async step and must not introduce one.

---

## Acceptance criteria

- Opening a lesson seeds knobs so scene and sentence agree immediately
- `setKnob` rejects values outside the knob's options
- The scene spec is derived on read, never stored
- Closing resets state; opening a second lesson starts clean
- The most recently changed knob is recorded

---

## Edge cases

- Opening the same lesson twice must reset rather than resume — a lesson is not a document.
- A knob whose value is invalid for the current scene arm (asking for `between` with one ground) must be rejected at `setKnob`.
- Navigating away mid-predict then returning restarts the predict step.
- `deriveScene` must be referentially stable for unchanged input or the memo in engine 16 never hits.

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

- `open` seeds knobs from the lesson's scene
- `setKnob` with a valid value updates; with an invalid value does not
- `deriveScene` is pure and referentially stable for equal input
- `close` resets; reopening starts clean
- Last-changed knob is tracked

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
