# Engine 25 — Lesson Page

> Band E — pages. One responsibility: **the route `/lessons/:lessonId` — the product**

---

## Objective

Compose the lesson workspace from `ui-prototypes/pages/lesson.html`. This engine is where the product becomes real, and it is deliberately small because engines 16 to 21 did the work.

---

## Scope

**In scope**

- Composition: idea callout, predict, sentence line, stage, knob bar, why rail, lesson navigation
- Next-lesson navigation across topic boundaries
- The notes drawer
- All four states

**Out of scope**

- Anything already owned by engines 16 to 21 — this page composes, it does not implement

---

## Dependencies

Engines 01–05, 08, 16, 17, 18, 19, 20, 21.

---

## Files to create

```text
src/pages/lesson/{index.tsx,styles.module.css}
src/pages/lesson/components/WhyNote/{WhyNote.tsx,styles.module.css}
src/pages/lesson/components/LessonNav/{LessonNav.tsx,styles.module.css}
src/pages/lesson/index.test.tsx
```

## Files to modify

`src/pages/lesson/index.tsx` — replace the placeholder.

---

## Implementation steps

1. Read `lessonId`, select the lesson, and open it in `lesson.store`. An unknown id renders `EmptyState`.
2. Compose the pieces in the prototype's order. `index.tsx` performs composition only — any logic here belongs in a hook or a store.
3. Wire next-lesson navigation through `getNextLesson`, rolling into the next topic and rendering an end-of-content state at the very end.
4. Put the source table in the notes `Drawer`.
5. Close the lesson in the store on unmount so nothing leaks into the next one.
6. Verify the whole loop end to end: predict, reveal, turn every knob, read both sentences, move to the next lesson.

---

## Acceptance criteria

- The full loop works: predict, reveal, knobs, both sentences, next
- `index.tsx` contains composition only
- Next rolls into the following topic and ends gracefully
- Unknown id renders the empty state
- Matches the prototype at every breakpoint

---

## Edge cases

- Unknown id renders the empty state with a way back — not a redirect, so the bad URL stays visible.
- Navigating between lessons must reset knob and predict state — engine 18 owns the reset, this page must actually trigger it.
- The last lesson of the last topic has no next; render an end state rather than a dead button.
- The right rail collapses under the picture below 1100px; the stage must not shrink below readable size.

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

- Renders the full workspace for a seeded lesson
- Predict, reveal and knob interaction work together
- Next navigates within a topic and across a topic boundary
- End of content renders the end state
- Unknown id renders the empty state

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
