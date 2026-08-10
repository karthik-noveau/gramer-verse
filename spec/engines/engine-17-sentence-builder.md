# Engine 17 — Sentence Builder

> Band D — lesson mechanics. One responsibility: **the bilingual sentence, with Tamil built independently rather than translated slot by slot**

---

## Objective

Turn scene state into an English sentence and a Tamil sentence. The two are built independently because Tamil marks place with a case suffix on the noun rather than a separate word, and orders its constituents differently. This is the module most likely to be silently wrong, which is why it is its own engine.

---

## Scope

**In scope**

- `sentence.ts` — `buildSentence(spec, knobs) → { en: Token[], ta: Token[] }`
- `utils/tamil.ts` — `caseFor(prep) → TamilCase` and the postposition table
- English assembly: determiner, adjective, noun, verb agreement, preposition, ground
- Tamil assembly: its own order, correct case on the ground noun, ஒரு / அந்த for the articles Tamil does not have
- Tokens tagged with the knob that produced them, so the changed word can be highlighted

**Out of scope**

- Rendering the sentence — engine 19
- Any scene drawing

---

## Dependencies

Engines 01, 06, 10.

---

## Files to create

```text
src/common/scene/sentence.ts
src/common/scene/sentence.test.ts
src/common/utils/tamil.ts
src/common/utils/tamil.test.ts
```

## Files to modify

None.

---

## Implementation steps

1. Port the proven builder from `ui-prototypes/assets/js/scene.js`, which was verified against every place preposition in both languages.
2. Build the English side as an ordered slot list. Handle `a` versus `an` by the following word's sound, and subject–verb agreement by count.
3. Build the Tamil side separately. Do not translate the English token list — order and structure differ, and a slot-by-slot mapping produces sentences that are individually plausible and wrong the moment a knob moves.
4. Implement `caseFor`: `in` takes the locative, `on` the genitive plus மீது, `under` the dative plus கீழே, and so on. The ground noun's ending changes; there is no separate Tamil word for the preposition.
5. Render the articles as ஒரு and அந்த — the gloss the source notes themselves use, since Tamil has no articles.
6. Tag every token with the knob key that produced it so engine 19 can flash exactly the word that changed, in both lines.
7. Emit tokens, not a string, and let the consumer join with real spaces. A CSS-gap-only sentence is read by screen readers as one unbroken word — this bug was found and fixed in the prototype.
8. Test every preposition against every ground and read the output aloud against the source notes.

---

## Acceptance criteria

- Every place preposition produces the correct Tamil case form on the ground noun
- `a` and `an` follow the sound of the next word, not its spelling
- Subject–verb agreement is correct at one, two and three
- Both lines carry knob tags on the tokens they came from
- Tokens join into text with real spaces, so `textContent` reads as a sentence
- Changing any knob leaves both sentences grammatical

---

## Edge cases

- `on the table` is மேசையின் மீது but `in the box` is பெட்டியில் — one takes a postposition, the other only a suffix. The table must encode both shapes.
- Plural Tamil nouns take case suffixes on the plural stem, not the singular.
- `an hour` and `a university` follow sound, not the letter — the rule cannot be a vowel-letter check.
- An adjective before a vowel-initial noun changes the article: `a red apple`, not `an red apple`. Decide on the adjective when one is present.
- Tamil has no indefinite–definite distinction, so ஒரு and அந்த carry more weight than the English articles; the lesson text must say so rather than implying a one-to-one mapping.

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

- Every place preposition × every ground — Tamil case form correct
- `a`/`an` — apple, hour, university, red apple
- Agreement at 1, 2 and 3
- Token knob tags match the knob that produced them
- Joined tokens contain real spaces
- Snapshot of both lines for each of the thirteen place lessons

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
