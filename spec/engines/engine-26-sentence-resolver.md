# Engine 26 — Sentence Resolver

> Band E — pages. One responsibility: **free text to a scene spec, or an honest list of what could not be drawn**

---

## Objective

Turn a typed sentence into a scene, or explain precisely why it cannot be drawn. "Cannot draw" is a first-class outcome of this product, not an error path.

---

## Scope

**In scope**

- `resolver.ts` — tokenize, resolve against the lexicon, build a spec
- Separating unknown words from structural gaps — they are different failures
- Nearest-drawable suggestion
- `CannotDraw` component

**Out of scope**

- The practice page shell — engine 27
- Any grammatical parsing beyond what the scene needs

---

## Dependencies

Engines 01, 06, 07, 10, 16.

---

## Files to create

```text
src/pages/visualizer/utils/resolver.ts
src/pages/visualizer/utils/resolver.test.ts
src/pages/visualizer/components/CannotDraw/{CannotDraw.tsx,CannotDraw.test.tsx,styles.module.css}
```

## Files to modify

None.

---

## Implementation steps

1. Tokenize on whitespace, strip punctuation, lowercase. This is a lexicon lookup, not a parser — the product explicitly has no NLP library and needs none here.
2. Resolve each token against determiners, numbers, adjectives, prepositions, figures and grounds. Collect anything unmatched as an unknown word.
3. Track structural gaps separately: nothing to place, nowhere to put it. Reporting "rocket, (nowhere to put it)" as one list confuses two different problems — this was found and fixed in the prototype.
4. Build the scene spec when everything resolves.
5. Compute a nearest drawable sentence by substituting the closest known prop for each unknown word.
6. Build `CannotDraw` naming the unknown words, stating any structural gap separately, and offering the suggestion plus a link to what can be drawn. Style it warm, not red — it is not a failure of the learner.
7. Support plural forms by stripping a trailing s and raising the count.

---

## Acceptance criteria

- A fully resolvable sentence produces a valid spec
- Unknown words are named individually
- Structural gaps are reported separately from unknown words
- A suggestion is always offered
- `CannotDraw` reads as informative, not as an error

---

## Edge cases

- A word that is both adjective and noun (`orange`) must resolve by position, or be reported honestly as ambiguous.
- Plurals must raise the count and resolve the singular prop.
- An empty input is not an error — render nothing and prompt.
- A sentence with a known verb but no drawable action routes to `CannotDraw` with the verb named, per the engine 14 decision.
- Unknown words that are stop words (`very`, `quite`) should be ignored rather than reported.

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

- Resolves each prototype example sentence to the right spec
- Unknown word is named; structural gap is reported separately
- Plural raises the count
- Empty input prompts rather than erroring
- A suggestion is produced for every failure case

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
