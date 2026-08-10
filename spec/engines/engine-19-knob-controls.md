# Engine 19 — Knob Controls

> Band D — lesson mechanics. One responsibility: **the control bar that changes the picture, and the sentence line that reacts**

---

## Objective

Build the controls the learner actually touches, and the bilingual sentence line that responds. Turning a knob changes the picture and flashes the word that changed, in both languages.

---

## Scope

**In scope**

- `KnobBar` — one group per knob, options as `Chip`s
- `SentenceLine` — English and Tamil, tokens from engine 17
- Flash animation on the changed token in both lines
- Full keyboard support: arrow keys within a group, tab between groups
- Locked state while the predict step is unanswered

**Out of scope**

- The predict step itself — engine 21
- Scene transitions — engine 20

---

## Dependencies

Engines 01, 03, 06, 17, 18.

---

## Files to create

```text
src/pages/lesson/components/KnobBar/{KnobBar.tsx,KnobBar.test.tsx,styles.module.css}
src/pages/lesson/components/SentenceLine/{SentenceLine.tsx,SentenceLine.test.tsx,styles.module.css}
```

## Files to modify

None.

---

## Implementation steps

1. Build `KnobBar` from `lesson.knobs`, one `role="group"` per knob with an accessible name in both languages, options as chips with `aria-pressed`.
2. Implement arrow-key navigation inside a group with a roving tabindex, so a group is one tab stop rather than six.
3. Build `SentenceLine` rendering tokens as inline spans joined by real spaces. Words bound to a knob get an underline; the token from the most recently changed knob gets the flash class.
4. Render the Tamil line with `lang="ta"` and the same flash treatment, so the learner sees both words change together — that simultaneity is the point of showing both.
5. Honour `prefers-reduced-motion` by skipping the flash.
6. Implement the locked state as `aria-disabled` plus reduced opacity while predict is unanswered — visibly present but inert, so the learner can see what is coming.

---

## Acceptance criteria

- Every knob renders with both labels and correct pressed state
- Arrow keys move within a group; tab moves between groups
- The changed word flashes in both lines
- Sentence text reads correctly with real spaces
- Locked knobs are inert and announced as disabled
- Reduced motion disables the flash

---

## Edge cases

- A knob with one option should render as a static label, not a single pressable chip.
- Long option lists wrap; the roving tabindex must follow visual order after wrapping.
- The Tamil token that changed is not always at the same index as the English one — flash by knob tag, never by position.
- Rapid clicking must not queue flashes; restart the animation instead.

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

- Renders one group per knob with both labels
- Clicking an option calls `setKnob` and updates `aria-pressed`
- Arrow keys move focus and selection within a group
- Changed token carries the flash class in both lines
- Locked state prevents interaction
- `SentenceLine` textContent contains spaces between words

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
