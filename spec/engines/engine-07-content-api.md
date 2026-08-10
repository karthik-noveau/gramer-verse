# Engine 07 — Content API

> Band B — content. One responsibility: **the only module in the codebase that reads JSON or touches storage**

---

## Objective

Build the data access layer: load topic and lesson JSON, validate it against the schema, and wrap Browser Storage. Nothing else in the codebase may import from `content/` or call `localStorage` directly.

---

## Scope

**In scope**

- `content.api.ts` — load topics and lessons
- `props.api.ts` — load the prop and verb lexicon
- `storage.api.ts` — typed read/write with graceful failure
- `validate.ts` — the six validation rules in `architecture.md` §5.1
- The seed content JSON for at least one complete topic

**Out of scope**

- Caching across calls and React state — engine 08
- Rendering anything

---

## Dependencies

Engines 01, 06.

---

## Files to create

```text
src/common/api/content.api.ts
src/common/api/props.api.ts
src/common/api/storage.api.ts
src/common/api/validate.ts
src/common/api/*.test.ts
src/common/constants/storage-keys.ts
src/content/topics.json
src/content/lessons/prepositions-place.json
src/content/lexicon/props.json
src/content/lexicon/verbs.json
src/content/curriculum.json
src/content/README.md
src/common/api/boundaries.test.ts
spec/tools/build-content.cjs
```

`build-content.cjs` is step 6b made repeatable: it reads `content.js` and writes
`topics.json` and `curriculum.json`, so the curriculum is ported rather than
retyped and can be regenerated when the source changes. `curriculum.json` is
that port — the source tables, the lesson lists and the corrections, which the
reference and topic pages render.

`boundaries.test.ts` enforces what this engine is for. "Only `common/api` reads
JSON or touches storage" is invisible in review once the codebase is large, so
it is a test: nothing outside `common/api` may import from `content/` or name
`localStorage`, the scene engine may not import React, the store or the API, and
no page may import another page.

## Files to modify

None.

---

## Implementation steps

1. Write `validate.ts` implementing all six rules from §5.1. Each failure returns a named error carrying the file and the rule, because `ErrorState` renders exactly that.
2. Write `content.api.ts` exposing `loadTopics()` and `loadLessons()`. Both validate before returning and throw a typed error on failure — they never return partial content.
3. Write `props.api.ts` for the lexicon, validating that every `PropId` referenced by a lesson exists.
4. Write `storage.api.ts` wrapping Browser Storage with typed keys from `storage-keys.ts`. Only display preferences are stored — there is no progress record. Every read is defensive: absent, unparseable and schema-invalid all resolve to the documented default without throwing.
5. Author `topics.json` with all ten topics, and `prepositions-place.json` with the thirteen place lessons from `ui-prototypes/pages/topic.html`. Both languages on every field.
6. Author the lexicon with the fifteen props, each carrying all five Tamil case forms.
6b. Port `ui-prototypes/assets/js/content.js` — the full curriculum already extracted from the source document (10 topics, 152 lessons, 16 tables) — into `content/`. It was generated from the source rather than retyped; regenerate rather than hand-edit if the source changes.
7. Write `content/README.md` recording every place the content deviates from the source notes and why — the tense-label and modal-likelihood corrections in `architecture.md` §12.3 go here.
8. Test validation by feeding it deliberately broken fixtures.

---

## Acceptance criteria

- A lesson missing its Tamil text fails validation with a named error
- A lesson referencing an unknown `PropId` fails validation
- A `Predict.answer` not among its options fails validation
- Duplicate lesson ids fail validation
- `storage.api` never throws — a full or blocked store degrades to the default
- No module outside `common/api` imports from `src/content/`
- `content/README.md` lists every deviation from the source

---

## Edge cases

- Private browsing throws on `localStorage.setItem`. Catch it and continue — the app works, preferences just do not persist. Surface it once as a toast, never as a blocking error.
- A quota-exceeded write must not corrupt the previous value.
- JSON imported through Vite is already parsed; validation still runs, because the type assertion at the import boundary is a lie until checked.
- Tamil strings containing only whitespace must fail the non-empty check.

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

- `validate.test.ts` — one test per rule, each with a broken fixture
- `content.api.test.ts` — loads and validates the seed content
- `storage.api.test.ts` — absent key, unparseable value, quota exceeded, blocked storage
- Lexicon completeness — every prop has all five Tamil cases

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
