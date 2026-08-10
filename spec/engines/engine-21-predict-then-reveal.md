# Engine 21 — Predict-then-Reveal

> Band D — lesson mechanics. One responsibility: **ask before telling, and draw the wrong answer before the right one**

---

## Objective

Implement the lesson's question step. The scene starts in a question state with the knob under test hidden; after answering, a wrong answer draws what the learner actually described *before* animating to the truth, because the mistake teaches more than the correction.

---

## Scope

**In scope**

- `PredictCard` — question in both languages, options, hint
- `PredictResult` — side-by-side comparison of what was said and what is true
- The reveal choreography, including the wrong-answer-first path
- Unlocking the knob bar after answering
- A setting to skip the predict step

**Out of scope**

- Scoring, streaks or any gamification — explicitly a non-goal
- Storing answers beyond the session

---

## Dependencies

Engines 01, 03, 06, 18, 19, 20.

---

## Files to create

```text
src/pages/lesson/components/PredictCard/{PredictCard.tsx,PredictCard.test.tsx,styles.module.css}
src/pages/lesson/components/PredictResult/{PredictResult.tsx,PredictResult.test.tsx,styles.module.css}
src/pages/lesson/hooks/usePredict.ts
src/pages/lesson/hooks/usePredict.test.ts
```

## Files to modify

`src/store/lesson.store.ts` — the `answer` action and predict state.

---

## Implementation steps

1. Render the question in both languages with its options, and mark the stage as being in a question state so it reads as unresolved.
2. On a correct answer: reveal the explanation, unlock the knobs, confirm briefly. Do not celebrate — there are no points here.
3. On a wrong answer: set the scene to the *chosen* value first and hold it long enough to read, then animate to the correct value. Show both sentences side by side, labelled "what you said" and "what is true here".
4. Make the hold duration a named constant with a comment explaining it, since it is a pedagogical decision rather than a visual one.
5. Under reduced motion, show both states as a static side-by-side comparison rather than a timed sequence.
6. Unlock the knob bar in both paths — the learner explores either way.
7. Honour the setting that skips predict entirely, going straight to the unlocked lesson.

---

## Acceptance criteria

- The question renders in both languages and the stage reads as unresolved
- A correct answer reveals, explains and unlocks
- A wrong answer draws the chosen value first, then the correct one
- Both sentences appear side by side after a wrong answer
- Reduced motion replaces the sequence with a static comparison
- The skip setting bypasses the step entirely

---

## Edge cases

- Answering during the hold must not desynchronise the scene from the sentence — ignore input until the sequence completes.
- A lesson with `predict: null` renders unlocked with no question card and no empty space.
- The knob under test is hidden, not disabled, during the question, so it cannot be used to work out the answer.
- Navigating away mid-sequence must cancel the pending timer, or the store updates after unmount.
- A wrong answer whose value is not a valid option for the scene must still be drawable — validation in engine 07 guarantees it.

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

- Correct answer — reveals, explains, unlocks
- Wrong answer — scene shows the chosen value, then the correct one
- Both sentences render after a wrong answer
- `predict: null` renders no card
- Reduced motion — static comparison, no timed sequence
- Unmount during the sequence cancels the timer

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
