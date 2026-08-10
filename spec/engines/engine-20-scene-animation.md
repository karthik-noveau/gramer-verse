# Engine 20 — Scene Animation

> Band D — lesson mechanics. One responsibility: **transition between two scene states by diffing node trees**

---

## Objective

Make the picture move when the state changes. Diff the previous and next node trees by id, then transition what moved, fade in what appeared and fade out what left. This satisfies the constraint that every lesson is drawn rather than static.

---

## Scope

**In scope**

- `diffScenes(prev, next) → { moved, entered, exited }`
- CSS transform transitions driven by the diff
- Enter and exit treatments
- `useReducedMotion`, honoured by applying final positions with no transition
- Interruption: a change mid-transition retargets rather than queues

**Out of scope**

- Timeline playback — this product has no scrubber
- Any change to the renderers

---

## Dependencies

Engines 01, 09, 16, 18.

---

## Files to create

```text
src/common/scene/diff.ts
src/common/scene/diff.test.ts
src/common/hooks/useReducedMotion.ts
src/common/components/Stage/useSceneTransition.ts
```

## Files to modify

`src/common/components/Stage/Stage.tsx` — apply transition classes from the diff.

---

## Implementation steps

1. Write `diffScenes` matching nodes by `id` across trees and classifying each as moved, entered, exited or unchanged. This is why engine 09 made ids required and meaningful.
2. Apply movement as a CSS `transform` transition on the group, not by animating x and y attributes — transforms are compositor-friendly and attribute animation is not.
3. Fade and scale entering nodes; fade exiting nodes and remove them on transition end.
4. Wire `useReducedMotion` to skip straight to final positions. Reduced motion means no motion, not fast motion.
5. Handle interruption: a knob turned during a transition retargets from the current position. Queuing produces a visible lag and makes the control feel broken.
6. Verify no layout thrash — the diff must not read geometry back from the DOM.
7. Check the heaviest transitions from the catalogue: three figures moving from `in` to `above` simultaneously.

---

## Acceptance criteria

- Changing a knob animates the affected nodes rather than replacing the picture
- Nodes keep identity across relation changes — the ball slides, it does not disappear and reappear
- Reduced motion applies final positions with no transition
- A change mid-transition retargets smoothly
- No frame drop on the heaviest scene

---

## Edge cases

- A node whose id changes between renders reads as exit-plus-enter and flickers. Id stability is a renderer contract, and this engine is where breaking it becomes visible.
- Exiting nodes must not capture pointer events while fading.
- Transitioning a scaled group must not compound scale with transform.
- Reduced-motion users still need the change to be perceptible — flash the sentence token even when the scene does not animate.
- Switching lessons entirely should not attempt to tween between unrelated scenes; treat it as a full replace.

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

- `diff.test.ts` — moved, entered, exited and unchanged classification
- Stable ids across a relation change produce moves, not enter/exit pairs
- Reduced motion produces no transition classes
- Interruption retargets rather than queues
- Lesson change is a replace, not a tween

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
