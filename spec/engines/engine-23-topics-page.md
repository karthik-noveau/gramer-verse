# Engine 23 — Topics Page

> Band E — pages. One responsibility: **the route `/topics` — the way in, and every topic**

---

## Objective

Build the topic index from `ui-prototypes/pages/topics.html`: ten cards with bilingual titles, summaries and lesson counts, plus the two entry points that are not a topic — Practice and Reference.

This is the only way in. There was a separate `/dashboard` engine that rendered the same grid from the same content under a different heading; with no progress in this product it had nothing to report that this page does not already say, and its own spec called for folding one into the other if they ever diverged. They did.

---

## Scope

**In scope**

- Topic card grid from `content.store`
- Lesson count per topic, and the totals in the page subtitle
- Entry points to Practice and Reference
- Empty state when content carries no topics
- Loading and error states

**Out of scope**

- Lesson lists — engine 24
- A second index route. `/dashboard` redirects here; it does not render.
- Progress, streaks, "continue where you left off" or activity history — none
  exist in this product, and a page must not invent filler metrics to fill space

---

## Dependencies

Engines 01–05, 08.

---

## Files to create

```text
src/pages/topics/{index.tsx,styles.module.css}
src/pages/topics/components/TopicCard/{TopicCard.tsx,TopicCard.test.tsx,styles.module.css}
src/pages/topics/index.test.tsx
```

## Files to modify

`src/pages/topics/index.tsx` — replace the placeholder.

---

## Implementation steps

1. Build `TopicCard` with number, bilingual title, bilingual summary and a lesson count.
2. Render the ten topics in teaching order from `content.store`.
3. Take the lesson count from the topic's `lessonIds` length — derived on read, never stored.
4. Derive the subtitle's totals by counting, never by typing them. The prototype's old dashboard read "Ten topics" in English above "ஒன்பது" — nine — in Tamil, because the number was written twice by hand and only one copy was updated when conjunctions were split out.
5. Add the Practice and Reference cards below the grid, reachable in one click.
6. Implement all four states; content with no topics renders `EmptyState`.
7. Redirect `/dashboard` to `/topics` so any saved link still lands somewhere.

---

## Acceptance criteria

- Ten topics in teaching order
- Lesson counts match the content, and the subtitle's totals are counted from it
- Practice and Reference are reachable in one click
- `/dashboard` resolves here rather than 404ing
- Loading shows skeletons, error shows the failing rule
- Every card is bilingual

---

## Edge cases

- Unknown id renders the empty state with a way back — not a redirect, so the bad URL stays visible.
- A topic with zero lessons must show 0 / 0 rather than dividing by zero.
- Every topic is clickable; nothing is ever locked or dimmed.
- No second page may render this grid. If one is ever wanted, it takes over this route rather than sitting beside it.

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

- Renders ten cards in order
- Lesson counts match the content
- The subtitle's topic and lesson totals equal the content's, in both languages
- Practice and Reference links resolve
- `/dashboard` redirects to `/topics`
- Loading and error states render

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
