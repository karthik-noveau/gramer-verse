# Engine 24 — Topic Page

> Band E — pages. One responsibility: **the route `/topics/:topicId` — one topic's lessons, grouped**

---

## Objective

Build the lesson list for one topic from `ui-prototypes/pages/topic.html`, including the group tabs that prepositions needs and a resume action.

---

## Scope

**In scope**

- The topic's own source table(s), rendered **above** the lesson list
- Lesson rows with bilingual titles and example sentences
- Group tabs where a topic defines groups
- Breadcrumbs
- All four states plus unknown-id handling

**Out of scope**

- The lesson itself — engine 25

---

## Dependencies

Engines 01–05, 08.

---

## Files to create

```text
src/pages/topic/{index.tsx,styles.module.css}
src/pages/topic/components/LessonRow/{LessonRow.tsx,LessonRow.test.tsx,styles.module.css}
src/pages/topic/index.test.tsx
```

## Files to modify

`src/pages/topic/index.tsx` — replace the placeholder.

---

## Implementation steps

1. Read `topicId` from the route and select the topic; an unknown id renders `EmptyState` with a link to `/topics` and leaves the URL alone.
2. Build `LessonRow` with number, bilingual title and its example sentence.
3. Render the topic's tables first, using the shared `SourceTable` component — the same one the reference page uses, so a fix lands in both. Reading the whole topic at once is faster than stepping through lessons, and a topic with no table says so rather than rendering an empty region.
4. Render group tabs when the topic declares groups, and a flat list when it does not — prepositions has four groups, most topics have none.
4. Link "Start" to the first lesson in the topic. There is no progress record, so there is no "resume".
5. Set breadcrumbs to Topics / this topic.

---

## Acceptance criteria

- Lessons render in order with both languages
- Groups render as tabs where declared, flat otherwise
- Start links to the first lesson in the topic
- Unknown topic id renders the empty state and preserves the URL
- Breadcrumbs are correct

---

## Edge cases

- Unknown id renders the empty state with a way back — not a redirect, so the bad URL stays visible.
- Group tabs must not appear for a topic with a single implicit group.

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

- Renders lessons in order
- Unknown id renders the empty state, URL unchanged
- Group tabs appear only when groups are declared
- Start links to the first lesson

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
