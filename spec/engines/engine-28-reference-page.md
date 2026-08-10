# Engine 28 — Reference Page

> Band E — pages. One responsibility: **the routes `/reference` and `/reference/:tableId` — the source tables, browsable**

---

## Objective

Build the reference section from `ui-prototypes/pages/reference.html`: the tables from the source notes, filterable, with every correction to the source clearly marked.

---

## Scope

**In scope**

- Modal verbs, personal pronouns, main verbs, tense forms, what-can-be-drawn
- Filter within a table
- Scroll-spy side navigation
- Correction callouts wherever the app departs from the source

**Out of scope**

- Editing content
- Any lesson interaction

---

## Dependencies

Engines 01–05, 08.

---

## Files to create

```text
src/pages/reference/{index.tsx,styles.module.css}
src/pages/reference/components/ReferenceTable/{ReferenceTable.tsx,ReferenceTable.test.tsx,styles.module.css}
src/pages/reference/index.test.tsx
```

## Files to modify

`src/pages/reference/index.tsx` — replace the placeholder.

---

## Implementation steps

1. Render each table from content, not from markup, so the reference cannot drift from what the lessons teach.
2. Build `SourceTable` on the shared `Table` with a filter input. The topic page (engine 24) uses the same component — do not fork it.
   - The last two columns — the row's drawing and its formation button — share one heading, `Visualization`, spanning both.
   - A run of identical values in the **first** column collapses into one cell with `rowSpan`. The source repeats `First Person` twice and `Third Person` four times, once per pronoun; printed on every row it reads as four kinds of third person. First column only, adjacent runs only, and never an empty value — some source rows drop that cell and would otherwise merge into one tall blank.
3. Implement the side navigation with scroll-spy, and support `:tableId` as a deep link that scrolls to and marks that table.
4. Render a correction callout wherever `content/README.md` records a departure from the source — the tense labels and the modal likelihoods at minimum. Learners deserve to know where their notes were wrong.
5. Mark undrawable verbs in the verb table, so the vocabulary limit is visible rather than only discovered in practice.

---

## Acceptance criteria

- All five tables render from content
- Filtering narrows rows within a table
- `:tableId` deep-links and marks the right entry
- Every correction is visible and explained
- Undrawable verbs are marked

---

## Edge cases

- Unknown id renders the empty state with a way back — not a redirect, so the bad URL stays visible.
- Wide tables scroll inside their wrapper; the page never scrolls sideways.
- A filter matching nothing shows an empty state inside the table, not a blank area.
- Scroll-spy must not fight a deep-link scroll on first paint.

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

- Each table renders with the expected row count
- Filter narrows rows and empty result shows a message
- `:tableId` scrolls to and marks the table
- Correction callouts render
- Undrawable verbs are marked

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
